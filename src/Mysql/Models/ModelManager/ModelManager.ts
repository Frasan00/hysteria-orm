/*
 * This class is used to make operations on models
 */
import { Model } from "../Model";
import { FindOneType, FindType, TransactionType } from "./ModelManagerTypes";
import { Pool, RowDataPacket } from "mysql2/promise";
import selectTemplate from "../../QueryTemplates/SELECT";
import ModelManagerQueryUtils from "./ModelManagerUtils";
import { log, queryError } from "../../../Logger";
import MySqlUtils from "./MySqlUtils";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import whereTemplate from "../../QueryTemplates/WHERE.TS";

export class ModelManager<T extends Model> {
  protected logs: boolean;
  protected mysqlConnection: Pool;
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
    this.mysqlConnection = mysqlConnection;
  }

  /**
   * Find method to retrieve multiple records from the database based on the input conditions.
   *
   * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
   * @returns {Promise<T[]>} - Promise resolving to an array of models.
   */

  public async find(input?: FindType): Promise<T[]> {
    try {
      if (!input) {
        const select = selectTemplate(this.tableName);
        log(select.selectAll, this.logs);
        const [rows] = await this.mysqlConnection.query<RowDataPacket[]>(
          select.selectAll,
        );
        return (
          rows.map((row) =>
            MySqlUtils.convertSqlResultToModel(row, this.model),
          ) || []
        );
      }

      const query = ModelManagerQueryUtils.parseSelectQueryInput(
        new this.model(),
        input,
      );
      log(query, this.logs);
      const [rows] = await this.mysqlConnection.query<RowDataPacket[]>(query);
      return rows.map((row) =>
        MySqlUtils.convertSqlResultToModel(row, this.model),
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
   * @returns {Promise<T | null>} - Promise resolving to a single model or null if not found.
   */
  public async findOne(input: FindOneType): Promise<T | null> {
    try {
      const query = ModelManagerQueryUtils.parseSelectQueryInput(
        new this.model(),
        input,
      );
      log(query, this.logs);
      const [rows] = await this.mysqlConnection.query<RowDataPacket[]>(query);
      return MySqlUtils.convertSqlResultToModel(rows[0], this.model);
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Find a single record by its ID from the database.
   *
   * @param {string | number} id - ID of the record to retrieve.
   * @returns {Promise<T | null>} - Promise resolving to a single model or null if not found.
   */
  public async findOneById(id: string | number): Promise<T | null> {
    const select = selectTemplate(this.tableName);
    try {
      const stringedId = typeof id === "number" ? id.toString() : id;
      const query = select.selectById(stringedId);
      log(query, this.logs);
      const [rows] = await this.mysqlConnection.query<RowDataPacket[]>(query);
      return MySqlUtils.convertSqlResultToModel(rows[0], this.model);
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Save a new model instance to the database.
   *
   * @param {T} model - Model instance to be saved.
   * @returns {Promise<T | null>} - Promise resolving to the saved model or null if saving fails.
   */
  public async save(model: T): Promise<T | null> {
    try {
      const insertQuery = ModelManagerQueryUtils.parseInsert(model);
      log(insertQuery, this.logs);
      const [rows]: any = await this.mysqlConnection.query(insertQuery);

      return (await this.findOneById(rows.insertId)) || null;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Update an existing model instance in the database.
   *
   * @param {T} model - Model instance to be updated.
   * @returns {Promise<T | null>} - Promise resolving to the updated model or null if updating fails.
   */
  public async update(model: T): Promise<T | null> {
    try {
      const updateQuery = ModelManagerQueryUtils.parseUpdate(model);
      log(updateQuery, this.logs);
      const [rows] =
        await this.mysqlConnection.query<RowDataPacket[]>(updateQuery);
      if (!model.primaryKey) {
        return null;
      }

      return await this.findOneById(model["primaryKey"]);
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /*
   * Delete a record from the database based on a specified column and value.
   *
   * @param {string} column - Column to filter the deletion.
   * @param {string | number | boolean} value - Value to filter the deletion.
   * @returns {Promise<T>} - Promise resolving to the deleted model.
   */
  public async delete(
    column: string,
    value: string | number | boolean,
  ): Promise<T> {
    try {
      const deleteQuery = ModelManagerQueryUtils.parseDelete(
        this.tableName,
        column,
        value,
      );
      log(deleteQuery, this.logs);
      const [rows] =
        await this.mysqlConnection.query<RowDataPacket[]>(deleteQuery);
      return MySqlUtils.convertSqlResultToModel(rows[0], this.model);
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

    /**
     * @description Retrieves the relation of the model T with the specified table, if none the original model is returned
     * @param table - The table to retrieve the relation from
     * @returns {Promise<T | T[]>} - Promise resolving to the relation of the model T with the specified table
     */
  public async getRelation(table: string): Promise<T | T[]>{
    const modelInstance = new this.model();
    if(!modelInstance.primaryKey){
        throw new Error('Model ' + modelInstance.tableName + ' has no primary key');
    }
    const primaryKeyName = modelInstance.primaryKey as keyof T;

    const select = selectTemplate(table);
    const where = whereTemplate(table);
    const query = select.selectAll + where.where(modelInstance.primaryKey, (modelInstance[primaryKeyName]) as string, "=");
    log(query, this.logs);
    const [rows] = await this.mysqlConnection.query<RowDataPacket[]>(query);
    const models = rows.map((row) => MySqlUtils.convertSqlResultToModel(row, this.model));
    if(models.length === 0){
        return modelInstance;
    }

    if(models.length === 1){
        Object.assign(modelInstance, models[0]);
    }

    return Object.assign(modelInstance, models);
  }

  /**
   * Create and return a new instance of the QueryBuilder for building more complex SQL queries.
   *
   * @returns {QueryBuilder<T>} - Instance of QueryBuilder.
   */
  public queryBuilder(): QueryBuilder<T> {
    return new QueryBuilder<T>(
      this.model,
      this.tableName,
      this.mysqlConnection,
      this.logs,
      new this.model().primaryKey,
    );
  }

  // TO DO Trx
}
