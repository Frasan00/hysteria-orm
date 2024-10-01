import { Model } from "../Models/Model";
import {
  FindOneType,
  FindType,
  UnrestrictedFindOneType,
  UnrestrictedFindType,
} from "../Models/ModelManager/ModelManagerTypes";
import { log, queryError } from "../../Logger";
import { AbstractModelManager } from "../Models/ModelManager/AbstractModelManager";
import { SqlDataSource } from "../SqlDatasource";
import SqlModelManagerUtils from "../Models/ModelManager/ModelManagerUtils";
import mssql from "mssql";
import { MssqlUpdateQueryBuilder } from "./MssqlUpdateQueryBuilder";
import { MssqlDeleteQueryBuilder } from "./MssqlDeleteQueryBuilder";
import { MssqlQueryBuilder } from "./MssqlQueryBuilder";

export class MssqllModelManager<
  T extends Model,
> extends AbstractModelManager<T> {
  protected mssqlConnection: mssql.ConnectionPool;
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;

  /**
   * Constructor for MssqlModelManager class.
   *
   * @param {typeof Model} model - Model constructor.
   * @param {Connection} mssqlConnection - MySQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(
    model: typeof Model,
    mssqlConnection: mssql.ConnectionPool,
    logs: boolean,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, logs, sqlDataSource);
    this.mssqlConnection = mssqlConnection;
    this.sqlModelManagerUtils = new SqlModelManagerUtils<T>(
      "mssql",
      mssqlConnection,
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
   * @param {string | number | boolean} value - PK of the record to retrieve, hooks will not have any effect, since it's a direct query for the PK.
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
        .where(this.model.primaryKey as string, value)
        .one({
          throwErrorOnNull,
        });
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {TransactionType} trx - TransactionType to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  public async insert(model: Partial<T>): Promise<T | null> {
    this.model.beforeInsert(model as T);
    const { query, params } = this.sqlModelManagerUtils.parseInsert(
      model as T,
      this.model,
      this.sqlDataSource.getDbType(),
    );

    try {
      log(query, this.logs, params);
      const mysqlRequest = this.mssqlConnection.request();
      MssqllModelManager.addParamsToMssqlRequest(mysqlRequest, query, params);
      mysqlRequest.output(this.model.primaryKey as string, mssql.VarChar(255));
      const result = await mysqlRequest.query(query);
      if (!result.output[this.model.primaryKey as string]) {
        return null;
      }

      return await this.findOneByPrimaryKey(
        result.output[this.model.primaryKey as string],
      );
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Create multiple model instances in the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {TransactionType} trx - TransactionType to be used on the save operation.
   * @returns Promise resolving to an array of saved models or null if saving fails.
   */
  public async insertMany(models: Partial<T>[]): Promise<T[]> {
    models.forEach((model) => {
      this.model.beforeInsert(model as T);
    });

    const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
      models as T[],
      this.model,
      this.sqlDataSource.getDbType(),
    );

    try {
      const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
        models as T[],
        this.model,
        this.sqlDataSource.getDbType(),
      );
      log(query, this.logs, params);
      const mssqlRequest = this.mssqlConnection.request();
      MssqllModelManager.addParamsToMssqlRequest(mssqlRequest, query, params);
      models.forEach((_, index) => {
        mssqlRequest.output(
          this.model.primaryKey as string,
          mssql.VarChar(255),
          `@${this.model.primaryKey}${index}`,
        );
      });

      const result = await mssqlRequest.query(query);
      const idsToFetchList = models.map(
        (_, index) => result.output[(this.model.primaryKey as string) + index],
      );

      return await this.query()
        .whereIn(this.model.primaryKey as string, idsToFetchList)
        .many();
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
  public async updateRecord(model: T): Promise<T | null> {
    if (!this.model.primaryKey) {
      throw new Error(
        "Model " +
          this.model.table +
          " has no primary key to be updated, try save",
      );
    }

    try {
      const updateQuery = this.sqlModelManagerUtils.parseUpdate(
        model,
        this.model,
        this.sqlDataSource.getDbType(),
      );
      log(updateQuery.query, this.logs, updateQuery.params);
      const mssqlRequest = this.mssqlConnection.request();
      MssqllModelManager.addParamsToMssqlRequest(
        mssqlRequest,
        updateQuery.query,
        updateQuery.params,
      );
      await mssqlRequest.query(updateQuery.query);
      if (!this.model.primaryKey) {
        log(
          "Model has no primary key so no record can be retrieved",
          this.logs,
        );
        return null;
      }

      return await this.findOneByPrimaryKey(
        model[this.model.primaryKey as keyof T] as string | number,
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
  public async deleteRecord(model: T): Promise<T | null> {
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

      log(query, this.logs, params);
      const mssqlRequest = this.mssqlConnection.request();
      MssqllModelManager.addParamsToMssqlRequest(mssqlRequest, query, params);
      await mssqlRequest.query(query);
      return model;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
   *
   * @returns {MssqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
   */
  public query(): MssqlQueryBuilder<T> {
    return new MssqlQueryBuilder<T>(
      this.model,
      this.model.table,
      this.mssqlConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );
  }

  /**
   * @description Returns an update query builder.
   */
  public update(): MssqlUpdateQueryBuilder<T> {
    return new MssqlUpdateQueryBuilder<T>(
      this.model,
      this.model.table,
      this.mssqlConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );
  }

  /**
   * @description Returns a delete query builder.
   */
  public deleteQuery(): MssqlDeleteQueryBuilder<T> {
    return new MssqlDeleteQueryBuilder<T>(
      this.model,
      this.model.table,
      this.mssqlConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );
  }

  /**
   *  @description Adds parameters to the mssql request object given a li
   * @param request
   * @param query
   * @param params
   */
  static addParamsToMssqlRequest(
    request: mssql.Request,
    query: string,
    params: any[],
  ): void {
    const queryParameters = query.match(/@(\w+)/g);
    queryParameters?.forEach((param, index) => {
      request.input(param.replace("@", ""), params[index]);
    });
  }
}
