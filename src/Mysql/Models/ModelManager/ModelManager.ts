/*
 * This class is used to make operations on models
 */
import { Model } from "../Model";
import { FindOneType, FindType } from "./ModelManagerTypes";
import { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import selectTemplate from "../../Templates/Query/SELECT";
import ModelManagerQueryUtils from "./ModelManagerUtils";
import { log, queryError } from "../../../Logger";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import ModelManagerUtils from "./ModelManagerUtils";
import { Transaction } from "../../Transaction/Transaction";

export class ModelManager<T extends Model> {
  protected logs: boolean;
  protected mysqlPool: Pool;
  protected mysqlConnection!: PoolConnection;
  protected model: new () => T;
  public tableName: string;

  /**
   * Constructor for ModelManager class.
   *
   * @param {new () => T} model - Model constructor.
   * @param {Pool} mysqlConnection - MySQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(model: new () => T, mysqlConnection: Pool, logs: boolean) {
    this.logs = logs;
    this.tableName = model.name;
    this.model = model;
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
        return rows.map((row) => row as T) || [];
      }

      const model = new this.model();
      const query = ModelManagerQueryUtils.parseSelectQueryInput(
        new this.model(),
        input,
      );
      log(query, this.logs);
      const [rows] = await this.mysqlPool.query<RowDataPacket[]>(query);
      return Promise.all(
        rows.map(async (row) => {
          const modelData = rows[0] as T;

          // merge model data into model
          Object.assign(model, modelData);

          // relations parsing on the queried model
          await ModelManagerUtils.parseRelationInput(
            model,
            input,
            this.mysqlPool,
            this.logs,
          );

          return model;
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
      await ModelManagerUtils.parseRelationInput(
        model,
        input,
        this.mysqlPool,
        this.logs,
      );

      return model;
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
      return rows[0] as T;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {Transaction} trx - Transaction to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  public async save(model: T, trx?: Transaction): Promise<T | null | void> {
    if (trx) {
      trx.addQuery(ModelManagerQueryUtils.parseInsert(model));
      return;
    }

    try {
      const insertQuery = ModelManagerQueryUtils.parseInsert(model);
      log(insertQuery, this.logs);
      const [rows]: any = await this.mysqlPool.query(insertQuery);

      return (await this.findOneById(rows.insertId)) || null;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {Transaction} trx - Transaction to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  public async update(model: T, trx?: Transaction): Promise<T | null | void> {
    if (trx) {
      trx.addQuery(ModelManagerQueryUtils.parseUpdate(model));
      return;
    }

    try {
      const updateQuery = ModelManagerQueryUtils.parseUpdate(model);
      log(updateQuery, this.logs);
      const [rows] = await this.mysqlPool.query<RowDataPacket[]>(updateQuery);
      if (!model.metadata.primaryKey) {
        return null;
      }

      return await this.findOneById(model.metadata["primaryKey"]);
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
   * @param {Transaction} trx - Transaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  public async deleteByColumn(
    column: string,
    value: string | number | boolean,
    trx?: Transaction,
  ): Promise<T | void> {
    if (trx) {
      trx.addQuery(
        ModelManagerQueryUtils.parseDelete(this.tableName, column, value),
      );
      return;
    }
    try {
      const deleteQuery = ModelManagerQueryUtils.parseDelete(
        this.tableName,
        column,
        value,
      );
      log(deleteQuery, this.logs);
      const [rows] = await this.mysqlPool.query<RowDataPacket[]>(deleteQuery);
      return rows[0] as T;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param {Transaction} trx - Transaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  public async delete(model: T, trx?: Transaction): Promise<T | void> {
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
        model.metadata["primaryKey"],
      );

      if (trx) {
        trx.addQuery(deleteQuery);
        return;
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
   */
  public createTransaction(): Transaction {
    return new Transaction(this.mysqlPool, this.logs);
  }

  /**
   * Create and return a new instance of the QueryBuilder for building more complex SQL queries.
   *
   * @returns {QueryBuilder<Model>} - Instance of QueryBuilder.
   */
  public queryBuilder(): QueryBuilder<T> {
    return new QueryBuilder<T>(
      this.model,
      this.tableName,
      this.mysqlPool,
      this.logs,
    );
  }
}
