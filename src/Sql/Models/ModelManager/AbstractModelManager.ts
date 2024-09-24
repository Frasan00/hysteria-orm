/*
 * This class is used to make operations on models
 */
import { getBaseModelInstance, Model } from "../Model";
import {
  FindOneType,
  FindType,
  TransactionType,
  UnrestrictedFindOneType,
  UnrestrictedFindType,
} from "./ModelManagerTypes";
import { SqlDataSource } from "../../SqlDatasource";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { ModelUpdateQueryBuilder } from "../../QueryBuilder/UpdateQueryBuilder";
import { ModelDeleteQueryBuilder } from "../../QueryBuilder/DeleteQueryBuilder";

export abstract class AbstractModelManager<T extends Model> {
  protected logs: boolean;
  protected sqlDataSource: SqlDataSource;
  protected model: typeof Model;
  protected modelInstance: T;
  protected throwError: boolean;

  /**
   * @param model
   * @param logs
   * @param sqlDataSource Passed if a custom connection is provided
   */
  protected constructor(
    model: typeof Model,
    logs: boolean,
    sqlDataSource: SqlDataSource,
  ) {
    this.logs = logs;
    this.model = model;
    this.throwError = false;
    this.modelInstance = getBaseModelInstance<T>();
    this.sqlDataSource = sqlDataSource;
  }

  /**
   * @description Finds all records that match the input
   * @param input
   */
  public abstract find(input?: FindType<T>): Promise<T[]>;
  public abstract find(input?: UnrestrictedFindType<T>): Promise<T[]>;
  public abstract find(
    input?: FindType<T> | UnrestrictedFindType<T>,
  ): Promise<T[]>;

  /**
   * @description Finds the first record that matches the input
   * @param input
   */
  public abstract findOne(input: UnrestrictedFindOneType<T>): Promise<T | null>;
  public abstract findOne(input: FindOneType<T>): Promise<T | null>;
  public abstract findOne(
    input: FindOneType<T> | UnrestrictedFindOneType<T>,
  ): Promise<T | null>;

  /**
   * @description Finds a record by its primary key
   * @param value
   * @param throwErrorOnNull
   */
  public abstract findOneByPrimaryKey(
    value: string | number | boolean,
    throwErrorOnNull: boolean,
  ): Promise<T | null>;

  /**
   * @description Creates a new record
   * @param model
   * @param trx
   */
  public abstract create(
    model: Partial<T>,
    trx?: TransactionType,
  ): Promise<T | null>;

  /**
   * @description Creates multiple records
   * @param model
   * @param trx
   */
  public abstract massiveCreate(
    model: Partial<T>[],
    trx?: TransactionType,
  ): Promise<T[]>;

  /**
   * @description Updates a record
   * @param model
   * @param trx
   */
  public abstract updateRecord(
    model: T,
    trx?: TransactionType,
  ): Promise<T | null>;

  /**
   * @description Deletes a record by a column
   * @param column
   * @param value
   * @param trx
   */
  public abstract deleteByColumn(
    column: string,
    value: string | number | boolean,
    trx?: TransactionType,
  ): Promise<number | T | null>;

  /**
   * @description Deletes a record
   * @param model
   * @param trx
   */
  public abstract deleteRecord(
    model: T,
    trx?: TransactionType,
  ): Promise<T | null>;

  /**
   * @description Returns a query builder
   */
  public abstract query(): QueryBuilder<T>;

  /**
   * @description Returns an update query builder
   */
  public abstract update(): ModelUpdateQueryBuilder<T>;

  /**
   * @description Returns a delete query builder
   */
  public abstract delete(): ModelDeleteQueryBuilder<T>;
}
