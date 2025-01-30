import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { Model } from "../models/model";
import { ModelManager } from "../models/model_manager/model_manager";
import {
  FindOneType,
  FindType,
  UnrestrictedFindOneType,
  UnrestrictedFindType,
} from "../models/model_manager/model_manager_types";
import SqlModelManagerUtils from "../models/model_manager/model_manager_utils";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import { PgClientInstance } from "../sql_data_source_types";
import { execSql } from "../sql_runner/sql_runner";
import { PostgresQueryBuilder } from "./postgres_query_builder";

export class PostgresModelManager<T extends Model> extends ModelManager<T> {
  protected pgConnection: PgClientInstance;
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;

  /**
   * Constructor for Postgres_model_manager class.
   */
  constructor(
    model: typeof Model,
    pgConnection: PgClientInstance,
    logs: boolean,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, logs, sqlDataSource);
    this.pgConnection = pgConnection;
    this.sqlModelManagerUtils = new SqlModelManagerUtils(
      "postgres",
      pgConnection,
    );
  }

  /**
   * Find method to retrieve multiple records from the database based on the input conditions.
   */
  async find(input?: FindType<T> | UnrestrictedFindType<T>): Promise<T[]> {
    if (!input) {
      return await this.query().many();
    }

    const query = this.query();
    if (input.select) {
      query.select(...(input.select as string[]));
    }

    if (input.relations) {
      input.relations.forEach((relation) => {
        query.with(relation);
      });
    }

    if (input.where) {
      Object.entries(input.where).forEach(([key, value]) => {
        query.where(key, value);
      });
    }

    if (input.orderBy) {
      Object.entries(input.orderBy).forEach(([key, value]) => {
        query.orderBy(key, value);
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

    return await query.many({ ignoreHooks: input.ignoreHooks || [] });
  }

  /**
   * Find a single record from the database based on the input conditions.
   */
  async findOne(
    input: FindOneType<T> | UnrestrictedFindOneType<T>,
  ): Promise<T | null> {
    const results = await this.find({
      ...input,
      limit: 1,
    });

    if (!results.length) {
      return null;
    }

    return results[0];
  }

  /**
   * Find a single record by its PK from the database.
   */
  async findOneByPrimaryKey(value: string | number): Promise<T | null> {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be retrieved by",
      );
    }

    return await this.query()
      .where(this.model.primaryKey as string, "=", value)
      .one();
  }

  /**
   * Save a new model instance to the database.
   */
  async insert(model: Partial<T>): Promise<T> {
    this.model.beforeInsert(model as T);
    const { query, params } = this.sqlModelManagerUtils.parseInsert(
      model as T,
      this.model,
      this.sqlDataSource.getDbType(),
    );

    const { rows } = await execSql(
      query,
      params,
      "postgres",
      this.pgConnection,
      this.logs,
    );
    const insertedModel = rows[0] as T;
    if (!insertedModel) {
      throw new Error(rows[0]);
    }

    const result = (await parseDatabaseDataIntoModelResponse(
      [insertedModel],
      this.model,
    )) as T;

    this.model.afterFetch([result]);
    return result;
  }

  /**
   * Create multiple model instances in the database.
   */
  async insertMany(models: Partial<T>[]): Promise<T[]> {
    models.forEach((model) => this.model.beforeInsert(model as T));

    const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
      models as T[],
      this.model,
      this.sqlDataSource.getDbType(),
    );

    const { rows } = await execSql(
      query,
      params,
      "postgres",
      this.pgConnection,
      this.logs,
    );
    const insertedModel = rows as T[];
    if (!insertedModel.length) {
      return [];
    }

    const insertModelPromise = insertedModel.map(
      async (model) =>
        (await parseDatabaseDataIntoModelResponse([model], this.model)) as T,
    );

    const results = await Promise.all(insertModelPromise);
    this.model.afterFetch(results);
    return results;
  }

  /**
   * Update an existing model instance in the database.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  async updateRecord(model: T): Promise<T | null> {
    const { table, primaryKey } = this.model;
    if (!primaryKey) {
      throw new Error(
        "Model " + table + " has no primary key to be updated, try save",
      );
    }

    const { query, params } = this.sqlModelManagerUtils.parseUpdate(
      model,
      this.model,
      this.sqlDataSource.getDbType(),
    );

    await execSql(query, params, "postgres", this.pgConnection, this.logs);
    if (!primaryKey) {
      return null;
    }

    return await this.findOneByPrimaryKey(
      model[primaryKey as keyof T] as string | number,
    );
  }

  /**
   * @description Delete a record from the database from the given model.
   */
  async deleteRecord(model: T): Promise<T | null> {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " + this.model.table + " has no primary key to be deleted from",
      );
    }

    const { query, params } = this.sqlModelManagerUtils.parseDelete(
      this.model.table,
      this.model.primaryKey,
      model[this.model.primaryKey as keyof T] as string,
    );

    await execSql(query, params, "postgres", this.pgConnection, this.logs);
    return model;
  }

  /**
   * Create and return a new instance of the Mysql_query_builder for building more complex SQL queries.
   *
   * @returns {MysqlQueryBuilder<Model>} - Instance of Mysql_query_builder.
   */
  query(): PostgresQueryBuilder<T> {
    return new PostgresQueryBuilder<T>(
      this.model,
      this.model.table,
      this.pgConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );
  }
}
