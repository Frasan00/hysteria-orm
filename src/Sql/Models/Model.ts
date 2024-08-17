import { camelToSnakeCase } from "../../CaseUtils";
import { MysqlTransaction } from "../Mysql/MysqlTransaction";
import { PostgresTransaction } from "../Postgres/PostgresTransaction";
import {
  DeleteQueryBuilders,
  OneOptions,
  QueryBuilders,
  UpdateQueryBuilders,
} from "../QueryBuilder/QueryBuilder";
import { SqlDataSource } from "../SqlDatasource";
import { FindOneType, FindType } from "./ModelManager/ModelManagerTypes";
import "reflect-metadata";

export interface Metadata {
  readonly tableName: string;
  readonly primaryKey?: string;
}

function getBaseMetadata(className: string): Metadata {
  className = className.at(0)?.toLowerCase() + className.slice(1);
  const tableName = className.endsWith("s")
    ? camelToSnakeCase(className)
    : camelToSnakeCase(className) + "s";

  return {
    tableName: tableName,
  };
}

const COLUMN_METADATA_KEY = Symbol("columns");

export function column(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const existingColumns =
      Reflect.getMetadata(COLUMN_METADATA_KEY, target) || [];
    existingColumns.push(propertyKey);
    Reflect.defineMetadata(COLUMN_METADATA_KEY, existingColumns, target);
  };
}

export function getModelColumns(target: any): string[] {
  return Reflect.getMetadata(COLUMN_METADATA_KEY, target.prototype) || [];
}

/*
 * Represents a model in the Database
 */
export class Model {
  public extraColumns: { [key: string]: string | number | boolean } = {};
  public static sqlInstance: SqlDataSource;
  public static metadata: Metadata = getBaseMetadata(this.constructor.name);

  public constructor(classProps: Partial<Model> = {}) {
    for (const key in classProps) {
      Object.assign(this, { [key]: classProps[key as keyof Model] });
    }
  }

  /**
   * @description Gives a query instance for the given model
   * @param model
   * @returns {QueryBuilders<T>}
   */
  public static query<T extends Model>(
    this: new () => T | typeof Model,
  ): QueryBuilders<T> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance.getModelManager<T>(typeofModel).query();
  }

  /**
   * @description Finds the first record in the database
   * @param model
   * @param {FindType} options
   * @returns {Promise<T[]>}
   */
  public static async first<T extends Model>(
    this: new () => T | typeof Model,
    options: OneOptions = { throwErrorOnNull: false },
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return await typeofModel.sqlInstance
      .getModelManager<T>(typeofModel)
      .query()
      .limit(1)
      .one(options);
  }

  /**
   * @description Finds records for the given model
   * @param model
   * @param {FindType} options
   * @returns {Promise<T[]>}
   */
  public static find<T extends Model>(
    this: new () => T | typeof Model,
    options?: FindType<T>,
  ): Promise<T[]> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance
      .getModelManager<T>(typeofModel)
      .find(options);
  }

  /**
   * @description Finds a record for the given model
   * @param model
   * @param {FindOneType} options
   * @returns {Promise<T | null>}
   */
  public static findOne<T extends Model>(
    this: new () => T | typeof Model,
    options: FindOneType<T>,
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance
      .getModelManager<T>(typeofModel)
      .findOne(options);
  }

  /**
   * @description Finds a record for the given model for the given id, "id" must be set in the model in order for it to work
   * @param model
   * @param {number | string} id
   * @returns {Promise<T | null>}
   */
  public static findOneByPrimaryKey<T extends Model>(
    this: new () => T | typeof Model,
    value: string | number | boolean,
    options: { throwErrorOnNull: boolean } = { throwErrorOnNull: false },
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance
      .getModelManager<T>(typeofModel)
      .findOneByPrimaryKey(value, options.throwErrorOnNull);
  }

  /**
   * @description Refreshes a model from the database, the model must have a primary key defined in the metadata
   * @param model
   */
  public static refresh<T extends Model>(
    this: new () => T | typeof Model,
    model: T,
    options: { throwErrorOnNull: boolean } = { throwErrorOnNull: false },
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    const primaryKey = typeofModel.metadata.primaryKey as keyof T;
    const primaryKeyValue = model[primaryKey];
    return typeofModel.sqlInstance
      .getModelManager<T>(typeofModel)
      .findOneByPrimaryKey(primaryKeyValue as string, options.throwErrorOnNull);
  }

  /**
   * @description Saves a new record to the database
   * @param model
   * @param {Model} modelData
   * @param trx
   * @returns {Promise<T | null>}
   */
  public static create<T extends Model>(
    this: new () => T | typeof Model,
    modelData: Partial<T>,
    trx?: MysqlTransaction | PostgresTransaction,
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance
      .getModelManager<T>(typeofModel)
      .create(modelData, trx);
  }

  /**
   * @description Saves multiple records to the database
   * @param model
   * @param {Model} modelsData
   * @param trx
   * @returns {Promise<T[]>}
   */
  public static massiveCreate<T extends Model>(
    this: new () => T | typeof Model,
    modelsData: Partial<T>[],
    trx?: MysqlTransaction | PostgresTransaction,
  ): Promise<T[]> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance
      .getModelManager<T>(typeofModel)
      .massiveCreate(modelsData, trx);
  }

  /**
   * @description Updates a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param trx
   * @returns
   */
  public static updateRecord<T extends Model>(
    this: new () => T | typeof Model,
    modelInstance: T,
    trx?: MysqlTransaction | PostgresTransaction,
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance
      .getModelManager<T>(typeofModel)
      .updateRecord(modelInstance, trx);
  }

  /**
   * @description Updates records to the database
   * @param model
   * @param {Model} modelInstance
   * @param trx
   * @returns Update query builder
   */
  public static update<T extends Model>(
    this: new () => T | typeof Model,
  ): UpdateQueryBuilders<T> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance.getModelManager<T>(typeofModel).update();
  }

  /**
   * @description Deletes multiple records from the database
   * @param model
   * @param {Model} modelInstance
   * @param trx
   * @returns
   */
  public static delete<T extends Model>(
    this: new () => T | typeof Model,
  ): DeleteQueryBuilders<T> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance.getModelManager<T>(typeofModel).delete();
  }

  /**
   * @description Deletes a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param trx
   * @returns
   */
  public static deleteRecord<T extends Model>(
    this: new () => T | typeof Model,
    modelInstance: T,
    trx?: MysqlTransaction | PostgresTransaction,
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance
      .getModelManager<T>(typeofModel)
      .deleteRecord(modelInstance, trx);
  }

  /**
   * @description Deletes a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param {string} column
   * @param {string | number | boolean} value
   * @param trx
   * @returns
   */
  public static deleteByColumn<T extends Model>(
    this: new () => T | typeof Model,
    column: string,
    value: string | number | boolean,
    trx?: MysqlTransaction | PostgresTransaction,
  ): Promise<number> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance
      .getModelManager<T>(typeofModel)
      .deleteByColumn(column, value, trx);
  }

  /**
   * @description Merges the provided data with the instance
   * @param instance
   * @param data
   * @returns {void}
   */
  public static setProps<T extends Model>(instance: T, data: Partial<T>): void {
    for (const key in data) {
      Object.assign(instance, { [key]: data[key] });
    }
  }

  /**
   * @description Adds a beforeFetch clause to the model, adding the ability to modify the query before fetching the data
   * @param queryBuilder
   */
  public static beforeFetch(
    queryBuilder: QueryBuilders<any>,
  ): QueryBuilders<any> {
    return queryBuilder;
  }

  /**
   * @description Adds a beforeCreate clause to the model, adding the ability to modify the data after fetching the data
   * @param data
   * @returns {T}
   */
  public static beforeCreate(data: Model): Model {
    return data;
  }

  /**
   * @description Adds a beforeUpdate clause to the model, adding the ability to modify the data before updating the data
   * @param data
   */
  public static beforeUpdate(
    queryBuilder: UpdateQueryBuilders<any>,
  ): UpdateQueryBuilders<any> {
    return queryBuilder;
  }

  /**
   * @description Adds a beforeDelete clause to the model, adding the ability to modify the data before deleting the data
   * @param data
   */
  public static beforeDelete(
    queryBuilder: DeleteQueryBuilders<any>,
  ): DeleteQueryBuilders<any> {
    return queryBuilder;
  }

  /**
   * @description Adds a afterFetch clause to the model, adding the ability to modify the data after fetching the data
   * @param data
   * @returns {T}
   */
  public static async afterFetch(data: Model[]): Promise<Model[]> {
    return data;
  }

  /**
   * @description Establishes a connection to the database instantiated from the SqlDataSource.connect method
   * @returns
   */
  private static establishConnection() {
    if (!this.sqlInstance) {
      this.sqlInstance = SqlDataSource.getInstance();
    }
  }
}
