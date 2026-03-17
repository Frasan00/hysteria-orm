import { HysteriaError } from "../../../errors/hysteria_error";
import type { LoggerConfig } from "../../../utils/logger";
import { bindParamsIntoQuery, formatQuery } from "../../../utils/query";
import { AstParser } from "../../ast/parser";
import { DeleteNode } from "../../ast/query/node/delete";
import { FromNode } from "../../ast/query/node/from";
import { InsertNode } from "../../ast/query/node/insert";
import { OnDuplicateNode } from "../../ast/query/node/on_duplicate";
import { UpdateNode } from "../../ast/query/node/update";
import { WhereNode } from "../../ast/query/node/where";
import { InterpreterUtils } from "../../interpreter/interpreter_utils";
import { WriteOperation } from "../../query_builder/write_operation";
import { serializeModel } from "../../serializer";
import { SqlDataSource } from "../../sql_data_source";
import { SqlDataSourceType } from "../../sql_data_source_types";
import { execSql } from "../../sql_runner/sql_runner";
import { Model } from "../model";
import { ModelQueryBuilder } from "../model_query_builder/model_query_builder";
import { ModelWithoutRelations } from "../model_types";
import { getBaseModelInstance } from "../model_utils";
import {
  FindOneType,
  FindType,
  InsertOptions,
  ModelKey,
  ModelRelation,
  OrderByChoices,
  UpsertOptions,
  WhereColumnValue,
} from "./model_manager_types";

export class ModelManager<T extends Model> {
  protected sqlDataSource: SqlDataSource;
  protected sqlType: SqlDataSourceType;
  protected logs: boolean | LoggerConfig;
  protected model: typeof Model;
  protected modelInstance: T;
  protected astParser: AstParser;
  protected interpreterUtils: InterpreterUtils;
  protected replicationMode: "master" | "slave" | null = null;

  /**
   * @description Constructor for ModelManager class.
   */
  constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    this.model = model;
    this.modelInstance = getBaseModelInstance<T>();
    this.sqlDataSource = sqlDataSource;
    this.logs = this.sqlDataSource.logs;
    this.sqlType = this.sqlDataSource.getDbType();
    this.astParser = new AstParser(this.model, this.sqlType);
    this.interpreterUtils = new InterpreterUtils(this.model);
  }

  /**
   * @description Sets the replication mode for queries created by this model manager
   */
  setReplicationMode(mode: "master" | "slave"): this {
    this.replicationMode = mode;
    return this;
  }

  /**
   * @description Finds all records that match the input
   */
  async find<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(input?: FindType<T, S, R>): Promise<ModelWithoutRelations<T>[]>;
  async find<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(input?: FindType<T, S, R>): Promise<ModelWithoutRelations<T>[]> {
    if (!input) {
      return this.query().many() as unknown as Promise<
        ModelWithoutRelations<T>[]
      >;
    }

    const query = this.query();
    if (input.select) {
      query.select(...input.select);
    }

    if (input.relations) {
      input.relations.forEach((relation) => {
        query.load(relation);
      });
    }

    if (input.where) {
      this.handleWhereCondition(query as ModelQueryBuilder<T>, input.where);
    }

    if (input.orderBy) {
      Object.entries(input.orderBy).forEach(([key, value]) => {
        query.orderBy(key as ModelKey<T>, value as OrderByChoices);
      });
    }

    if (input.limit) {
      query.limit(input.limit);
    }

    if (input.offset) {
      query.offset(input.offset);
    }

    if (input.groupBy) {
      query.groupBy(...(input.groupBy as string[]));
    }

    return query.many({
      ignoreHooks: input.ignoreHooks || [],
    }) as unknown as Promise<ModelWithoutRelations<T>[]>;
  }

  /**
   * @description Finds the first record that matches the input
   */
  async findOne<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(input: FindOneType<T, S, R>): Promise<ModelWithoutRelations<T> | null>;
  async findOne<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(input: FindOneType<T, S, R>): Promise<ModelWithoutRelations<T> | null> {
    const results = await this.find({
      groupBy: input.groupBy,
      orderBy: input.orderBy,
      relations: input.relations,
      select: input.select,
      where: input.where,
      ignoreHooks: input.ignoreHooks,
      offset: input.offset,
      limit: 1,
    } as FindType<T, S, R>);

    if (!results.length) {
      return null;
    }

    return results[0];
  }

  /**
   * @description Finds the first record that matches the input or throws an error
   */
  async findOneOrFail<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(input: FindOneType<T, S, R>): Promise<ModelWithoutRelations<T>>;
  async findOneOrFail<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(
    input: FindOneType<T, S, R> & {
      customError?: Error;
    },
  ): Promise<ModelWithoutRelations<T>> {
    const result = await this.findOne({
      groupBy: input.groupBy,
      orderBy: input.orderBy,
      relations: input.relations,
      select: input.select,
      where: input.where,
      ignoreHooks: input.ignoreHooks,
      offset: input.offset,
    } as FindOneType<T, S, R>);

    if (result === null) {
      if (input.customError) {
        throw input.customError;
      }

      throw new HysteriaError(
        this.model.name + "::findOneOrFail",
        "ROW_NOT_FOUND",
      );
    }

    return result;
  }

  /**
   * @description Finds a record by its primary key
   * @description Ignores all model hooks
   * @throws {HysteriaError} if the model has no primary key
   */
  async findOneByPrimaryKey(
    value: string | number,
    returning?: ModelKey<T>[],
  ): Promise<ModelWithoutRelations<T> | null> {
    if (!this.model.primaryKey) {
      throw new HysteriaError(
        this.model.name + "::findOneByPrimaryKey",
        "MODEL_HAS_NO_PRIMARY_KEY",
      );
    }

    return this.query()
      .select(...(returning || []))
      .where(
        this.model.primaryKey as ModelKey<T>,
        value as WhereColumnValue<T, ModelKey<T>>,
      )
      .one({
        ignoreHooks: ["afterFetch", "beforeFetch"],
      }) as unknown as Promise<ModelWithoutRelations<T> | null>;
  }

  /**
   * @description Creates a new record in the database
   * @returns WriteOperation that executes when awaited
   */
  insert(
    model: Partial<T>,
    options: InsertOptions<T> = {},
  ): WriteOperation<ModelWithoutRelations<T>> {
    const rawInsertObject = Object.fromEntries(
      Object.keys(model).map((col) => [col, model[col as keyof typeof model]]),
    );

    const shouldDisableReturning =
      !options.returning || options.returning.length === 0;

    const insertNode = new InsertNode(
      new FromNode(this.model.table),
      [rawInsertObject],
      options.returning as string[],
      shouldDisableReturning,
    );

    const unWrapFn = () => {
      const result = this.astParser.parse([insertNode]);
      return {
        sql: result.sql,
        bindings: result.bindings,
      };
    };

    const toSqlFn = () => {
      const result = this.astParser.parse([insertNode]);
      return {
        sql: formatQuery(this.sqlDataSource, result.sql),
        bindings: result.bindings,
      };
    };

    const toQueryFn = () => {
      const { sql, bindings } = toSqlFn();
      return bindParamsIntoQuery(sql, bindings);
    };

    return new WriteOperation(unWrapFn, toSqlFn, toQueryFn, async () => {
      if (!options.ignoreHooks) {
        await this.model.beforeInsert?.(model as T);
      }

      const { columns: preparedColumns, values: preparedValues } =
        await this.interpreterUtils.prepareColumns(
          Object.keys(model),
          Object.values(model),
          "insert",
        );

      const insertObject: Record<string, any> = {};
      preparedColumns.forEach((column, index) => {
        const value = preparedValues[index];
        insertObject[column] = value;
        model[column as keyof typeof model] ??= value;
      });

      const shouldDisableReturning =
        !options.returning || options.returning.length === 0;

      const { sql, bindings } = this.astParser.parse([
        new InsertNode(
          new FromNode(this.model.table),
          [insertObject],
          options.returning as string[],
          shouldDisableReturning,
        ),
      ]);

      const rows = await execSql(
        sql,
        bindings,
        this.sqlDataSource,
        this.sqlType as SqlDataSourceType,
        "rows",
        {
          sqlLiteOptions: {
            typeofModel: this.model,
            mode: "insertOne",
            models: [model as T],
          },
        },
      );

      if (shouldDisableReturning) {
        return undefined as Awaited<ReturnType<typeof execSql>>;
      }

      if (this.sqlType === "mysql" || this.sqlType === "mariadb") {
        return this.handleMysqlInsert(
          rows,
          [model as T],
          "one",
          options.returning as string[],
        );
      }

      const insertedModel = (rows as T[])[0];
      if (!insertedModel) {
        return model as T;
      }

      await this.model.afterFetch?.([insertedModel]);
      const result = (await serializeModel(
        [insertedModel],
        this.model,
        options.returning as string[],
      )) as T;
      return result;
    });
  }

  /**
   * @description Creates multiple records in the database
   * @returns WriteOperation that executes when awaited
   */
  insertMany(
    models: Partial<T>[],
    options: InsertOptions<T> = {},
  ): WriteOperation<ModelWithoutRelations<T>[]> {
    const rawInsertObjects = models.map((model) =>
      Object.fromEntries(
        Object.keys(model).map((col) => [
          col,
          model[col as keyof typeof model],
        ]),
      ),
    );

    const shouldDisableReturning =
      !options.returning || options.returning.length === 0;

    const insertNode = new InsertNode(
      new FromNode(this.model.table),
      rawInsertObjects,
      options.returning as string[],
      shouldDisableReturning,
    );

    const unWrapFn = () => {
      const result = this.astParser.parse([insertNode]);
      return {
        sql: result.sql,
        bindings: result.bindings,
      };
    };

    const toSqlFn = () => {
      const result = this.astParser.parse([insertNode]);
      return {
        sql: formatQuery(this.sqlDataSource, result.sql),
        bindings: result.bindings,
      };
    };

    const toQueryFn = () => {
      const { sql, bindings } = toSqlFn();
      return bindParamsIntoQuery(sql, bindings);
    };

    return new WriteOperation(unWrapFn, toSqlFn, toQueryFn, async () => {
      await this.model.beforeInsertMany?.(models as T[]);

      // Oracle with identity columns doesn't support INSERT ALL properly
      // Handle this case separately BEFORE attempting the batch insert
      if (this.sqlType === "oracledb") {
        const primaryKey = this.model.primaryKey;
        const firstModelKeys = Object.keys(models[0] || {});
        const hasMissingPrimaryKey =
          primaryKey && !firstModelKeys.includes(primaryKey);

        if (hasMissingPrimaryKey) {
          return this.handleOracleIdentityInsert(models as T[], options);
        }
      }

      const insertObjects: Record<string, any>[] = [];
      for (const model of models) {
        const { columns: preparedColumns, values: preparedValues } =
          await this.interpreterUtils.prepareColumns(
            Object.keys(model),
            Object.values(model),
            "insert",
          );

        const insertObject: Record<string, any> = {};
        preparedColumns.forEach((column, index) => {
          const value = preparedValues[index];
          insertObject[column] = value;
          model[column as keyof typeof model] ??= value;
        });

        insertObjects.push(insertObject);
      }

      const shouldDisableReturning =
        !options.returning || options.returning.length === 0;

      const { sql, bindings } = this.astParser.parse([
        new InsertNode(
          new FromNode(this.model.table),
          insertObjects,
          options.returning as string[],
          shouldDisableReturning,
        ),
      ]);

      const rows = await execSql(
        sql,
        bindings,
        this.sqlDataSource,
        this.sqlType as SqlDataSourceType,
        "rows",
        {
          sqlLiteOptions: {
            typeofModel: this.model,
            mode: "insertMany",
            models: models as T[],
          },
        },
      );

      if (shouldDisableReturning) {
        return [];
      }

      if (this.sqlType === "mysql" || this.sqlType === "mariadb") {
        return (
          (await this.handleMysqlInsert(
            rows,
            models as T[],
            "many",
            options.returning as string[],
          )) || []
        );
      }

      const insertedModels = rows as T[];
      if (!insertedModels.length) {
        return [];
      }

      await this.model.afterFetch?.(insertedModels);

      const results = await serializeModel(
        insertedModels,
        this.model,
        options.returning as string[],
      );
      return (results || []) as T[];
    });
  }

  upsertMany(
    conflictColumns: string[],
    columnsToUpdate: string[],
    data: ModelWithoutRelations<T>[],
    options: UpsertOptions<T> = {
      updateOnConflict: true,
    },
  ): WriteOperation<ModelWithoutRelations<T>[]> {
    const rawInsertObjects = data.map((model) =>
      Object.fromEntries(
        Object.keys(model).map((col) => [
          col,
          model[col as keyof typeof model],
        ]),
      ),
    );

    const insertNode = new InsertNode(
      new FromNode(this.model.table),
      rawInsertObjects,
      undefined,
      true,
    );
    const previewReturning =
      options.returning?.length &&
      (this.sqlType === "postgres" || this.sqlType === "cockroachdb")
        ? (options.returning as string[])
        : undefined;

    const onDuplicateNode = new OnDuplicateNode(
      this.model.table,
      conflictColumns,
      columnsToUpdate,
      (options.updateOnConflict ?? true) ? "update" : "ignore",
      previewReturning,
    );

    const unWrapFn = () => {
      const result = this.astParser.parse([insertNode]);
      return {
        sql: result.sql,
        bindings: result.bindings,
      };
    };

    const toSqlFn = () => {
      const result = this.astParser.parse([insertNode]);
      return {
        sql: formatQuery(this.sqlDataSource, result.sql),
        bindings: result.bindings,
      };
    };

    const toQueryFn = () => {
      const { sql, bindings } = toSqlFn();
      return bindParamsIntoQuery(sql, bindings);
    };

    return new WriteOperation(unWrapFn, toSqlFn, toQueryFn, async () => {
      const insertObjects: Record<string, any>[] = [];
      await this.model.beforeInsertMany?.(data as T[]);
      await Promise.all(
        data.map(async (model) => {
          const { columns: preparedColumns, values: preparedValues } =
            await this.interpreterUtils.prepareColumns(
              Object.keys(model),
              Object.values(model),
              "insert",
            );

          const insertObject = Object.fromEntries(
            preparedColumns.map((column, index) => [
              column,
              preparedValues[index],
            ]),
          );

          insertObjects.push(insertObject);
        }),
      );

      // MSSQL requires MERGE statement for upsert operations
      if (this.sqlType === "mssql") {
        return this.executeMssqlMerge(
          insertObjects,
          conflictColumns,
          columnsToUpdate,
          options,
          data,
        );
      }

      const shouldDisableReturning =
        !options.returning || options.returning.length === 0;

      // For postgres/cockroachdb: pass returning to OnDuplicateNode so the
      // interpreter appends RETURNING directly to the upsert statement.
      const nativeReturning =
        !shouldDisableReturning &&
        (this.sqlType === "postgres" || this.sqlType === "cockroachdb")
          ? (options.returning as string[])
          : undefined;

      const { sql, bindings } = this.astParser.parse([
        new InsertNode(
          new FromNode(this.model.table),
          insertObjects,
          undefined,
          true,
        ),
        new OnDuplicateNode(
          this.model.table,
          conflictColumns,
          columnsToUpdate,
          (options.updateOnConflict ?? true) ? "update" : "ignore",
          nativeReturning,
        ),
      ]);

      const rows = await execSql(
        sql,
        bindings,
        this.sqlDataSource,
        this.sqlType as SqlDataSourceType,
        "rows",
        {
          sqlLiteOptions: {
            typeofModel: this.model,
            mode: "raw",
            models: data as T[],
          },
        },
      );

      if (shouldDisableReturning) {
        return [];
      }

      // Postgres/CockroachDB: RETURNING was part of the SQL — rows are already populated.
      // When DO NOTHING fires on a conflict, PostgreSQL returns no rows for conflicting
      // records even with RETURNING. Fall back to re-fetching when results are incomplete.
      if (this.sqlType === "postgres" || this.sqlType === "cockroachdb") {
        if (rows.length < data.length && !(options.updateOnConflict ?? true)) {
          const conflictKey = conflictColumns[0];
          const conflictValues = data.map(
            (d) => d[conflictKey as keyof typeof d],
          );
          const fetchedModels = await this.query()
            .select(
              ...((options.returning?.length
                ? options.returning
                : ["*"]) as any[]),
            )
            .whereIn(conflictKey, conflictValues as any)
            .many();
          return fetchedModels as unknown as T[];
        }

        const returnedModels = rows as T[];
        await this.model.afterFetch?.(returnedModels);
        const results = await serializeModel(
          returnedModels,
          this.model,
          options.returning as string[],
        );
        return (results || []) as T[];
      }

      // MySQL, MariaDB, SQLite: re-fetch by conflict column values.
      const conflictKey = conflictColumns[0];
      const conflictValues = data.map((d) => d[conflictKey as keyof typeof d]);
      const fetchedModels = await this.query()
        .select(
          ...((options.returning?.length ? options.returning : ["*"]) as any[]),
        )
        .whereIn(conflictKey, conflictValues as any)
        .many();

      return fetchedModels as unknown as T[];
    });
  }

  /**
   * @description Executes a MERGE statement for MSSQL upsert operations
   */
  private async executeMssqlMerge(
    insertObjects: Record<string, any>[],
    conflictColumns: string[],
    columnsToUpdate: string[],
    options: UpsertOptions<T>,
    data: ModelWithoutRelations<T>[],
  ): Promise<ModelWithoutRelations<T>[]> {
    if (!insertObjects.length) {
      return [];
    }

    const columns = Object.keys(insertObjects[0]);
    const formattedTable = this.interpreterUtils.formatStringColumn(
      "mssql",
      this.model.table,
    );

    const formatCol = (col: string) =>
      this.interpreterUtils.formatStringColumn("mssql", col);

    // Build source values for MERGE
    const bindings: any[] = [];
    const sourceRows = insertObjects.map((obj) => {
      const rowValues = columns.map((col) => {
        bindings.push(obj[col]);
        return `@${bindings.length}`;
      });
      return `select ${rowValues.join(", ")}`;
    });

    const sourceColumns = columns.map(formatCol).join(", ");
    const sourceQuery = sourceRows.join(" union all ");

    // Build ON condition for conflict columns
    const onCondition = conflictColumns
      .map((col) => `target.${formatCol(col)} = source.${formatCol(col)}`)
      .join(" and ");

    // Build UPDATE SET clause
    const updateSet = columnsToUpdate
      .filter((col) => !conflictColumns.includes(col))
      .map((col) => `target.${formatCol(col)} = source.${formatCol(col)}`)
      .join(", ");

    // Build INSERT columns and values
    const insertCols = columns.map(formatCol).join(", ");
    const insertVals = columns
      .map((col) => `source.${formatCol(col)}`)
      .join(", ");

    // Build OUTPUT clause
    const outputCols =
      options.returning && options.returning.length
        ? options.returning
            .map((col) => `inserted.${formatCol(col as string)}`)
            .join(", ")
        : columns.map((col) => `inserted.${formatCol(col)}`).join(", ");

    // Construct MERGE statement
    const updateOnConflict = options.updateOnConflict ?? true;
    const whenMatchedClause =
      updateOnConflict && updateSet
        ? `when matched then update set ${updateSet}`
        : "";

    const sql =
      `merge into ${formattedTable} as target ` +
      `using (${sourceQuery}) as source (${sourceColumns}) ` +
      `on ${onCondition} ` +
      `${whenMatchedClause} ` +
      `when not matched then insert (${insertCols}) values (${insertVals}) ` +
      `output ${outputCols};`;

    const rows = await execSql(
      sql,
      bindings,
      this.sqlDataSource,
      this.sqlType as SqlDataSourceType,
      "rows",
      {
        sqlLiteOptions: {
          typeofModel: this.model,
          mode: "raw",
          models: data as T[],
        },
      },
    );

    // When DO NOTHING fires (updateOnConflict: false and a conflict occurred), the MERGE
    // statement produces no output rows because neither INSERT nor UPDATE happened.
    // Fall back to re-fetching the existing records by conflict column values.
    if (rows.length === 0 && !(options.updateOnConflict ?? true)) {
      const conflictKey = conflictColumns[0];
      const conflictValues = data.map((d) => d[conflictKey as keyof typeof d]);
      const fetchedModels = await this.query()
        .select(
          ...((options.returning?.length ? options.returning : ["*"]) as any[]),
        )
        .whereIn(conflictKey, conflictValues as any)
        .many();
      return fetchedModels as unknown as T[];
    }

    return rows as T[];
  }

  /**
   * @description Updates a record. When returning is provided, re-fetches and returns the updated record; otherwise returns void.
   * @description Can only be used if the model has a primary key, use a massive update if the model has no primary key
   */
  async updateRecord(
    pk: string | number,
    data: Partial<T>,
    options?: { returning?: ModelKey<T>[] },
  ): Promise<ModelWithoutRelations<T> | void> {
    const modelColumnNames = new Set(
      this.model.getColumns().map((c) => c.columnName),
    );
    const keys = Object.keys(data).filter((k) => modelColumnNames.has(k));
    const values = keys.map((k) => data[k as keyof typeof data]);

    let { columns: preparedColumns, values: preparedValues } =
      await this.interpreterUtils.prepareColumns(keys, values, "update");

    const { primaryKey } = this.model;
    if (!primaryKey) {
      throw new HysteriaError(
        this.model.name + "::updateRecord",
        "MODEL_HAS_NO_PRIMARY_KEY",
      );
    }

    // Primary key is filtered out of the prepared columns and values
    const primaryKeyIndex = preparedColumns.indexOf(primaryKey);
    if (primaryKeyIndex !== -1) {
      preparedColumns.splice(primaryKeyIndex, 1);
      preparedValues.splice(primaryKeyIndex, 1);
    }

    const { sql, bindings } = this.astParser.parse([
      new UpdateNode(
        new FromNode(this.model.table),
        preparedColumns,
        preparedValues,
      ),
      new WhereNode(primaryKey as string, "and", false, "=", pk as string),
    ]);

    await execSql(
      sql,
      bindings,
      this.sqlDataSource,
      this.sqlType as SqlDataSourceType,
      "affectedRows",
    );

    if (!options?.returning || options.returning.length === 0) {
      return;
    }

    const updatedModel = await this.findOneByPrimaryKey(
      pk as string,
      options.returning,
    );

    if (!updatedModel) {
      throw new HysteriaError(
        this.model.name + "::updateRecord",
        "ROW_NOT_FOUND",
      );
    }

    return updatedModel;
  }

  /**
   * @description Deletes a record
   * @description Can only be used if the model has a primary key, use a massive delete if the model has no primary key
   */
  async deleteRecord(pk: string | number): Promise<void> {
    if (!this.model.primaryKey) {
      throw new HysteriaError(
        this.model.name + "::deleteRecord",
        "MODEL_HAS_NO_PRIMARY_KEY",
      );
    }

    const whereNode = new WhereNode(
      this.model.primaryKey as string,
      "and",
      false,
      "=",
      pk as string,
    );

    const { sql, bindings } = this.astParser.parse([
      new DeleteNode(new FromNode(this.model.table)),
      whereNode,
    ]);

    await execSql(
      sql,
      bindings,
      this.sqlDataSource,
      this.sqlType as SqlDataSourceType,
      "affectedRows",
    );
  }

  /**
   * @description Returns a query builder instance
   */
  query(): Omit<ModelQueryBuilder<T>, "insert" | "insertMany"> {
    const queryBuilder = new ModelQueryBuilder<T>(
      this.model,
      this.sqlDataSource,
    );
    if (this.replicationMode) {
      queryBuilder.setReplicationMode(this.replicationMode);
    }
    return queryBuilder;
  }

  /**
   * @description Mysql does not return the inserted model, so we need to get the inserted model from the database
   */
  private async handleMysqlInsert<O extends "one" | "many">(
    rows: any,
    models: T[],
    returnType: O,
    retuning?: string[],
  ): Promise<O extends "one" ? T : T[] | null> {
    if (!this.model.primaryKey) {
      if (returnType === "one") {
        const returnModel = models.length ? models[0] : null;
        if (!returnModel) {
          return null as O extends "one" ? T : T[] | null;
        }

        return (await serializeModel(
          [returnModel],
          this.model,
        )) as O extends "one" ? T : T[];
      }

      return (await serializeModel(models, this.model)) as O extends "one"
        ? T
        : T[];
    }

    // UUID and before fetch defined primary keys
    if (this.model.primaryKey && models[0][this.model.primaryKey as keyof T]) {
      const idsToFetchList = models.map(
        (model) => model[this.model.primaryKey as keyof T],
      ) as string[];

      const primaryKeyList = idsToFetchList.map((key) => `'${key}'`).join(",");
      const fetchedModels = await this.query()
        .select(...((retuning ?? ["*"]) as any[]))
        .whereIn(this.model.primaryKey as ModelKey<T>, idsToFetchList as any)
        .orderByRaw(`FIELD(${this.model.primaryKey}, ${primaryKeyList})`)
        .many();

      if (returnType === "one") {
        return (fetchedModels.length
          ? fetchedModels[0]
          : null) as unknown as O extends "one" ? T : T[];
      }

      return fetchedModels as unknown as O extends "one" ? T : T[];
    }

    // standard auto increment primary keys
    const idsToFetchList = Array.from(
      { length: rows.affectedRows },
      (_, i) => i + rows.insertId,
    );

    const fetchedModels = await this.query()
      .select(...((retuning || ["*"]) as any[]))
      .whereIn(this.model.primaryKey as ModelKey<T>, idsToFetchList as any)
      .many();

    if (returnType === "one") {
      return (fetchedModels.length
        ? fetchedModels[0]
        : null) as unknown as O extends "one" ? T : T[];
    }

    return fetchedModels as unknown as O extends "one" ? T : T[];
  }

  /**
   * @description Oracle with identity columns doesn't support INSERT ALL properly.
   * This method inserts records one at a time to avoid duplicate ID issues.
   * After each insert, it queries the row back using unique columns to get the generated ID.
   */
  private async handleOracleIdentityInsert(
    models: T[],
    options: InsertOptions<T>,
  ): Promise<ModelWithoutRelations<T>[]> {
    const results: T[] = [];
    const primaryKey = this.model.primaryKey;

    for (const model of models) {
      // Prepare columns for the insert
      const { columns: preparedColumns, values: preparedValues } =
        await this.interpreterUtils.prepareColumns(
          Object.keys(model),
          Object.values(model),
          "insert",
        );

      const insertObject: Record<string, any> = {};
      preparedColumns.forEach((column, index) => {
        const value = preparedValues[index];
        insertObject[column] = value;
        model[column as keyof typeof model] ??= value;
      });

      // Execute the insert
      const { sql, bindings } = this.astParser.parse([
        new InsertNode(
          new FromNode(this.model.table),
          [insertObject],
          options.returning as string[],
        ),
      ]);

      await execSql(
        sql,
        bindings,
        this.sqlDataSource,
        this.sqlType as SqlDataSourceType,
        "rows",
      );

      // Query back the inserted row to get the generated ID
      const queryBuilder = this.query().select(
        ...(((options.returning as string[]) || ["*"]) as any[]),
      );

      for (const [column, value] of Object.entries(insertObject)) {
        if (value !== null && value !== undefined && column !== primaryKey) {
          queryBuilder.where(
            column as ModelKey<T>,
            "=",
            value as WhereColumnValue<T, ModelKey<T>>,
          );
        }
      }

      // Order by ID desc to get the most recently inserted row
      if (primaryKey) {
        queryBuilder.orderBy(primaryKey, "desc");
      }

      const insertedRow = await queryBuilder.one({
        ignoreHooks: ["beforeFetch"],
      });

      if (insertedRow) {
        const typedRow = insertedRow as unknown as ModelWithoutRelations<T>;
        if (
          primaryKey &&
          typedRow[primaryKey as keyof ModelWithoutRelations<T>]
        ) {
          (model as any)[primaryKey] =
            typedRow[primaryKey as keyof ModelWithoutRelations<T>];
        }
        results.push(insertedRow as T);
      } else {
        results.push(model as T);
      }
    }

    await this.model.afterFetch?.(results);
    return results as ModelWithoutRelations<T>[];
  }

  private handleWhereCondition(
    query: ModelQueryBuilder<T>,
    where: FindOneType<T>["where"],
    useOr = false,
  ): void {
    if (!where) {
      return;
    }

    for (const [key, condition] of Object.entries(where)) {
      if (key === "$and" && Array.isArray(condition)) {
        // $and groups conditions with AND logic inside a where group
        const whereMethod = useOr ? "orWhere" : "where";
        (query as any)[whereMethod]((builder: ModelQueryBuilder<T>) => {
          for (const subCondition of condition) {
            this.handleWhereCondition(
              builder as unknown as ModelQueryBuilder<T>,
              subCondition,
              false,
            );
          }
        });
      } else if (key === "$or" && Array.isArray(condition)) {
        // $or groups conditions with OR logic inside a where group
        const whereMethod = useOr ? "orWhere" : "where";
        (query as any)[whereMethod]((builder: ModelQueryBuilder<T>) => {
          let isFirst = true;
          for (const subCondition of condition) {
            this.handleWhereCondition(
              builder as unknown as ModelQueryBuilder<T>,
              subCondition,
              !isFirst,
            );
            isFirst = false;
          }
        });
      } else {
        this.applyFieldCondition(query, key, condition, useOr);
      }
    }
  }

  private applyFieldCondition(
    query: ModelQueryBuilder<T>,
    column: string,
    condition: unknown,
    useOr = false,
  ): void {
    if (
      condition === null ||
      condition === undefined ||
      typeof condition !== "object"
    ) {
      if (condition === null) {
        useOr ? query.orWhereNull(column) : query.whereNull(column);
      } else {
        useOr
          ? query.orWhere(column as any, "=", condition)
          : query.where(column as any, "=", condition);
      }

      return;
    }

    const opCondition = condition as { op: string; value?: unknown };
    const op = opCondition.op;
    const value = opCondition.value;

    switch (op) {
      case "$eq":
        if (value === null) {
          useOr ? query.orWhereNull(column) : query.whereNull(column);
        } else {
          useOr
            ? query.orWhere(column as any, "=", value)
            : query.where(column as any, "=", value);
        }
        break;
      case "$ne":
        if (value === null) {
          useOr ? query.orWhereNotNull(column) : query.whereNotNull(column);
        } else {
          useOr
            ? query.orWhere(column as any, "!=", value)
            : query.where(column as any, "!=", value);
        }
        break;
      case "$gt":
        useOr
          ? query.orWhere(column as any, ">", value)
          : query.where(column as any, ">", value);
        break;
      case "$gte":
        useOr
          ? query.orWhere(column as any, ">=", value)
          : query.where(column as any, ">=", value);
        break;
      case "$lt":
        useOr
          ? query.orWhere(column as any, "<", value)
          : query.where(column as any, "<", value);
        break;
      case "$lte":
        useOr
          ? query.orWhere(column as any, "<=", value)
          : query.where(column as any, "<=", value);
        break;
      case "$between": {
        const [min, max] = value as [unknown, unknown];
        useOr
          ? query.orWhereBetween(column as any, min, max)
          : query.whereBetween(column as any, min, max);
        break;
      }
      case "$not between": {
        const [notMin, notMax] = value as [unknown, unknown];
        useOr
          ? query.orWhereNotBetween(column as any, notMin, notMax)
          : query.whereNotBetween(column as any, notMin, notMax);
        break;
      }
      case "$regexp":
        useOr
          ? query.orWhereRegexp(column as any, value as RegExp)
          : query.whereRegexp(column as any, value as RegExp);
        break;
      case "$not regexp":
        useOr
          ? query.orWhereNotRegexp(column as any, value as RegExp)
          : query.whereNotRegexp(column as any, value as RegExp);
        break;
      case "$is null":
        useOr ? query.orWhereNull(column) : query.whereNull(column);
        break;
      case "$is not null":
        useOr ? query.orWhereNotNull(column) : query.whereNotNull(column);
        break;
      case "$like":
        useOr
          ? query.orWhereLike(column, value as string)
          : query.whereLike(column, value as string);
        break;
      case "$not like":
        useOr
          ? query.orWhereNotLike(column, value as string)
          : query.whereNotLike(column, value as string);
        break;
      case "$ilike":
        useOr
          ? query.orWhereILike(column, value as string)
          : query.whereILike(column, value as string);
        break;
      case "$not ilike":
        useOr
          ? query.orWhereNotILike(column, value as string)
          : query.whereNotILike(column, value as string);
        break;
      case "$in":
        useOr
          ? query.orWhereIn(column as any, value as any[])
          : query.whereIn(column as any, value as any[]);
        break;
      case "$nin":
        useOr
          ? query.orWhereNotIn(column as any, value as any[])
          : query.whereNotIn(column as any, value as any[]);
        break;
      default:
        useOr
          ? query.orWhere(column as any, "=", condition)
          : query.where(column as any, "=", condition);
    }
  }
}
