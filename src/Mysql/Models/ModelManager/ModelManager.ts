/*
 * This class is used to make operations on models
 */
import { Model } from "../Model";
import { FindOneType, FindType } from "./ModelManagerTypes";
import { Pool, RowDataPacket } from "mysql2/promise";
import selectTemplate from "../../QueryTemplates/SELECT";
import ModelManagerQueryUtils from "./ModelManagerUtils";
import { log, queryError } from "../../../Logger";
import MySqlUtils from "./MySqlUtils";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Relation, RelationType } from "../Relations/Relation";

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
   * @returns Promise resolving to an array of models.
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
   * @returns Promise resolving to a single model or null if not found.
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
   * @returns Promise resolving to a single model or null if not found.
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
   * @param {Model} model - Model instance to be saved.
   * @returns Promise resolving to the saved model or null if saving fails.
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
   * @param {Model} model - Model instance to be updated.
   * @returns Promise resolving to the updated model or null if updating fails.
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

  /**
   * @description Delete a record from the database from the given column and value.
   *
   * @param {string} column - Column to filter by.
   * @param {string | number | boolean} value - Value to filter by.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  public async deleteByColumn(
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
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  public async delete(model: T): Promise<T> {
    try {
      if (!model.primaryKey) {
        throw new Error(
          "Model " +
            model.tableName +
            " has no primary key to be deleted from, try deleteByColumn",
        );
      }

      const deleteQuery = ModelManagerQueryUtils.parseDelete(
        this.tableName,
        model.primaryKey,
        model["primaryKey"],
      );
      log(deleteQuery, this.logs);
      await this.mysqlConnection.query<RowDataPacket[]>(deleteQuery);
      return model;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * @description Retrieves the relation for the input model with the specified relation and adds it to the model
   * @param model - The model to add the relation to
   * @param relationColumn - The relation to add to the model
   * @returns Promise resolving to the relation of the input model with the specified relation
   */
  public async fillRelation(model: T, relationColumn: string): Promise<T> {
    try {
      if (!model.primaryKey) {
        throw new Error("Model " + model.tableName + " has no primary key");
      }

      const relation = model[relationColumn as keyof T] as Relation;
      if (!relation || !relation.type) {
        throw new Error(
          "Model " + model.tableName + " has no relation " + relationColumn,
        );
      }

      const query = ModelManagerQueryUtils.getRelationQuery(model, relation);
      switch (relation.type) {
        case RelationType.belongsTo:
          const [rows] =
            await this.mysqlConnection.query<RowDataPacket[]>(query);
          const relatedModel: Model = MySqlUtils.convertSqlResultToModel(
            rows[0],
            this.model,
          );
          return Object.assign(model, relatedModel);

        case RelationType.hasOne:
        case RelationType.hasMany:
          log(query, this.logs);
          const [rows2] =
            await this.mysqlConnection.query<RowDataPacket[]>(query);
          const models: Model[] = rows2.map((row) =>
            MySqlUtils.convertSqlResultToModel(row, this.model),
          );
          if (models.length === 1) {
            return Object.assign(model, models[0]);
          }

          return Object.assign(model, models);

        default:
          throw new Error("Relation type not supported");
      }
    } catch (error: any) {
      queryError("Relation retrieve failed");
      throw new Error(error);
    }
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
      this.mysqlConnection,
      this.logs,
    );
  }

  /**
   * @description Starts a transaction
   */
  public async startTransaction(): Promise<void> {
    await this.mysqlConnection.beginTransaction();
  }

  /**
   * @description Commits a transaction
   */
  public async commitTransaction(): Promise<void> {
    await this.mysqlConnection.commit();
  }

  /**
   * @description Rollbacks a transaction
   */
  public async rollbackTransaction(): Promise<void> {
    await this.mysqlConnection.rollback();
  }
}
