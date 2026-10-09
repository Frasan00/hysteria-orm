import { HysteriaError } from "../../../errors/hysteria_error";
import type { LoggerConfig } from "../../../utils/logger";
import { bindParamsIntoQuery, formatQuery } from "../../../utils/query";
import { AstParser } from "../../ast/parser";
import { DeleteNode } from "../../ast/query/node/delete";
import { FromNode } from "../../ast/query/node/from";
import { InsertNode } from "../../ast/query/node/insert";
import { OnDuplicateNode } from "../../ast/query/node/on_duplicate";
import { ReturningNode } from "../../ast/query/node/returning/returning";
import { UpdateNode } from "../../ast/query/node/update";
import { WhereNode } from "../../ast/query/node/where";
import type { WithNode } from "../../ast/query/node/with";
import { QueryNode } from "../../ast/query/query";
import { InterpreterUtils } from "../../interpreter/interpreter_utils";
import type { ObjectWhereCondition } from "../../query_builder/object_where";
import { applyObjectWhere } from "../../query_builder/object_where";
import type { WhereOnlyQueryBuilder } from "../../query_builder/query_builder_types";
import { WriteOperation } from "../../query_builder/write_operation";
import { InsertWriteOperation } from "../../query_builder/insert_write_operation";
import type { InsertConflictConfig } from "../../query_builder/insert_write_operation";
import { serializeModel } from "../../serializer";
import { SqlDataSource } from "../../sql_data_source";
import { SqlDataSourceType } from "../../sql_data_source_types";
import { execSql } from "../../sql_runner/sql_runner";
import { Model } from "../model";
import { ModelQueryBuilder } from "../model_query_builder/model_query_builder";
import { ModelWriteData, ModelWithoutRelations } from "../model_types";
import { getBaseModelInstance } from "../model_utils";
import {
  FindOneType,
  FindReturnType,
  FindType,
  InsertOptions,
  ModelKey,
  ModelRelation,
  OrderByChoices,
  OrderByClause,
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
  >(input?: FindType<T, S, R>): Promise<FindReturnType<T, S, R>[]>;
  async find<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(input?: FindType<T, S, R>): Promise<FindReturnType<T, S, R>[]> {
    if (!input) {
      return this.query().many() as unknown as Promise<
        FindReturnType<T, S, R>[]
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
        query.orderBy(key as ModelKey<T>, value as OrderByClause);
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

    return query.many() as unknown as Promise<FindReturnType<T, S, R>[]>;
  }

  /**
   * @description Finds the first record that matches the input
   */
  async findOne<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(input: FindOneType<T, S, R>): Promise<FindReturnType<T, S, R> | null>;
  async findOne<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(input: FindOneType<T, S, R>): Promise<FindReturnType<T, S, R> | null> {
    const results = await this.find({
      groupBy: input.groupBy,
      orderBy: input.orderBy,
      relations: input.relations,
      select: input.select,
      where: input.where,
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
  >(input: FindOneType<T, S, R>): Promise<FindReturnType<T, S, R>>;
  async findOneOrFail<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(
    input: FindOneType<T, S, R> & {
      customError?: Error;
    },
  ): Promise<FindReturnType<T, S, R>> {
    const result = await this.findOne({
      groupBy: input.groupBy,
      orderBy: input.orderBy,
      relations: input.relations,
      select: input.select,
      where: input.where,
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
      .one() as unknown as Promise<ModelWithoutRelations<T> | null>;
  }

  /**
   * @description Places the CTEs ahead of the insert, except on MySQL/MariaDB which only
   * accept them inline after the column list (rendered by the insert interpreter).
   */
  private withInsertNodes(
    insertNode: InsertNode,
    onDuplicateNode: OnDuplicateNode | null,
    withNodes?: WithNode[],
  ): QueryNode[] {
    const isMysqlFamily =
      this.sqlType === "mysql" || this.sqlType === "mariadb";
    insertNode.withNodes =
      isMysqlFamily && withNodes?.length ? withNodes : undefined;

    return [
      ...(isMysqlFamily ? [] : (withNodes ?? [])),
      insertNode,
      onDuplicateNode,
    ].filter(Boolean) as QueryNode[];
  }

  /**
   * @description Creates a new record in the database
   * @returns WriteOperation that executes when awaited
   */
  insert(
    model: ModelWriteData<T>,
    options: InsertOptions<T> = {},
  ): InsertWriteOperation<ModelWithoutRelations<T>> {
    const rawInsertObject = this.interpreterUtils.stripComputedFromData(
      Object.fromEntries(
        Object.keys(model).map((col) => [
          col,
          model[col as keyof typeof model],
        ]),
      ),
    );

    const shouldDisableReturning =
      !options.returning || options.returning.length === 0;

    let insertNode = new InsertNode(
      new FromNode(this.model.table),
      [rawInsertObject],
      options.returning as string[],
      shouldDisableReturning,
      false,
    );
    let onDuplicateNode: OnDuplicateNode | null = null;
    let insertConflictConfig: InsertConflictConfig | null = null;

    const unWrapFn = () => {
      const result = this.astParser.parse(
        this.withInsertNodes(insertNode, onDuplicateNode, options.withNodes),
      );
      return {
        sql: result.sql,
        bindings: result.bindings,
      };
    };

    const toSqlFn = () => {
      const result = this.astParser.parse(
        this.withInsertNodes(insertNode, onDuplicateNode, options.withNodes),
      );
      return {
        sql: formatQuery(this.sqlDataSource, result.sql),
        bindings: result.bindings,
      };
    };

    const toQueryFn = () => {
      const { sql, bindings } = toSqlFn();
      return bindParamsIntoQuery(sql, bindings);
    };

    return new InsertWriteOperation<ModelWithoutRelations<T>>(
      unWrapFn,
      toSqlFn,
      toQueryFn,
      async () => {
        // Run validation prior to lifecycle hooks
        try {
          await (this.model as any).validate?.(model);
        } catch (e) {
          // ValidationError is thrown with details; propagate
          throw e;
        }

        const { columns: preparedColumns, values: preparedValues } =
          this.interpreterUtils.prepareColumns(
            Object.keys(model),
            Object.values(model),
            "insert",
            this.sqlType,
          );

        const insertObject: Record<string, any> = {};
        preparedColumns.forEach((column, index) => {
          const value = preparedValues[index];
          insertObject[column] = value;
          model[column as keyof typeof model] ??= value;
        });

        if (insertConflictConfig) {
          const results = await this.executeInsertConflict(
            [insertObject],
            [model],
            insertConflictConfig,
            options.returning as string[] | undefined,
            options.withNodes,
          );
          return results[0];
        }

        const shouldDisableReturning =
          !options.returning || options.returning.length === 0;

        const { sql, bindings } = this.astParser.parse(
          this.withInsertNodes(
            new InsertNode(
              new FromNode(this.model.table),
              [insertObject],
              options.returning as string[],
              shouldDisableReturning,
              false,
            ),
            null,
            options.withNodes,
          ),
        );

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

        if (this.sqlType === "mysql") {
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

        const result = serializeModel(
          [insertedModel],
          this.model,
          options.returning as string[],
        ) as T;
        return result;
      },
      (config) => {
        insertConflictConfig = config;

        if (config.conflictColumns.length === 0 && this.sqlType === "mssql") {
          throw new HysteriaError(
            "ModelManager::onConflict",
            "NOT_SUPPORTED_IN_MSSQL",
            new Error(
              "MSSQL cannot express a target-less ON CONFLICT; provide the conflict columns",
            ),
          );
        }

        // RETURNING must follow the conflict clause, so it moves off the insert node
        insertNode = new InsertNode(
          new FromNode(this.model.table),
          insertNode.records,
          undefined,
          true,
          false,
        );

        // MSSQL cannot express a conflict clause and uses a hand-built MERGE instead
        onDuplicateNode =
          this.sqlType === "mssql"
            ? null
            : new OnDuplicateNode(
                this.model.table,
                config.conflictColumns,
                config.columnsToUpdate,
                config.mode,
                options.returning as string[] | undefined,
              );
      },
      this.interpreterUtils.filterComputedColumns(Object.keys(model)),
      "ModelManager::insert",
    );
  }

  /**
   * @description Creates multiple records in the database
   * @returns WriteOperation that executes when awaited
   */
  insertMany(
    models: ModelWriteData<T>[],
    options: InsertOptions<T> = {},
  ): InsertWriteOperation<ModelWithoutRelations<T>[]> {
    return this.insertManyInternal(models, options, true);
  }

  private insertManyInternal(
    models: ModelWriteData<T>[],
    options: InsertOptions<T>,
    runValidation: boolean,
  ): InsertWriteOperation<ModelWithoutRelations<T>[]> {
    const rawInsertObjects = models.map((model) =>
      this.interpreterUtils.stripComputedFromData(
        Object.fromEntries(
          Object.keys(model).map((col) => [
            col,
            model[col as keyof typeof model],
          ]),
        ),
      ),
    );

    const shouldDisableReturning =
      !options.returning || options.returning.length === 0;

    let insertNode = new InsertNode(
      new FromNode(this.model.table),
      rawInsertObjects,
      options.returning as string[],
      shouldDisableReturning,
      false,
    );
    let onDuplicateNode: OnDuplicateNode | null = null;
    let insertConflictConfig: InsertConflictConfig | null = null;

    const unWrapFn = () => {
      const result = this.astParser.parse(
        this.withInsertNodes(insertNode, onDuplicateNode, options.withNodes),
      );
      return {
        sql: result.sql,
        bindings: result.bindings,
      };
    };

    const toSqlFn = () => {
      const result = this.astParser.parse(
        this.withInsertNodes(insertNode, onDuplicateNode, options.withNodes),
      );
      return {
        sql: formatQuery(this.sqlDataSource, result.sql),
        bindings: result.bindings,
      };
    };

    const toQueryFn = () => {
      const { sql, bindings } = toSqlFn();
      return bindParamsIntoQuery(sql, bindings);
    };

    return new InsertWriteOperation<ModelWithoutRelations<T>[]>(
      unWrapFn,
      toSqlFn,
      toQueryFn,
      async () => {
        if (runValidation) {
          // Run validation prior to lifecycle hooks
          try {
            await (this.model as any).validate?.(models as T[]);
          } catch (e) {
            throw e;
          }
        }

        const insertObjects: Record<string, any>[] = models.map((model) => {
          const { columns: preparedColumns, values: preparedValues } =
            this.interpreterUtils.prepareColumns(
              Object.keys(model),
              Object.values(model),
              "insert",
              this.sqlType,
            );

          const insertObject: Record<string, any> = {};
          preparedColumns.forEach((column, i) => {
            const value = preparedValues[i];
            insertObject[column] = value;
            model[column as keyof typeof model] ??= value;
          });

          return insertObject;
        });

        if (insertConflictConfig) {
          return this.executeInsertConflict(
            insertObjects,
            models,
            insertConflictConfig,
            options.returning as string[] | undefined,
            options.withNodes,
          );
        }

        const shouldDisableReturning =
          !options.returning || options.returning.length === 0;

        const { sql, bindings } = this.astParser.parse(
          this.withInsertNodes(
            new InsertNode(
              new FromNode(this.model.table),
              insertObjects,
              options.returning as string[],
              shouldDisableReturning,
              false,
            ),
            null,
            options.withNodes,
          ),
        );

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

        if (this.sqlType === "mysql") {
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

        const results = serializeModel(
          insertedModels,
          this.model,
          options.returning as string[],
        );

        if (!results) {
          return [];
        }

        // serializeModel collapses a single row to a bare object
        return (Array.isArray(results) ? results : [results]) as T[];
      },
      (config) => {
        insertConflictConfig = config;

        if (config.conflictColumns.length === 0 && this.sqlType === "mssql") {
          throw new HysteriaError(
            "ModelManager::onConflict",
            "NOT_SUPPORTED_IN_MSSQL",
            new Error(
              "MSSQL cannot express a target-less ON CONFLICT; provide the conflict columns",
            ),
          );
        }

        // RETURNING must follow the conflict clause, so it moves off the insert node
        insertNode = new InsertNode(
          new FromNode(this.model.table),
          insertNode.records,
          undefined,
          true,
          false,
        );

        // MSSQL cannot express a conflict clause and uses a hand-built MERGE instead
        onDuplicateNode =
          this.sqlType === "mssql"
            ? null
            : new OnDuplicateNode(
                this.model.table,
                config.conflictColumns,
                config.columnsToUpdate,
                config.mode,
                options.returning as string[] | undefined,
              );
      },
      models.length
        ? this.interpreterUtils.filterComputedColumns(Object.keys(models[0]))
        : [],
      "ModelManager::insertMany",
    );
  }

  upsertMany(
    conflictColumns: string[],
    columnsToUpdate: string[],
    data: ModelWithoutRelations<T>[],
    options: UpsertOptions<T> = {
      updateOnConflict: true,
    },
  ): WriteOperation<ModelWithoutRelations<T>[]> {
    // Upserts do not validate; only insert()/insertMany() do
    const conflict = this.insertManyInternal(data, options, false).onConflict(
      conflictColumns,
    );

    return (options.updateOnConflict ?? true)
      ? conflict.merge(
          this.interpreterUtils.filterComputedColumns(columnsToUpdate),
        )
      : conflict.ignore();
  }

  private async executeInsertConflict(
    insertObjects: Record<string, any>[],
    data: ModelWriteData<T>[],
    config: InsertConflictConfig,
    returning?: string[],
    withNodes?: WithNode[],
  ): Promise<ModelWithoutRelations<T>[]> {
    const updateOnConflict = config.mode === "update";

    // MSSQL requires MERGE statement for upsert operations
    if (this.sqlType === "mssql") {
      return this.executeMssqlMerge(
        insertObjects,
        config.conflictColumns,
        config.columnsToUpdate,
        { updateOnConflict, returning } as UpsertOptions<T>,
        data as ModelWithoutRelations<T>[],
      );
    }

    const shouldDisableReturning = !returning || returning.length === 0;

    // For postgres/cockroachdb: pass returning to OnDuplicateNode so the
    // interpreter appends RETURNING directly to the upsert statement.
    const nativeReturning =
      !shouldDisableReturning &&
      (this.sqlType === "postgres" || this.sqlType === "cockroachdb")
        ? returning
        : undefined;

    const { sql, bindings } = this.astParser.parse(
      this.withInsertNodes(
        new InsertNode(
          new FromNode(this.model.table),
          insertObjects,
          undefined,
          true,
          false,
        ),
        new OnDuplicateNode(
          this.model.table,
          config.conflictColumns,
          config.columnsToUpdate,
          config.mode,
          nativeReturning,
        ),
        withNodes,
      ),
    );

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
      if (rows.length < data.length && !updateOnConflict) {
        return this.refetchByConflictColumn(
          config.conflictColumns[0],
          data,
          returning,
        );
      }

      const returnedModels = rows as T[];
      const results = serializeModel(
        returnedModels,
        this.model,
        returning as string[],
      );

      if (!results) {
        return [];
      }

      // serializeModel collapses a single row to a bare object
      return (
        Array.isArray(results) ? results : [results]
      ) as ModelWithoutRelations<T>[];
    }

    // MySQL, MariaDB, SQLite: re-fetch by conflict column values.
    return this.refetchByConflictColumn(
      config.conflictColumns[0],
      data,
      returning,
    );
  }

  private async refetchByConflictColumn(
    conflictKey: string,
    data: ModelWriteData<T>[],
    returning?: string[],
  ): Promise<ModelWithoutRelations<T>[]> {
    if (!conflictKey) {
      return [];
    }

    const conflictValues = data.map((d) => d[conflictKey as keyof typeof d]);
    const fetchedModels = await this.query()
      .select(...((returning?.length ? returning : ["*"]) as any[]))
      .whereIn(conflictKey, conflictValues as any)
      .many();

    return fetchedModels as unknown as ModelWithoutRelations<T>[];
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
            .map(
              (col) =>
                `inserted.${formatCol(col as string)}${this.interpreterUtils.resolveColumnAlias("mssql", col as string)}`,
            )
            .join(", ")
        : columns
            .map(
              (col) =>
                `inserted.${formatCol(col)}${this.interpreterUtils.resolveColumnAlias("mssql", col)}`,
            )
            .join(", ");

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
   * @description Updates a record. When returning is provided the updated record is returned, using the dialect's
   * returning clause where it is safe to do so (PostgreSQL, CockroachDB, and SQLite without an autoUpdate column)
   * and a re-fetch by primary key otherwise (MySQL, MariaDB, MSSQL); otherwise returns void.
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
      this.interpreterUtils.prepareColumns(
        keys,
        values,
        "update",
        this.sqlType,
      );

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

    const returning = (options?.returning ?? []) as string[];
    const useNativeReturning =
      returning.length > 0 &&
      !this.interpreterUtils.hasComputedColumn(returning) &&
      this.interpreterUtils.shouldFetchNatively(this.sqlType, "update");

    const { sql, bindings } = this.astParser.parse([
      new UpdateNode(
        new FromNode(this.model.table),
        preparedColumns,
        preparedValues,
      ),
      new WhereNode(primaryKey as string, "and", false, "=", pk as string),
      ...(useNativeReturning ? [new ReturningNode(returning)] : []),
    ]);

    const rows = await execSql(
      sql,
      bindings,
      this.sqlDataSource,
      this.sqlType as SqlDataSourceType,
      useNativeReturning ? "rows" : "affectedRows",
      useNativeReturning
        ? { sqlLiteOptions: { typeofModel: this.model, mode: "fetch" } }
        : undefined,
    );

    if (!returning.length) {
      return;
    }

    if (useNativeReturning) {
      if (!rows.length) {
        throw new HysteriaError(
          this.model.name + "::updateRecord",
          "ROW_NOT_FOUND",
        );
      }

      return serializeModel(
        [rows[0] as Model],
        this.model,
        returning,
      ) as unknown as ModelWithoutRelations<T>;
    }

    const updatedModel = await this.findOneByPrimaryKey(
      pk as string,
      options?.returning,
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

        return serializeModel([returnModel], this.model) as O extends "one"
          ? T
          : T[];
      }

      return serializeModel(models, this.model) as O extends "one" ? T : T[];
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

  private handleWhereCondition(
    query: ModelQueryBuilder<T>,
    where: FindOneType<T>["where"],
    useOr = false,
  ): void {
    applyObjectWhere(
      query as unknown as WhereOnlyQueryBuilder<T>,
      (where ?? {}) as ObjectWhereCondition<T>,
      useOr,
    );
  }
}
