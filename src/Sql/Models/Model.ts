import "reflect-metadata";
import { DateTime } from "luxon";
import { MysqlTransaction } from "../Mysql/MysqlTransaction";
import { PostgresTransaction } from "../Postgres/PostgresTransaction";
import {
  OneOptions,
  AbstractQueryBuilders,
} from "../QueryBuilder/QueryBuilder";
import { SqlDataSource } from "../SqlDatasource";
import {
  FindOneType,
  FindType,
  SelectableType,
} from "./ModelManager/ModelManagerTypes";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import { CaseConvention, convertCase } from "../../CaseUtils";
import { AbstractUpdateQueryBuilder } from "../QueryBuilder/UpdateQueryBuilder";
import { AbstractDeleteQueryBuilder } from "../QueryBuilder/DeleteQueryBuilder";
import { getPrimaryKey } from "./ModelDecorators";

export function getBasetable(target: typeof Model): string {
  const className = target.name;
  const table = className.endsWith("s")
    ? convertCase(className, "snake")
    : convertCase(className, "snake") + "s";
  return table;
}

export function getBaseModelInstance<T extends Model>(): T {
  return { extraColumns: {} } as T;
}

const tableMap = new WeakMap<typeof Model, string>();
const primaryKeyMap = new WeakMap<typeof Model, string>();

/**
 * @description Represents a Table in the Database
 */
export abstract class Model {
  /**
   * @description The sql instance generated by SqlDataSource.connect
   */
  public static sqlInstance: SqlDataSource;

  /**
   * @description Table name for the model, if not set it will be the plural snake case of the model name given that is in PascalCase (es. User -> users)
   */
  static tableName: string;

  /**
   * @description Static getter for table;
   * @internal
   */
  public static get table(): string {
    if (!tableMap.has(this)) {
      tableMap.set(this, this.tableName || getBasetable(this));
    }

    return tableMap.get(this)!;
  }

  /**
   * @description Getter for the primary key of the model
   */
  public static get primaryKey(): string | undefined {
    if (!primaryKeyMap.has(this)) {
      primaryKeyMap.set(this, getPrimaryKey(this));
    }

    return primaryKeyMap.get(this)!;
  }

  /**
   * @description Defines the case convention for the model
   * @type {CaseConvention}
   */
  public static modelCaseConvention: CaseConvention = "camel";

  /**
   * @description Defines the case convention for the database, this should be the case convention you use in your database
   * @type {CaseConvention}
   */
  public static databaseCaseConvention: CaseConvention = "snake";

  /**
   * @description Extra columns for the model, all data retrieved from the database that is not part of the model will be stored here
   */
  public extraColumns: { [key: string]: any } = {};

  /**
   * @description Constructor for the model, it's not meant to be used directly, it just initializes the extraColumns, it's advised to only use the static methods to interact with the Model instances
   */
  public constructor() {
    this.extraColumns = {};
  }

  /**
   * @description Gives a query instance for the given model
   * @param model
   * @returns {AbstractQueryBuilders<T>}
   */
  public static query<T extends Model>(
    this: new () => T | typeof Model,
  ): AbstractQueryBuilders<T> {
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
   * @description Refreshes a model from the database, the model must have a primary key defined
   * @param model
   */
  public static refresh<T extends Model>(
    this: new () => T | typeof Model,
    model: T,
    options: { throwErrorOnNull: boolean } = { throwErrorOnNull: false },
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    const primaryKey = typeofModel.primaryKey as keyof T;
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
  ): AbstractUpdateQueryBuilder<T> {
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
  ): AbstractDeleteQueryBuilder<T> {
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
   * @description Soft Deletes a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param options - The options to soft delete the record, column and value - Default is 'deletedAt' for column and the current date and time for value, string is always counted as a Date stringified as new Date().toString()
   * @param trx
   * @returns
   */
  public static async softDelete<T extends Model>(
    this: new () => T | typeof Model,
    modelInstance: T,
    options?: {
      column?: string;
      value?: string | number | boolean;
      trx?: MysqlTransaction | PostgresTransaction;
    },
  ): Promise<T> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    const {
      column = "deletedAt" as SelectableType<T>,
      value = DateTime.local().toString(),
      trx,
    } = options || {};

    modelInstance[column as keyof T] = value as T[keyof T];
    await typeofModel.sqlInstance
      .getModelManager<T>(typeofModel)
      .updateRecord(modelInstance, trx);

    if (typeof value === "string") {
      modelInstance[column as keyof T] = new Date(value) as T[keyof T];
    }

    modelInstance[column as keyof T] = value as T[keyof T];
    return modelInstance;
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
    queryBuilder: AbstractQueryBuilders<any>,
  ): AbstractQueryBuilders<any> {
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
    queryBuilder: AbstractUpdateQueryBuilder<any>,
  ): AbstractUpdateQueryBuilder<any> {
    return queryBuilder;
  }

  /**
   * @description Adds a beforeDelete clause to the model, adding the ability to modify the data before deleting the data
   * @param data
   */
  public static beforeDelete(
    queryBuilder: AbstractDeleteQueryBuilder<any>,
  ): AbstractDeleteQueryBuilder<any> {
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
   * @description Establishes a connection to the database instantiated from the SqlDataSource.connect method, this is done automatically when using the static methods
   * @description This method is meant to be used only if you want to establish sql instance of the model directly
   * @internal
   * @returns {void}
   */
  public static establishConnection(): void {
    const sql = SqlDataSource.getInstance();
    if (!sql) {
      throw new Error(
        "Sql instance not initialized, did you defined it in SqlDataSource.connect static method?",
      );
    }

    this.sqlInstance = sql;
  }
}
