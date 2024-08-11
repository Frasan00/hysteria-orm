import { Model } from "../Models/Model";
import {
  FindOneType,
  FindType,
  TransactionType,
} from "../Models/ModelManager/ModelManagerTypes";
import mysql, { RowDataPacket } from "mysql2/promise";
import selectTemplate from "../Resources/Query/SELECT";
import { log, queryError } from "../../Logger";
import { MysqlQueryBuilder } from "./MysqlQueryBuilder";
import { AbstractModelManager } from "../Models/ModelManager/AbstractModelManager";
import { MysqlUpdateQueryBuilder } from "./MysqlUpdateQueryBuilder";
import { PostgresUpdateQueryBuilder } from "../Postgres/PostgresUpdateQueryBuilder";
import { MysqlDeleteQueryBuilder } from "./MysqlDeleteQueryBuilder";
import MySqlModelManagerUtils from "./MySqlModelManagerUtils";

export class MysqlModelManager<
  T extends Model,
> extends AbstractModelManager<T> {
  protected mysqlPool: mysql.Pool;
  protected mysqlModelManagerUtils: MySqlModelManagerUtils<T>;

  /**
   * Constructor for MysqlModelManager class.
   *
   * @param {typeof Model} model - Model constructor.
   * @param {Pool} mysqlConnection - MySQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(model: typeof Model, mysqlConnection: mysql.Pool, logs: boolean) {
    super(model, logs);
    this.mysqlPool = mysqlConnection;
    this.mysqlModelManagerUtils = new MySqlModelManagerUtils<T>();
  }

  /**
   * Find method to retrieve multiple records from the database based on the input conditions.
   *
   * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
   * @returns Promise resolving to an array of models.
   */
  public async find(input?: FindType<T>): Promise<T[]> {
    try {
      if (!input) {
        return await this.query().many();
      }

      const query = this.query();
      if (input.select) {
        query.select(...input.select);
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

      return await query.many();
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
  public async findOne(input: FindOneType<T>): Promise<T | null> {
    const model = new this.model();
    try {
      const query = this.query();
      if (input.select) {
        query.select(...input.select);
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
      });
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Find a single record by its PK from the database.
   *
   * @param {string | number | boolean} value - PK of the record to retrieve.
   * @returns Promise resolving to a single model or null if not found.
   */
  public async findOneByPrimaryKey(
    value: string | number | boolean,
    throwErrorOnNull: boolean = false,
  ): Promise<T | null> {
    const select = selectTemplate(
      this.model.metadata.tableName,
      this.model.sqlInstance.getDbType(),
    );

    try {
      if (!this.model.metadata.primaryKey) {
        throw new Error(
          "Model " +
            this.model.metadata.tableName +
            " has no primary key to be retrieved by",
        );
      }

      return await this.query()
        .where(this.model.metadata.primaryKey as string, value)
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
  public async create(model: T, trx?: TransactionType): Promise<T | null> {
    this.model.beforeCreate(model);
    const { query, params } = this.mysqlModelManagerUtils.parseInsert(
      model,
      this.model,
    );

    if (trx) {
      return await trx.queryInsert<T>(query, params, this.model.metadata);
    }

    try {
      const { query, params } = this.mysqlModelManagerUtils.parseInsert(
        model,
        this.model,
      );

      log(query, this.logs, params);
      const [result]: any = await this.mysqlPool.query<RowDataPacket[]>(
        query,
        params,
      );
      return await this.findOneByPrimaryKey(result["insertId"]);
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Create multiple model instances in the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the save operation.
   * @returns Promise resolving to an array of saved models or null if saving fails.
   */
  public async massiveCreate(models: T[], trx?: TransactionType): Promise<T[]> {
    models.forEach((model) => {
      this.model.beforeCreate(model);
    });

    const { query, params } = this.mysqlModelManagerUtils.parseMassiveInsert(
      models,
      this.model,
    );

    if (trx) {
      return await trx.massiveInsertQuery<T>(query, params, this.model);
    }

    try {
      const { query, params } = this.mysqlModelManagerUtils.parseMassiveInsert(
        models,
        this.model,
      );
      log(query, this.logs, params);
      const [rows]: any = await this.mysqlPool.query(query, params);
      if (!rows.affectedRows) {
        return [];
      }

      const idsToFetchList = Array.from(
        { length: rows.affectedRows },
        (_, i) => i + rows.insertId,
      );

      return await this.query()
        .whereIn(this.model.metadata.primaryKey as string, idsToFetchList)
        .many();
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  public async updateRecord(
    model: T,
    trx?: TransactionType,
  ): Promise<T | null> {
    if (!this.model.metadata.primaryKey) {
      throw new Error(
        "Model " +
          this.model.metadata.tableName +
          " has no primary key to be updated, try save",
      );
    }

    if (trx) {
      const { query, params } = this.mysqlModelManagerUtils.parseUpdate(
        model,
        this.model,
      );
      await trx.queryUpdate<T>(query, params);
      if (!this.model.metadata.primaryKey) {
        return null;
      }

      return await this.findOneByPrimaryKey(
        model[this.model.metadata.primaryKey as keyof T] as string | number,
      );
    }

    try {
      const updateQuery = this.mysqlModelManagerUtils.parseUpdate(
        model,
        this.model,
      );
      log(updateQuery.query, this.logs, updateQuery.params);
      await this.mysqlPool.query(updateQuery.query, updateQuery.params);
      if (!this.model.metadata.primaryKey) {
        log(
          "Model has no primary key so no record can be retrieved",
          this.logs,
        );
        return null;
      }

      return await this.findOneByPrimaryKey(
        model[this.model.metadata.primaryKey as keyof T] as string | number,
      );
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * @description Delete a record from the database from the given column and value.
   *
   * @param {string} column - Column to filter by.
   * @param {string | number | boolean} value - Value to filter by.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the delete operation.
   * @returns Promise resolving to affected rows count
   */
  public async deleteByColumn(
    column: string,
    value: string | number | boolean,
    trx?: TransactionType,
  ): Promise<number> {
    if (trx) {
      return (await trx.queryDelete(
        this.mysqlModelManagerUtils.parseDelete(
          this.model.metadata.tableName,
          column,
          value,
        ),
      )) as number;
    }

    try {
      const deleteQuery = this.mysqlModelManagerUtils.parseDelete(
        this.model.metadata.tableName,
        column,
        value,
      );
      log(deleteQuery, this.logs);
      const [rows]: any =
        await this.mysqlPool.query<RowDataPacket[]>(deleteQuery);
      return rows.affectedRows;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  public async deleteRecord(
    model: T,
    trx?: TransactionType,
  ): Promise<T | null> {
    try {
      if (!this.model.metadata.primaryKey) {
        throw new Error(
          "Model " +
            this.model.metadata.tableName +
            " has no primary key to be deleted from, try deleteByColumn",
        );
      }
      const deleteQuery = this.mysqlModelManagerUtils.parseDelete(
        this.model.metadata.tableName,
        this.model.metadata.primaryKey,
        model[this.model.metadata.primaryKey as keyof T] as string,
      );

      if (trx) {
        await trx.queryDelete(deleteQuery);
        return model;
      }

      log(deleteQuery, this.logs);
      await this.mysqlPool.query<RowDataPacket[]>(deleteQuery);
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
  public query(): MysqlQueryBuilder<T> {
    return new MysqlQueryBuilder<T>(
      this.model,
      this.model.metadata.tableName,
      this.mysqlPool,
      this.logs,
    );
  }

  /**
   * @description Returns an update query builder.
   */
  public update(): MysqlUpdateQueryBuilder<T> | PostgresUpdateQueryBuilder<T> {
    return new MysqlUpdateQueryBuilder<T>(
      this.model,
      this.model.metadata.tableName,
      this.mysqlPool,
      this.logs,
    );
  }

  /**
   * @description Returns a delete query builder.
   */
  public delete(): MysqlDeleteQueryBuilder<T> {
    return new MysqlDeleteQueryBuilder<T>(
      this.model,
      this.model.metadata.tableName,
      this.mysqlPool,
      this.logs,
    );
  }
}
