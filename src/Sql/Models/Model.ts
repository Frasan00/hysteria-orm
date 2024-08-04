import { camelToSnakeCase } from "../../CaseUtils";
import { DataSourceInput } from "../../Datasource";
import { MysqlDeleteQueryBuilder } from "../Mysql/MysqlDeleteQueryBuilder";
import { MysqlTransaction } from "../Mysql/MysqlTransaction";
import { MysqlUpdateQueryBuilder } from "../Mysql/MysqlUpdateQueryBuilder";
import { PostgresDeleteQueryBuilder } from "../Postgres/PostgresDeleteQueryBuilder";
import { PostgresTransaction } from "../Postgres/PostgresTransaction";
import { PostgresUpdateQueryBuilder } from "../Postgres/PostgresUpdateQueryBuilder";
import { QueryBuilders } from "../QueryBuilder/QueryBuilder";
import { SqlDataSource } from "../SqlDatasource";
import { FindOneType, FindType } from "./ModelManager/ModelManagerTypes";

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
   * @description Connects to the database with the given connection details, then after the callback is executed, it disconnects from the database and connects back to the original database specified in the SqlDataSource.connect
   * @param connectionDetails - connection details for the database for the temp connection
   * @param cb - function containing all the database operations on the provided connection details
   * @returns {Promise<void>}
   */
  public static async useConnection(
    connectionDetails: DataSourceInput,
    cb: (sqlDataSource: SqlDataSource) => Promise<void>,
  ) {
    const newSqlInstance = await SqlDataSource.tempConnect(connectionDetails);
    this.sqlInstance = newSqlInstance;
    await cb(this.sqlInstance).then(() => newSqlInstance.closeConnection());
    try {
      this.sqlInstance = SqlDataSource.getInstance();
    } catch (error) {
      throw new Error("No SqlDataSource instance found, are you sure you are connected to the database with SqlDataSource.connect()?\n" + String(error));
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
  public static findOneById<T extends Model>(
    this: new () => T | typeof Model,
    id: string | number,
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Model;
    typeofModel.establishConnection();
    return typeofModel.sqlInstance
      .getModelManager<T>(typeofModel)
      .findOneById(id);
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
    return typeofModel.sqlInstance
      .getModelManager<T>(typeofModel)
      .create(modelData as T, trx);
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
      .massiveCreate(modelsData as T[], trx);
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
  ): MysqlUpdateQueryBuilder<T> | PostgresUpdateQueryBuilder<T> {
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
  ): MysqlDeleteQueryBuilder<T> | PostgresDeleteQueryBuilder<T> {
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
   * @description Generates a model instance with the provided data
   * @param this
   * @param data
   * @returns
   */
  public static generateModel<T extends Model>(
    this: new () => T,
    data: Partial<T>,
  ): T {
    const instance = new this() as T;
    Model.setProps(instance, data);
    return instance;
  }

  /**
   * @description Generates model instances with the provided data
   * @param this
   * @param data
   * @returns
   */
  public static generateModels<T extends Model>(
    this: new () => T,
    data: Partial<T>[],
  ): T[] {
    return data.map((d) => Model.generateModel.call(this, d) as T);
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
