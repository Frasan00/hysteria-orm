import { camelToSnakeCase } from "../../CaseUtils";
import { MysqlTransaction } from "../Mysql/MysqlTransaction";
import { PostgresTransaction } from "../Postgres/PostgresTransaction";
import { SqlDataSource } from "../SqlDataSource";
import { FindOneType, FindType } from "./ModelManager/ModelManagerTypes";

export interface Metadata {
  readonly tableName: string;
  readonly primaryKey?: string;
}

/*
 * Represents a model in the Database
 */
export abstract class Model {
  public aliasColumns: { [key: string]: string | number | boolean } = {};
  public metadata: Metadata;
  private static sqlDataSourceInstance: SqlDataSource;

  protected constructor(options: { tableName?: string; primaryKey?: string }) {
    if (!options.tableName) {
      const className =
        this.constructor.name.at(0)?.toLowerCase() +
        this.constructor.name.slice(1);
      options.tableName = className.endsWith("s")
        ? camelToSnakeCase(className)
        : camelToSnakeCase(className) + "s";
    }

    this.metadata = {
      tableName: options.tableName as string,
      primaryKey: options.primaryKey,
    };
  }

  // Static methods
  /**
   * @description Gives a query instance for the given model
   * @param model
   * @returns
   */
  public static query<T extends Model>(this: new () => T) {
    const sqlInstance = SqlDataSource.getInstance();
    return sqlInstance.getModelManager(this).query();
  }

  /**
   * @description Finds records for the given model
   * @param model
   * @param {FindType} options
   * @returns
   */
  public static find<T extends Model>(this: new () => T, options?: FindType) {
    const sqlInstance = SqlDataSource.getInstance();
    return sqlInstance.getModelManager(this).find(options);
  }

  /**
   * @description Finds a record for the given model
   * @param model
   * @param {FindOneType} options
   * @returns
   */
  public static findOne<T extends Model>(
    this: new () => T,
    options: FindOneType,
  ) {
    const sqlInstance = SqlDataSource.getInstance();
    return sqlInstance.getModelManager(this).findOne(options);
  }

  /**
   * @description Finds a record for the given model for the given id, "id" must be set in the model in order for it to work
   * @param model
   * @param {number | string} id
   * @returns
   */
  public static findOneById<T extends Model>(
    this: new () => T,
    id: string | number,
  ) {
    const sqlInstance = SqlDataSource.getInstance();
    return sqlInstance.getModelManager(this).findOneById(id);
  }

  /**
   * @description Saves a new record to the database
   * @param model
   * @param {Model} modelInstance
   * @param {MysqlTransaction & PostgresTransaction} trx
   * @returns
   */
  public static save<T extends Model>(
    this: new () => T,
    modelInstance: T,
    trx?: MysqlTransaction & PostgresTransaction,
  ) {
    const sqlInstance = SqlDataSource.getInstance();
    return sqlInstance.getModelManager(this).save(modelInstance, trx);
  }

  /**
   * @description Updates a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param {MysqlTransaction & PostgresTransaction} trx
   * @returns
   */
  public static update<T extends Model>(
    this: new () => T,
    modelInstance: T,
    trx?: MysqlTransaction & PostgresTransaction,
  ) {
    const sqlInstance = SqlDataSource.getInstance();
    return sqlInstance.getModelManager(this).update(modelInstance, trx);
  }

  /**
   * @description Deletes a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param {MysqlTransaction & PostgresTransaction} trx
   * @returns
   */
  public static delete<T extends Model>(
    this: new () => T,
    modelInstance: T,
    trx?: MysqlTransaction & PostgresTransaction,
  ) {
    const sqlInstance = SqlDataSource.getInstance();
    return sqlInstance.getModelManager(this).delete(modelInstance, trx);
  }

  /**
   * @description Deletes a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param {string} column
   * @param {string | number | boolean} value
   * @param {MysqlTransaction & PostgresTransaction} trx
   * @returns
   */
  public static deleteByColumn<T extends Model>(
    this: new () => T,
    column: string,
    value: string | number | boolean,
    trx?: MysqlTransaction & PostgresTransaction,
  ) {
    const sqlInstance = SqlDataSource.getInstance();
    return sqlInstance.getModelManager(this).deleteByColumn(column, value, trx);
  }

  /**
   * @description Deletes a record to the database
   * @param model
   * @param {Model} modelInstance
   * @returns
   */
  public static getMetadata<T extends Model>(this: new () => T) {
    const sqlInstance = SqlDataSource.getInstance();
    return sqlInstance.getModelManager(this).getMetadata();
  }

  public static setProps<T extends Model>(instance: T, data: Partial<T>): void {
    for (const key in data) {
      Object.assign(instance, { [key]: data[key] });
    }
  }
}
