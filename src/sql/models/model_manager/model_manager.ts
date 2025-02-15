import { QueryBuilder } from "../../query_builder/query_builder";
import { SqlDataSource } from "../../sql_data_source";
import { Model, getBaseModelInstance } from "../model";
import {
  FindType,
  UnrestrictedFindType,
  UnrestrictedFindOneType,
  FindOneType,
} from "./model_manager_types";

export abstract class ModelManager<T extends Model> {
  protected sqlDataSource: SqlDataSource;
  protected logs: boolean;
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
  abstract find(input?: FindType<T>): Promise<T[]>;
  abstract find(input?: UnrestrictedFindType<T>): Promise<T[]>;
  abstract find(input?: FindType<T> | UnrestrictedFindType<T>): Promise<T[]>;

  /**
   * @description Finds the first record that matches the input
   * @param input
   */
  abstract findOne(input: UnrestrictedFindOneType<T>): Promise<T | null>;
  abstract findOne(input: FindOneType<T>): Promise<T | null>;
  abstract findOne(
    input: FindOneType<T> | UnrestrictedFindOneType<T>,
  ): Promise<T | null>;

  /**
   * @description Finds the first record that matches the input or throws an error
   */
  async findOneOrFail(
    input: (FindOneType<T> | UnrestrictedFindOneType<T>) & {
      customError?: Error;
    },
  ): Promise<T> {
    const result = await this.findOne(input);
    if (result === null) {
      if (input.customError) {
        throw input.customError;
      }

      throw new Error("ROW_NOT_FOUND");
    }

    return result;
  }

  /**
   * @description Finds a record by its primary key
   * @param value
   * @param throwErrorOnNull
   */
  abstract findOneByPrimaryKey(
    value: string | number | boolean,
    throwErrorOnNull: boolean,
  ): Promise<T | null>;

  /**
   * @description Creates a new record
   * @param model
   * @param trx
   */
  abstract insert(model: Partial<T>): Promise<T | null>;

  /**
   * @description Creates multiple records
   * @param model
   * @param trx
   */
  abstract insertMany(model: Partial<T>[]): Promise<T[]>;

  /**
   * @description Updates a record
   * @param model
   * @param trx
   */
  abstract updateRecord(model: T): Promise<T | null>;

  /**
   * @description Deletes a record
   * @param model
   * @param trx
   */
  abstract deleteRecord(model: T): Promise<T | null>;

  /**
   * @description Returns a query builder
   */
  abstract query(): QueryBuilder<T>;
}
