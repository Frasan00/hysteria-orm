/*
 * This class is used to make operations on models
 */
import { Model } from "../Models/Model";
import {
  FindOneType,
  FindType,
} from "../Models/ModelManager/ModelManagerTypes";
import pg, { QueryResult } from "pg";
import selectTemplate from "../Templates/Query/SELECT";
import ModelManagerQueryUtils from "../Mysql/MySqlModelManagerUtils";
import { log, queryError } from "../../Logger";
import PostgresModelManagerUtils from "./PostgresModelManagerUtils";
import { AbstractModelManager } from "../Models/ModelManager/AbstractModelManager";
import { PostgresTransaction } from "./PostgresTransaction";
import { PostgresQueryBuilder } from "./PostgresQueryBuilder";
import { parseDatabaseDataIntoModelResponse } from "../../CaseUtils";

export class PostgresModelManager<
  T extends Model,
> extends AbstractModelManager<T> {
  protected pgPool: pg.Pool;

  /**
   * Constructor for PostgresModelManager class.
   *
   * @param {new () => T} model - Model constructor.
   * @param {Pool} pgConnection - PostgreSQL connection pool.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  constructor(model: new () => T, pgConnection: pg.Pool, logs: boolean) {
    super(model, logs);
    this.pgPool = pgConnection;
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
        const { rows }: QueryResult<T> = await this.pgPool.query(
          select.selectAll,
        );

        const models =
          rows.map((row) => {
            const model = row as T;
            model.metadata = this.modelInstance.metadata;
            model.aliasColumns = this.modelInstance.aliasColumns;
            model.setProps = this.modelInstance.setProps;
            return parseDatabaseDataIntoModelResponse([model]) as T;
          }) || [];
        return (
          (models.map((model) =>
            parseDatabaseDataIntoModelResponse([model]),
          ) as T[]) || []
        );
      }

      const query = ModelManagerQueryUtils.parseSelectQueryInput(
        new this.model(),
        input,
      );
      log(query, this.logs);

      const { rows }: QueryResult<T> = await this.pgPool.query(query);
      return Promise.all(
        rows.map(async (row) => {
          const model = new this.model();
          const modelData = row as T;

          // merge model data into model
          Object.assign(model, modelData);

          // relations parsing on the queried model
          await PostgresModelManagerUtils.parseRelationInput(
            model,
            input,
            this.pgPool,
            this.logs,
          );

          return parseDatabaseDataIntoModelResponse([model]) as T;
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

      const { rows } = await this.pgPool.query(query);
      const modelData = rows[0] as T;

      if (!modelData) {
        return null;
      }

      Object.assign(model, modelData);

      await PostgresModelManagerUtils.parseRelationInput(
        model,
        input,
        this.pgPool,
        this.logs,
      );

      return parseDatabaseDataIntoModelResponse([model]) as T;
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

      const { rows } = await this.pgPool.query(query);
      const modelData = rows[0] as T;

      if (!modelData) {
        return null;
      }

      return parseDatabaseDataIntoModelResponse([modelData]) as T;
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
  public async save(model: T, trx?: PostgresTransaction): Promise<T | null> {
    if (trx) {
      return await trx.queryInsert<T>(
        ModelManagerQueryUtils.parseInsert(model),
        this.modelInstance.metadata,
      );
    }

    try {
      const insertQuery = ModelManagerQueryUtils.parseInsert(model);
      log(insertQuery, this.logs);
      const { rows } = await this.pgPool.query(insertQuery);
      const insertedModel = rows[0] as T;

      if (!insertedModel) {
        return null;
      }

      return parseDatabaseDataIntoModelResponse([insertedModel]) as T;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {PostgresTransaction} trx - PostgresTransaction to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  public async update(model: T, trx?: PostgresTransaction): Promise<T | null> {
    const primaryKeyValue = this.modelInstance.metadata.primaryKey;
    if (trx) {
      await trx.queryUpdate<T>(ModelManagerQueryUtils.parseUpdate(model));

      return await this.findOneById(
        model[primaryKeyValue as keyof T] as string | number,
      );
    }

    try {
      const updateQuery = ModelManagerQueryUtils.parseUpdate(model);
      log(updateQuery, this.logs);
      await this.pgPool.query(updateQuery);

      return await this.findOneById(
        model[primaryKeyValue as keyof T] as string | number,
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
   * @param {PostgresTransaction} trx - PostgresTransaction to be used on the delete operation.
   * @returns Promise resolving to affected rows count
   */
  public async deleteByColumn(
    column: string,
    value: string | number | boolean,
    trx?: PostgresTransaction,
  ): Promise<number> {
    if (trx) {
      return (
        (await trx.queryDelete(
          ModelManagerQueryUtils.parseDelete(this.tableName, column, value),
        )) || 0
      );
    }

    try {
      const deleteQuery = ModelManagerQueryUtils.parseDelete(
        this.tableName,
        column,
        value,
      );
      log(deleteQuery, this.logs);
      const result = await this.pgPool.query(deleteQuery);
      return result.rowCount || 0;
    } catch (error) {
      queryError(error);
      throw new Error("Query failed " + error);
    }
  }

  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param {PostgresTransaction} trx - PostgresTransaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  public async delete(model: T, trx?: PostgresTransaction): Promise<T | null> {
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
      await this.pgPool.query(deleteQuery);
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
  public createTransaction(): PostgresTransaction {
    return new PostgresTransaction(this.pgPool, this.tableName, this.logs);
  }

  /**
   * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
   *
   * @returns {MysqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
   */
  public queryBuilder(): PostgresQueryBuilder<T> {
    return new PostgresQueryBuilder<T>(
      this.model,
      this.tableName,
      this.pgPool,
      this.logs,
    );
  }
}
