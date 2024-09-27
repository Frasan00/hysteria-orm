import { Model } from "../Models/Model";
import {
  FindOneType,
  FindType,
  TransactionType,
  UnrestrictedFindOneType,
  UnrestrictedFindType,
} from "../Models/ModelManager/ModelManagerTypes";
import pg from "pg";
import { log, queryError } from "../../Logger";
import { AbstractModelManager } from "../Models/ModelManager/AbstractModelManager";
import { PostgresQueryBuilder } from "./PostgresQueryBuilder";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import { PostgresUpdateQueryBuilder } from "./PostgresUpdateQueryBuilder";
import { PostgresDeleteQueryBuilder } from "./PostgresDeleteQueryBuilder";
import { SqlDataSource } from "../SqlDatasource";
import SqlModelManagerUtils from "../Models/ModelManager/ModelManagerUtils";

export class PostgresModelManager<
  T extends Model,
> extends AbstractModelManager<T> {
  protected pgConnection: pg.Client;
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;

  /**
   * Constructor for PostgresModelManager class.
   *
   * @param {typeof Model} model - Model constructor.
   * @param {Pool} pgConnection - PostgreSQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(
    model: typeof Model,
    pgConnection: pg.Client,
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
   *
   * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
   * @returns Promise resolving to an array of models.
   */
  public async find(
    input?: FindType<T> | UnrestrictedFindType<T>,
  ): Promise<T[]> {
    try {
      if (!input) {
        return await this.query().many();
      }

      const query = this.query();
      if (input.select) {
        query.select(...(input.select as string[]));
      }

      if (input.relations) {
        query.addRelations(input.relations);
      }

      if (input.where) {
        Object.entries(input.where).forEach(([key, value]) => {
          query.where(key, value);
        });
      }

      if (input.orderBy) {
        query.orderBy(input.orderBy.columns, input.orderBy.type);
      }

      if (input.limit) {
        query.limit(input.limit);
      }

      if (input.offset) {
        query.offset(input.offset);
      }

      if (input.groupBy) {
        query.groupBy(...input.groupBy);
      }

      return await query.many({ ignoreHooks: input.ignoreHooks || [] });
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - Query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  public async findOne(
    input: FindOneType<T> | UnrestrictedFindOneType<T>,
  ): Promise<T | null> {
    try {
      const query = this.query();
      if (input.select) {
        query.select(...(input.select as string[]));
      }

      if (input.relations) {
        query.addRelations(input.relations);
      }

      if (input.where) {
        Object.entries(input.where).forEach(([key, value]) => {
          query.where(key, value);
        });
      }

      return await query.one({
        throwErrorOnNull: input.throwErrorOnNull || false,
        ignoreHooks: input.ignoreHooks || [],
      });
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Find a single record by its PK from the database.
   *
   * @param {string | number | boolean} value - PK value of the record to retrieve.
   * @returns Promise resolving to a single model or null if not found.
   */
  public async findOneByPrimaryKey(
    value: string | number | boolean,
    throwErrorOnNull: boolean = false,
  ): Promise<T | null> {
    try {
      if (!this.model.primaryKey) {
        throw new Error(
          "Model " +
            this.model.table +
            " has no primary key to be retrieved by",
        );
      }

      return await this.query()
        .where(this.model.primaryKey as string, "=", value)
        .one({ throwErrorOnNull });
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  public async insert(
    model: Partial<T>,
    trx?: TransactionType,
  ): Promise<T | null> {
    this.model.beforeinsert(model as T);
    const { query, params } = this.sqlModelManagerUtils.parseInsert(
      model as T,
      this.model,
      this.sqlDataSource.getDbType(),
    );

    if (trx) {
      return await trx.queryInsert<T>(query, params, this.model);
    }

    try {
      const { query, params } = this.sqlModelManagerUtils.parseInsert(
        model as T,
        this.model,
        this.sqlDataSource.getDbType(),
      );
      log(query, this.logs, params);
      const { rows } = await this.pgConnection.query(query, params);
      const insertedModel = rows[0] as T;
      if (!insertedModel) {
        throw new Error(rows[0]);
      }

      return (await parseDatabaseDataIntoModelResponse(
        [insertedModel],
        this.model,
      )) as T;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Create multiple model instances in the database.
   *
   * @param {Model} models - Model instance to be saved.
   * @param {TransactionType} trx - MysqlTransaction to be used on the save operation.
   * @returns Promise resolving to an array of saved models or null if saving fails.
   */
  public async insertMany(
    models: Partial<T>[],
    trx?: TransactionType,
  ): Promise<T[]> {
    models.forEach((model) => this.model.beforeinsert(model as T));
    const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
      models as T[],
      this.model,
      this.sqlDataSource.getDbType(),
    );

    if (trx) {
      return await trx.massiveInsertQuery<T>(query, params, this.model);
    }

    try {
      const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
        models as T[],
        this.model,
        this.sqlDataSource.getDbType(),
      );

      log(query, this.logs, params);
      const { rows } = await this.pgConnection.query(query, params);
      const insertedModel = rows as T[];
      if (!insertedModel.length) {
        return [];
      }

      const insertModelPromise = insertedModel.map(
        async (model) =>
          (await parseDatabaseDataIntoModelResponse([model], this.model)) as T,
      );
      return await Promise.all(insertModelPromise);
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {TransactionType} trx - TransactionType to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  public async updateRecord(
    model: T,
    trx?: TransactionType,
  ): Promise<T | null> {
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
    if (trx) {
      await trx.queryUpdate<T>(query, params);
      if (!primaryKey) {
        log(
          "Model has no primary key so no record can be retrieved",
          this.logs,
        );
        return null;
      }

      return await this.findOneByPrimaryKey(
        model[primaryKey as keyof T] as string | number | boolean,
      );
    }

    try {
      const { query, params } = this.sqlModelManagerUtils.parseUpdate(
        model,
        this.model,
        this.sqlDataSource.getDbType(),
      );
      log(query, this.logs, params);
      await this.pgConnection.query(query, params);
      if (!primaryKey) {
        return null;
      }

      return await this.findOneByPrimaryKey(
        model[primaryKey as keyof T] as string | number | boolean,
      );
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param {TransactionType} trx - TransactionType to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  public async deleteRecord(
    model: T,
    trx?: TransactionType,
  ): Promise<T | null> {
    try {
      if (!this.model.primaryKey) {
        throw new Error(
          "Model " +
            this.model.table +
            " has no primary key to be deleted from",
        );
      }

      const { query, params } = this.sqlModelManagerUtils.parseDelete(
        this.model.table,
        this.model.primaryKey,
        model[this.model.primaryKey as keyof T] as string,
      );

      if (trx) {
        await trx.queryDelete(query, params);
        return model;
      }

      log(query, this.logs, params);
      await this.pgConnection.query(query, params);
      return model;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
   *
   * @returns {MysqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
   */
  public query(): PostgresQueryBuilder<T> {
    return new PostgresQueryBuilder<T>(
      this.model,
      this.model.table,
      this.pgConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );
  }

  /**
   * @description Returns an update query builder.
   */
  public update(): PostgresUpdateQueryBuilder<T> {
    return new PostgresUpdateQueryBuilder<T>(
      this.model,
      this.model.table,
      this.pgConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );
  }

  /**
   * @description Returns a delete query builder.
   */
  public deleteQuery(): PostgresDeleteQueryBuilder<T> {
    return new PostgresDeleteQueryBuilder<T>(
      this.model,
      this.model.table,
      this.pgConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );
  }
}
