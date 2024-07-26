import { camelToSnakeCase } from "../../CaseUtils";
import { DataSourceInput } from "../../Datasource";
import { MysqlTransaction } from "../Mysql/MysqlTransaction";
import { PostgresTransaction } from "../Postgres/PostgresTransaction";
import { QueryBuilders } from "../QueryBuilder/QueryBuilder";
import { SqlDataSource } from "../SqlDataSource";
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
  public aliasColumns: { [key: string]: string | number | boolean } = {};
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
  public static async useConnection<T extends Model>(
    connectionDetails: DataSourceInput,
    cb: () => Promise<void>,
  ) {
    const newSqlInstance = await SqlDataSource.tempConnect(connectionDetails);
    this.sqlInstance = newSqlInstance;
    await cb().then(() => newSqlInstance.closeConnection());
    this.sqlInstance = SqlDataSource.getInstance();
  }

  /**
   * @description Gives a query instance for the given model
   * @param model
   * @returns {QueryBuilders<T>}
   */
  public static query<T extends Model>(): QueryBuilders<T> {
    this.establishConnection();
    return this.sqlInstance.getModelManager<T>(this).query();
  }

  /**
   * @description Finds records for the given model
   * @param model
   * @param {FindType} options
   * @returns {Promise<T[]>}
   */
  public static find<T extends Model>(options?: FindType): Promise<T[]> {
    this.establishConnection();
    return this.sqlInstance.getModelManager<T>(this).find(options);
  }

  /**
   * @description Finds a record for the given model
   * @param model
   * @param {FindOneType} options
   * @returns {Promise<T | null>}
   */
  public static findOne<T extends Model>(
    options: FindOneType,
  ): Promise<T | null> {
    this.establishConnection();
    return this.sqlInstance.getModelManager<T>(this).findOne(options);
  }

  /**
   * @description Finds a record for the given model for the given id, "id" must be set in the model in order for it to work
   * @param model
   * @param {number | string} id
   * @returns {Promise<T | null>}
   */
  public static findOneById<T extends Model>(
    id: string | number,
  ): Promise<T | null> {
    this.establishConnection();
    return this.sqlInstance.getModelManager<T>(this).findOneById(id);
  }

  /**
   * @description Saves a new record to the database
   * @param model
   * @param {Model} modelInstance
   * @param {MysqlTransaction & PostgresTransaction} trx
   * @returns {Promise<T | null>}
   */
  public static create<T extends Model>(
    modelInstance: T,
    trx?: MysqlTransaction & PostgresTransaction,
  ): Promise<T | null> {
    this.establishConnection();
    return this.sqlInstance
      .getModelManager<T>(this)
      .create(modelInstance as T, trx);
  }

  // TODO: Implement massiveCreate method
  // /**
  //  * @description Saves multiple records to the database
  //  * @param model
  //  * @param {Model} modelInstance
  //  * @param {MysqlTransaction & PostgresTransaction} trx
  //  * @returns {Promise<T[]>}
  //  */
  // public static massiveCreate<T extends Model>(
  //   modelInstance: T,
  //   trx?: MysqlTransaction & PostgresTransaction,
  // ): Promise<T[]> {
  //   this.establishConnection();
  //   return this.sqlInstance
  //     .getModelManager<T>(this)
  //     .massiveCreate(modelInstance, trx);
  // }

  // /**
  //  * @description Updates a record to the database
  //  * @param model
  //  * @param {Model} modelInstance
  //  * @param {MysqlTransaction & PostgresTransaction} trx
  //  * @returns
  //  */
  // public static update<T extends Model>(
  //   modelInstance: T,
  //   trx?: MysqlTransaction & PostgresTransaction,
  // ): Promise<T | null> {
  //   this.establishConnection();
  //   return this.sqlInstance.getModelManager<T>(this).update(modelInstance, trx);
  // }

  /**
   * @description Deletes a record to the database
   * @param model
   * @param {Model} modelInstance
   * @param {MysqlTransaction & PostgresTransaction} trx
   * @returns
   */
  public static delete<T extends Model>(
    modelInstance: T,
    trx?: MysqlTransaction & PostgresTransaction,
  ): Promise<T | null> {
    this.establishConnection();
    return this.sqlInstance.getModelManager<T>(this).delete(modelInstance, trx);
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
    column: string,
    value: string | number | boolean,
    trx?: MysqlTransaction & PostgresTransaction,
  ): Promise<number> {
    this.establishConnection();
    return this.sqlInstance
      .getModelManager<T>(this)
      .deleteByColumn(column, value, trx);
  }

  public static setProps<T extends Model>(instance: T, data: Partial<T>): void {
    for (const key in data) {
      Object.assign(instance, { [key]: data[key] });
    }
  }

  public static generateModel<T extends Model>(
    this: new () => T,
    data: Partial<T>,
  ): T {
    const instance = new this() as T;
    Model.setProps(instance, data);
    return instance;
  }

  public static generateModels<T extends Model>(
    this: new () => T,
    data: Partial<T>[],
  ): T[] {
    return data.map((d) => Model.generateModel.call(this, d) as T);
  }

  private static establishConnection() {
    if (!this.sqlInstance) {
      this.sqlInstance = SqlDataSource.getInstance();
    }
  }
}
