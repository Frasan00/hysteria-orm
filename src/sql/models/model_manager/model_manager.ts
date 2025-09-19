import { HysteriaError } from "../../../errors/hysteria_error";
import { AstParser } from "../../ast/parser";
import { DeleteNode } from "../../ast/query/node/delete";
import { InsertNode } from "../../ast/query/node/insert";
import { OnDuplicateNode } from "../../ast/query/node/on_duplicate";
import { UpdateNode } from "../../ast/query/node/update";
import { WhereNode } from "../../ast/query/node/where";
import { InterpreterUtils } from "../../interpreter/interpreter_utils";
import { serializeModel } from "../../serializer";
import { SqlDataSource } from "../../sql_data_source";
import { SqlDataSourceType } from "../../sql_data_source_types";
import { execSql } from "../../sql_runner/sql_runner";
import { Model } from "../model";
import { ModelQueryBuilder } from "../model_query_builder/model_query_builder";
import { AnnotatedModel } from "../model_query_builder/model_query_builder_types";
import { ModelWithoutRelations } from "../model_types";
import { getBaseModelInstance } from "../model_utils";
import {
  FindOneType,
  FindType,
  InsertOptions,
  ModelKey,
  ModelRelation,
  OrderByChoices,
  UnrestrictedFindOneType,
  UnrestrictedFindType,
  UpsertOptions,
} from "./model_manager_types";

export class ModelManager<T extends Model> {
  protected sqlDataSource: SqlDataSource;
  protected sqlType: SqlDataSourceType;
  protected logs: boolean;
  protected model: typeof Model;
  protected modelInstance: T;
  protected astParser: AstParser;
  protected interpreterUtils: InterpreterUtils;

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
   * @description Finds all records that match the input
   */
  async find<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(input?: FindType<T, S, R>): Promise<AnnotatedModel<T, {}>[]>;
  async find<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(input?: UnrestrictedFindType<T, S, R>): Promise<AnnotatedModel<T, {}>[]>;
  async find<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(
    input?: FindType<T, S, R> | UnrestrictedFindType<T, S, R>,
  ): Promise<AnnotatedModel<T, {}>[]> {
    if (!input) {
      return this.query().many();
    }

    const query = this.query();
    if (input.select) {
      query.select(...(input.select as string[]));
    }

    if (input.relations) {
      input.relations.forEach((relation) => {
        query.load(relation);
      });
    }

    if (input.where) {
      Object.entries(input.where).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query.whereIn(key, value);
          return;
        }

        query.where(key, value);
      });
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

    return query.many({ ignoreHooks: input.ignoreHooks || [] });
  }

  /**
   * @description Finds the first record that matches the input
   */
  async findOne<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(
    input: UnrestrictedFindOneType<T, S, R>,
  ): Promise<AnnotatedModel<T, {}> | null>;
  async findOne<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(input: FindOneType<T, S, R>): Promise<AnnotatedModel<T, {}> | null>;
  async findOne<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(
    input: FindOneType<T, S, R> | UnrestrictedFindOneType<T, S, R>,
  ): Promise<AnnotatedModel<T, {}> | null> {
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
  >(input: FindOneType<T, S, R>): Promise<AnnotatedModel<T, {}>>;
  async findOneOrFail<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(input: UnrestrictedFindOneType<T, S, R>): Promise<AnnotatedModel<T, {}>>;
  async findOneOrFail<
    S extends ModelKey<T>[] = never[],
    R extends ModelRelation<T>[] = never[],
  >(
    input: (FindOneType<T, S, R> | UnrestrictedFindOneType<T, S, R>) & {
      customError?: Error;
    },
  ): Promise<AnnotatedModel<T, {}>> {
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
  ): Promise<AnnotatedModel<T, {}> | null> {
    if (!this.model.primaryKey) {
      throw new HysteriaError(
        this.model.name + "::findOneByPrimaryKey",
        "MODEL_HAS_NO_PRIMARY_KEY",
      );
    }

    return this.query()
      .select(...(returning || []))
      .where(this.model.primaryKey as string, value)
      .one({ ignoreHooks: ["afterFetch", "beforeFetch"] });
  }

  /**
   * @description Creates a new record in the database
   */
  async insert(
    model: Partial<T>,
    options: InsertOptions<T> = {},
  ): Promise<AnnotatedModel<T, {}>> {
    !options.ignoreHooks && (await this.model.beforeInsert?.(model as T));
    const { columns: preparedColumns, values: preparedValues } =
      this.interpreterUtils.prepareColumns(
        Object.keys(model),
        Object.values(model),
        "insert",
      );

    const insertObject: Record<string, any> = {};
    preparedColumns.forEach((column, index) => {
      const value = preparedValues[index];
      insertObject[column] = value;
      (model as any)[column] ??= value;
    });

    const { sql, bindings } = this.astParser.parse([
      new InsertNode(
        this.model.table,
        [insertObject],
        options.returning as string[],
      ),
    ]);

    const rows = await execSql(sql, bindings, this.sqlDataSource, "raw", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "insertOne",
        models: [model as T],
      },
    });

    if (this.sqlType === "mysql" || this.sqlType === "mariadb") {
      return this.handleMysqlInsert(
        rows,
        [model as T],
        "one",
        options.returning as string[],
      );
    }

    const insertedModel = rows[0] as T;
    if (!insertedModel) {
      return model as T;
    }

    this.model.afterFetch?.([insertedModel]);
    const result = (await serializeModel([insertedModel], this.model)) as T;
    return result;
  }

  /**
   * @description Creates multiple records in the database
   */
  async insertMany(
    models: Partial<T>[],
    options: InsertOptions<T> = {},
  ): Promise<AnnotatedModel<T, {}>[]> {
    const insertObjects: Record<string, any>[] = [];
    for (const model of models) {
      !options.ignoreHooks && this.model.beforeInsert?.(model as T);
      const { columns: preparedColumns, values: preparedValues } =
        this.interpreterUtils.prepareColumns(
          Object.keys(model),
          Object.values(model),
          "insert",
        );

      const insertObject: Record<string, any> = {};
      preparedColumns.forEach((column, index) => {
        const value = preparedValues[index];
        insertObject[column] = value;
        (model as any)[column] ??= value;
      });

      insertObjects.push(insertObject);
    }

    const { sql, bindings } = this.astParser.parse([
      new InsertNode(
        this.model.table,
        insertObjects,
        options.returning as string[],
      ),
    ]);

    const rows = await execSql(sql, bindings, this.sqlDataSource, "raw", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "insertMany",
        models: models as T[],
      },
    });

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

    this.model.afterFetch?.(insertedModels);

    const results = await serializeModel(insertedModels, this.model);
    return (results || []) as T[];
  }

  async upsertMany(
    conflictColumns: string[],
    columnsToUpdate: string[],
    data: ModelWithoutRelations<T>[],
    options: UpsertOptions<T> = {
      updateOnConflict: true,
    },
  ): Promise<AnnotatedModel<T, {}>[]> {
    const insertObjects: Record<string, any>[] = [];
    await Promise.all(
      data.map((model) => {
        !options.ignoreHooks && this.model.beforeInsert?.(model as T);
        const { columns: preparedColumns, values: preparedValues } =
          this.interpreterUtils.prepareColumns(
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

    const { sql, bindings } = this.astParser.parse([
      new InsertNode(this.model.table, insertObjects, undefined, true),
      new OnDuplicateNode(
        this.model.table,
        conflictColumns,
        columnsToUpdate,
        options.updateOnConflict || true ? "update" : "ignore",
        options.returning as string[],
      ),
    ]);

    const rows = await execSql(sql, bindings, this.sqlDataSource, "raw", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "raw",
        models: data as T[],
      },
    });

    return rows as T[];
  }

  /**
   * @description Updates a record, returns the updated record
   * @description Model is retrieved from the database using the primary key regardless of any model hooks
   * @description Can only be used if the model has a primary key, use a massive update if the model has no primary key
   */
  async updateRecord(
    model: Partial<T>,
    options?: { returning?: ModelKey<T>[] },
  ): Promise<AnnotatedModel<T, {}>> {
    const { columns: preparedColumns, values: preparedValues } =
      this.interpreterUtils.prepareColumns(
        Object.keys(model),
        Object.values(model),
        "update",
      );

    const { primaryKey } = this.model;
    if (!primaryKey) {
      throw new HysteriaError(
        this.model.name + "::updateRecord",
        "MODEL_HAS_NO_PRIMARY_KEY",
      );
    }

    const { sql, bindings } = this.astParser.parse([
      new UpdateNode(this.model.table, preparedColumns, preparedValues),
    ]);

    await execSql(sql, bindings, this.sqlDataSource);
    const updatedModel = await this.findOneByPrimaryKey(
      model[this.model.primaryKey as keyof T] as string,
      options?.returning ?? undefined,
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
  async deleteRecord(model: T): Promise<void> {
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
      model[this.model.primaryKey as keyof T] as string,
    );

    const { sql, bindings } = this.astParser.parse([
      new DeleteNode(this.model.table),
      whereNode,
    ]);

    await execSql(sql, bindings, this.sqlDataSource);
  }

  /**
   * @description Returns a query builder instance
   */
  query(): Omit<ModelQueryBuilder<T>, "insert" | "insertMany"> {
    return new ModelQueryBuilder<T>(this.model, this.sqlDataSource);
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
        .select(...(retuning ?? "*"))
        .whereIn(this.model.primaryKey as string, idsToFetchList)
        .orderByRaw(`FIELD(${this.model.primaryKey}, ${primaryKeyList})`)
        .many();

      if (returnType === "one") {
        return (
          fetchedModels.length ? fetchedModels[0] : null
        ) as O extends "one" ? T : T[];
      }

      return fetchedModels as O extends "one" ? T : T[];
    }

    // standard auto increment primary keys
    const idsToFetchList = Array.from(
      { length: rows.affectedRows },
      (_, i) => i + rows.insertId,
    );

    const fetchedModels = await this.query()
      .select(...(retuning || "*"))
      .whereIn(this.model.primaryKey as string, idsToFetchList)
      .many();

    if (returnType === "one") {
      return (fetchedModels.length ? fetchedModels[0] : null) as O extends "one"
        ? T
        : T[];
    }

    return fetchedModels as O extends "one" ? T : T[];
  }
}
