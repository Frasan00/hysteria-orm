/*
 * This class is used to make operations on models
 */
import { Model } from "../Model";
import { FindOneType, FindType } from "./ModelManagerTypes";
import { MysqlQueryBuilder } from "../../Mysql/MysqlQueryBuilder";
import { MysqlTransaction } from "../../Mysql/MysqlTransaction";
import { PostgresTransaction } from "../../Postgres/PostgresTransaction";
import { PostgresQueryBuilder } from "../../Postgres/PostgresQueryBuilder";

export abstract class ModelManager<T extends Model> {
  protected logs: boolean;
  protected model: new () => T;
  protected modelInstance: T;
  public tableName: string;

  /**
   * Constructor for ModelManager class.
   *
   * @param {new () => T} model - Model constructor.
   * @param {boolean} logs - Flag to enable or disable logging.
   */
  protected constructor(model: new () => T, logs: boolean) {
    this.logs = logs;
    this.tableName = model.name;
    this.model = model;
    this.modelInstance = new this.model();
  }

  /**
   * Find method to retrieve multiple records from the database based on the input conditions.
   *
   * @param {FindType} input - Optional query parameters for filtering, ordering, and pagination.
   * @returns Promise resolving to an array of models.
   */
  public abstract find(input?: FindType): Promise<T[]>;

  /**
   * Find a single record from the database based on the input conditions.
   *
   * @param {FindOneType} input - Query parameters for filtering and selecting a single record.
   * @returns Promise resolving to a single model or null if not found.
   */
  public abstract findOne(input: FindOneType): Promise<T | null>;

  /**
   * Find a single record by its ID from the database.
   *
   * @param {string | number} id - ID of the record to retrieve.
   * @returns Promise resolving to a single model or null if not found.
   */
  public abstract findOneById(id: string | number): Promise<T | null>;

  /**
   * Save a new model instance to the database.
   *
   * @param {Model} model - Model instance to be saved.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the save operation.
   * @returns Promise resolving to the saved model or null if saving fails.
   */
  public abstract save(model: T, trx?: MysqlTransaction): Promise<T | null>;

  /**
   * Update an existing model instance in the database.
   * @param {Model} model - Model instance to be updated.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the update operation.
   * @returns Promise resolving to the updated model or null if updating fails.
   */
  public abstract update(
    model: T,
    trx?: MysqlTransaction,
  ): Promise<number> | Promise<number | null>;

  /**
   * @description Delete a record from the database from the given column and value.
   *
   * @param {string} column - Column to filter by.
   * @param {string | number | boolean} value - Value to filter by.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  public abstract deleteByColumn(
    column: string,
    value: string | number | boolean,
    trx?: MysqlTransaction,
  ): Promise<number> | Promise<number | null>;

  /**
   * @description Delete a record from the database from the given model.
   *
   * @param {Model} model - Model to delete.
   * @param {MysqlTransaction} trx - MysqlTransaction to be used on the delete operation.
   * @returns Promise resolving to the deleted model or null if deleting fails.
   */
  public abstract delete(
    model: T,
    trx?: MysqlTransaction,
  ): Promise<number> | Promise<number | null>;

  /**
   * @description Creates a new transaction.
   * @returns {MysqlTransaction} - Instance of MysqlTransaction.
   */
  public abstract createTransaction(): MysqlTransaction | PostgresTransaction;

  /**
   * Create and return a new instance of the MysqlQueryBuilder for building more complex SQL queries.
   *
   * @returns {MysqlQueryBuilder<Model>} - Instance of MysqlQueryBuilder.
   */
  public abstract queryBuilder():
    | MysqlQueryBuilder<T>
    | PostgresQueryBuilder<T>;
}
