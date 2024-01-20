/*
 * This class is used to make operations on models
 */
import { Model } from "../Models/Model";
import {
  FindOneType,
  FindType,
} from "../Models/ModelManager/ModelManagerTypes";
import mysql, { Pool, RowDataPacket } from "mysql2/promise";
import selectTemplate from "../Templates/Query/SELECT";
import ModelManagerQueryUtils from "./MySqlModelManagerUtils";
import { log, queryError } from "../../Logger";
import { MysqlQueryBuilder } from "./MysqlQueryBuilder";
import MySqlModelManagerUtils from "./MySqlModelManagerUtils";
import { MysqlTransaction } from "./MysqlTransaction";
import { AbstractModelManager } from "../Models/ModelManager/AbstractModelManager";
import {modelFromSnakeCaseToCamel} from "../../CaseUtils";

export class MysqlModelManager<
  T extends Model,
> extends AbstractModelManager<T> {
  protected mysqlPool: mysql.Pool;

  /**
   * Constructor for MysqlModelManager class.
   *
   * @param {new () => T} model - Model constructor.
   * @param {Pool} mysqlConnection - MySQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(model: new () => T, mysqlConnection: mysql.Pool, logs: boolean) {
    super(model, logs);
    this.mysqlPool = mysqlConnection;
  }

  /**
   * Find method to retrieve multiple records from the database based on the input conditions.
   *
   * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
   * @returns Promise resolving to an array of models.
   */
  public async find(input?: FindType): Promise<T[]> {
    try {
      if (!input) {
        const select = selectTemplate(this.tableName);
        log(select.selectAll, this.logs);
        const [rows] = await this.mysqlPool.query<RowDataPacket[]>(
          select.selectAll,
        );

        const models = rows.map((row) => {
          const model = row as T;
          model.metadata = this.modelInstance.metadata;
          return model;
        }) || [];
        return models.map((model) => modelFromSnakeCaseToCamel(model)) as T[] || [];
      }

      const query = ModelManagerQueryUtils.parseSelectQueryInput(
        new this.model(),
        input,
      );
      log(query, this.logs);

      const [rows] = await this.mysqlPool.query<RowDataPacket[]>(query);
      return Promise.all(
        rows.map(async (row) => {
          const model = new this.model();
          const modelData = rows[0] as T;

          // merge model data into model
          Object.assign(model, modelData);

          // relations parsing on the queried model
          await MySqlModelManagerUtils.parseRelationInput(
            model,
            input,
            this.mysqlPool,
            this.logs,
          );

          return modelFromSnakeCaseToCamel(model) as T;
        }),
      );
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
  public async findOne(input: FindOneType): Promise<T | null> {
    const model = new this.model();
    try {
      const query = ModelManagerQueryUtils.parseSelectQueryInput(model, input);
      log(query, this.logs);
      const [rows] = await this.mysqlPool.query<RowDataPacket[]>(query);
      const modelData = rows[0] as T;

      // merge model data into model
      Object.assign(model, modelData);

      // relations parsing on the queried model
      await MySqlModelManagerUtils.parseRelationInput(
        model,
        input,
        this.mysqlPool,
        this.logs,
      );

      return modelFromSnakeCaseToCamel(model);
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Find a single record by its ID from the database.
   *
   * @param {string | number} id - ID of the record to retrieve.
   * @returns Promise resolving to a single model or null if not found.
   */
  public async findOneById(id: string | number): Promise<T | null> {
    const select = selectTemplate(this.tableName);
    try {
      const stringedId = typeof id === "number" ? id.toString() : id;
      const query = select.selectById(stringedId);
      log(query, this.logs);
      const [rows] = await this.mysqlPool.query<RowDataPacket[]>(query);
      const modelData = rows[0] as T;
      return modelFromSnakeCaseToCamel(modelData) as T;
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
  public async save(model: T, trx?: MysqlTransaction): Promise<T | null> {
    if (trx) {
      return await trx.queryInsert<T>(
        ModelManagerQueryUtils.parseInsert(model),
        this.modelInstance.metadata,
      );
    }

    try {
      const insertQuery = ModelManagerQueryUtils.parseInsert(model);
      log(insertQuery, this.logs);
      const [result]: any = await this.mysqlPool.query<RowDataPacket[]>(insertQuery);
      return await this.findOneById(result['insertId']);
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
  public async update(model: T, trx?: MysqlTransaction): Promise<T | null> {
    const primaryKeyValue = this.modelInstance.metadata.primaryKey;
    if (trx) {
      await trx.queryUpdate<T>(
        ModelManagerQueryUtils.parseUpdate(model),
      );

      return await this.findOneById(model[primaryKeyValue as keyof T] as string | number);
    }

    try {
      const updateQuery = ModelManagerQueryUtils.parseUpdate(model);
      log(updateQuery, this.logs);
      await this.mysqlPool.query<RowDataPacket[]>(updateQuery);

      return await this.findOneById(model[primaryKeyValue as keyof T] as string | number);
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
    trx?: MysqlTransaction,
  ): Promise<number> {
    if (trx) {
      return await trx.queryDelete(
        ModelManagerQueryUtils.parseDelete(this.tableName, column, value),
      );
    }

    try {
      const deleteQuery = ModelManagerQueryUtils.parseDelete(
        this.tableName,
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
  public async delete(model: T, trx?: MysqlTransaction): Promise<T | null> {
    try {
      if (!model.metadata.primaryKey) {
        throw new Error(
          "Model " +
            model.metadata.tableName +
            " has no primary key to be deleted from, try deleteByColumn",
        );
      }
      const deleteQuery = ModelManagerQueryUtils.parseDelete(
        this.tableName,
        model.metadata.primaryKey,
        model[model.metadata.primaryKey as keyof T] as string,
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
   * @description Creates a new transaction.
   * @returns {MysqlTransaction} - Instance of MysqlTransaction.
   */
  public createTransaction(): MysqlTransaction {
    return new MysqlTransaction(this.mysqlPool, this.tableName, this.logs);
  }

  /**
   * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
   *
   * @returns {MysqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
   */
  public queryBuilder(): MysqlQueryBuilder<T> {
    return new MysqlQueryBuilder<T>(
      this.model,
      this.tableName,
      this.mysqlPool,
      this.logs,
    );
  }
}
