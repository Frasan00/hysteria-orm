import mysql, { RowDataPacket } from "mysql2/promise";
import { log, queryError } from "../../utils/logger";
import { Model } from "../models/model";
import { ModelManager } from "../models/model_manager/model_manager";
import {
  FindType,
  UnrestrictedFindType,
  FindOneType,
  UnrestrictedFindOneType,
} from "../models/model_manager/model_manager_types";
import SqlModelManagerUtils from "../models/model_manager/model_manager_utils";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import { SqlDataSource } from "../sql_data_source";
import { MysqlDeleteQueryBuilder } from "./mysql_delete_query_builder";
import { MysqlQueryBuilder } from "./mysql_query_builder";
import { MysqlUpdateQueryBuilder } from "./mysql_update_query_builder";

export class MysqlModelManager<T extends Model> extends ModelManager<T> {
  protected mysqlConnection: mysql.Connection;
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;

  /**
   * Constructor for MysqlModelManager class.
   *
   * @param {typeof Model} model - Model constructor.
   * @param {Connection} mysqlConnection - MySQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(
    model: typeof Model,
    mysqlConnection: mysql.Connection,
    logs: boolean,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, logs, sqlDataSource);
    this.mysqlConnection = mysqlConnection;
    this.sqlModelManagerUtils = new SqlModelManagerUtils<T>(
      "mysql",
      mysqlConnection,
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
      throw new Error("query failed " + error);
    }
  }

  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - query parameters for filtering and selecting a single record.
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
      throw new Error("query failed " + error);
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
      throw new Error("query failed " + error);
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
      const [result]: any = await this.mysqlConnection.query<RowDataPacket[]>(
        query,
        params,
      );

      // If pk it's not autogenerated but it's passed in creation process, the model it's retrieved by it's primary key
      if (this.model.primaryKey && model[this.model.primaryKey as keyof T]) {
        const pkValue = model[this.model.primaryKey as keyof T] as
          | string
          | number;
        return await this.findOneByPrimaryKey(pkValue);
      }

      return await this.findOneByPrimaryKey(result["insertId"]);
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
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
      log(query, this.logs, params);
      const [rows]: any = await this.mysqlConnection.query(query, params);

      if (!rows.affectedRows) {
        return [];
      }

      // If pk it's not autogenerated but it's passed in creation process, the model it's retrieved by it's primary key
      if (
        this.model.primaryKey &&
        models[0][this.model.primaryKey as keyof T]
      ) {
        const idsToFetchList = models.map(
          (model) => model[this.model.primaryKey as keyof T],
        ) as string[];

        const primaryKeyList = idsToFetchList
          .map((key) => `'${key}'`)
          .join(",");

        return await this.query()
          .whereIn(this.model.primaryKey as string, idsToFetchList)
          .orderByRaw(`FIELD(${this.model.primaryKey}, ${primaryKeyList})`)
          .many();
      }

      const idsToFetchList = Array.from(
        { length: rows.affectedRows },
        (_, i) => i + rows.insertId,
      );

      return await this.query()
        .whereIn(this.model.primaryKey as string, idsToFetchList)
        .many();
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
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
      await this.mysqlConnection.query(updateQuery.query, updateQuery.params);
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
      throw new Error("query failed " + error);
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
      const [rows]: any = await this.mysqlConnection.query<RowDataPacket[]>(
        query,
        params,
      );
      if (this.sqlDataSource.getDbType() === "mariadb") {
        return (await parseDatabaseDataIntoModelResponse(
          [rows[0] as T],
          this.model,
        )) as T;
      }

      return model;
    } catch (error) {
      queryError(error);
      throw new Error("query failed " + error);
    }
  }

  /**
   * Create and return a new instance of the Mysql_query_builder for building more complex SQL queries.
   *
   * @returns {Mysql_query_builder<Model>} - Instance of Mysql_query_builder.
   */
  public query(): MysqlQueryBuilder<T> {
    return new MysqlQueryBuilder<T>(
      this.model,
      this.model.table,
      this.mysqlConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );
  }

  /**
   * @description Returns an update query builder.
   */
  public update(): MysqlUpdateQueryBuilder<T> {
    return new MysqlUpdateQueryBuilder<T>(
      this.model,
      this.model.table,
      this.mysqlConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );
  }

  /**
   * @description Returns a delete query builder.
   */
  public deleteQuery(): MysqlDeleteQueryBuilder<T> {
    return new MysqlDeleteQueryBuilder<T>(
      this.model,
      this.model.table,
      this.mysqlConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );
  }
}
