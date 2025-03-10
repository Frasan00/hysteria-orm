import { DataSource } from "../data_source/data_source";
import { HysteriaError } from "../errors/hysteria_error";
import logger from "../utils/logger";
import { Model } from "./models/model";
import { ModelManager } from "./models/model_manager/model_manager";
import { createSqlConnection } from "./sql_connection_utils";
import type {
  ConnectionPolicies,
  GetCurrentConnectionReturnType,
  MysqlConnectionInstance,
  PgPoolClientInstance,
  SqlConnectionType,
  SqlDataSourceInput,
  SqlDataSourceType,
  SqlDriverSpecificOptions,
  SqliteConnectionInstance,
  UseConnectionInput,
} from "./sql_data_source_types";
import { execSql } from "./sql_runner/sql_runner";
import { Transaction } from "./transactions/transaction";

export class SqlDataSource extends DataSource {
  declare private sqlConnection: SqlConnectionType;
  private static instance: SqlDataSource | null = null;
  private sqlType: SqlDataSourceType;
  retryPolicy: ConnectionPolicies["retry"];

  get isConnected(): boolean {
    return !!this.sqlConnection;
  }

  private constructor(input?: SqlDataSourceInput) {
    super(input);
    this.sqlType = input?.type as SqlDataSourceType;
    this.retryPolicy = input?.connectionPolicies?.retry || {
      maxRetries: 3,
      delay: 1000,
    };
  }

  getDbType(): SqlDataSourceType {
    return this.type as SqlDataSourceType;
  }

  /**
   * @description Connects to the database establishing a connection. If no connection details are provided, the default values from the env will be taken instead
   * @description The User input connection details will always override the values from the env file
   * @description A SELECT 1 query is run to check if the connection is successful
   */
  static async connect(
    input: SqlDataSourceInput,
    cb?: (sqlDataSource: SqlDataSource) => Promise<void> | void,
  ): Promise<SqlDataSource>;
  static async connect(
    cb?: (sqlDataSource: SqlDataSource) => Promise<void> | void,
  ): Promise<SqlDataSource>;
  static async connect(
    inputOrCb?:
      | SqlDataSourceInput
      | ((sqlDataSource: SqlDataSource) => Promise<void> | void),
    cb?: (sqlDataSource: SqlDataSource) => Promise<void> | void,
  ): Promise<SqlDataSource> {
    if (typeof inputOrCb === "function") {
      cb = inputOrCb;
      inputOrCb = undefined;
    }

    const sqlDataSource = new this(inputOrCb as SqlDataSourceInput);
    sqlDataSource.sqlConnection = await createSqlConnection(
      sqlDataSource.sqlType,
      {
        type: sqlDataSource.sqlType,
        host: sqlDataSource.host,
        port: sqlDataSource.port,
        username: sqlDataSource.username,
        password: sqlDataSource.password,
        database: sqlDataSource.database,
        timezone: inputOrCb?.timezone,
      },
    );

    await sqlDataSource.rawQuery("SELECT 1");
    SqlDataSource.instance = sqlDataSource;
    await cb?.(sqlDataSource);
    return sqlDataSource;
  }

  static getInstance(): SqlDataSource {
    if (!SqlDataSource.instance) {
      throw new HysteriaError(
        "SqlDataSource::getInstance",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    return SqlDataSource.instance;
  }

  /**
   * @description Executes a callback function with the provided connection details using the main connection established with SqlDataSource.connect() method
   * @description The callback automatically commits or rollbacks the transaction based on the result of the callback
   * @description NOTE: trx must always be passed to single methods that are part of the transaction
   */
  static async useTransaction(
    cb: (trx: Transaction) => Promise<void>,
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<void> {
    return this.getInstance().useTransaction(cb, driverSpecificOptions);
  }

  /**
   * @description Executes a callback function with the provided connection details
   * @description The callback automatically commits or rollbacks the transaction based on the result of the callback
   * @description NOTE: trx must always be passed to single methods that are part of the transaction
   */
  async useTransaction(
    cb: (trx: Transaction) => Promise<void>,
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<void> {
    const trx = await this.startTransaction(driverSpecificOptions);
    try {
      await cb(trx).then(async () => {
        if (!trx.isActive) {
          return;
        }

        await trx.commit();
      });
    } catch (error) {
      if (!trx.isActive) {
        return;
      }

      await trx.rollback();
      throw error;
    }
  }

  /**
   * @description Starts a transaction on the database and returns the transaction object
   * @description This creates a new connection to the database, you can customize the connection details using the driverSpecificOptions
   */
  static async startTransaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    return this.getInstance().startTransaction(driverSpecificOptions);
  }

  /**
   * @description Alias for startTransaction {Promise<Transaction>} trx
   */
  static async beginTransaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    return this.getInstance().startTransaction(driverSpecificOptions);
  }

  /**
   * @description Alias for startTransaction {Promise<Transaction>} trx
   */
  static async transaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    return this.getInstance().startTransaction(driverSpecificOptions);
  }

  /**
   * @description Starts a transaction on the database and returns the transaction object
   * @description This creates a new connection to the database, you can customize the connection details using the driverSpecificOptions
   */
  async startTransaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    const sqlDataSource = new SqlDataSource({
      type: this.sqlType,
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      database: this.database,
      ...driverSpecificOptions,
    });

    sqlDataSource.sqlConnection = await createSqlConnection(
      sqlDataSource.sqlType,
      {
        type: sqlDataSource.sqlType,
        host: sqlDataSource.host,
        port: sqlDataSource.port,
        username: sqlDataSource.username,
        password: sqlDataSource.password,
        database: sqlDataSource.database,
        ...driverSpecificOptions,
      },
    );

    const sqlTrx = new Transaction(sqlDataSource);
    await sqlTrx.startTransaction();
    return sqlTrx;
  }

  /**
   * @description Alias for startTransaction {Promise<Transaction>} trx
   */
  async beginTransaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    return this.startTransaction(driverSpecificOptions);
  }

  /**
   * @description Alias for startTransaction {Promise<Transaction>} trx
   */
  async transaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    return this.startTransaction(driverSpecificOptions);
  }

  /**
   * @description Returns model manager for the provided model
   */
  getModelManager<T extends Model>(
    model: { new (): T } | typeof Model,
  ): ModelManager<T> {
    if (!this.isConnected) {
      throw new HysteriaError(
        "SqlDataSource::getModelManager",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    return new ModelManager(model as typeof Model, this);
  }

  /**
   * @description Executes a callback function with the provided connection details
   */
  static async useConnection(
    connectionDetails: UseConnectionInput,
    cb: (sqlDataSource: SqlDataSource) => Promise<void>,
  ) {
    const customSqlInstance = new SqlDataSource(connectionDetails);
    customSqlInstance.sqlConnection = await createSqlConnection(
      customSqlInstance.sqlType,
      {
        ...connectionDetails,
      },
    );
    await customSqlInstance.rawQuery("SELECT 1");
    try {
      await cb(customSqlInstance).then(async () => {
        if (!customSqlInstance.isConnected) {
          return;
        }

        await customSqlInstance.closeConnection();
      });
    } catch (error) {
      if (customSqlInstance.isConnected) {
        await customSqlInstance.closeConnection();
      }
      throw error;
    }
  }

  /**
   * @description Returns the current driver connection, you can pass a specific type to get the connection as that type
   */
  getCurrentDriverConnection<T extends SqlDataSourceType = typeof this.sqlType>(
    _specificType: T = this.sqlType as T,
  ): GetCurrentConnectionReturnType<T> {
    return this.sqlConnection as GetCurrentConnectionReturnType<T>;
  }

  /**
   * @description Closes the connection to the database
   */
  async closeConnection(): Promise<void> {
    if (!this.isConnected) {
      logger.warn("Connection already closed ");
      return;
    }

    logger.warn("Closing connection");
    switch (this.type) {
      case "mysql":
      case "mariadb":
        await (this.sqlConnection as MysqlConnectionInstance).end();
        SqlDataSource.instance = null;
        break;
      case "postgres":
        (this.sqlConnection as PgPoolClientInstance).end();
        SqlDataSource.instance = null;
        break;
      case "sqlite":
        await new Promise<void>((resolve, reject) => {
          (this.sqlConnection as SqliteConnectionInstance).close((err) => {
            if (err) {
              reject(err);
            }
            resolve();
          });
        });
        SqlDataSource.instance = null;
        break;
      default:
        throw new HysteriaError(
          "SqlDataSource::closeConnection",
          `UNSUPPORTED_DATABASE_TYPE_${this.type}`,
        );
    }
  }

  /**
   * @description Closes the main connection to the database established with SqlDataSource.connect() method
   */
  static async closeConnection(): Promise<void> {
    return SqlDataSource.getInstance().closeConnection();
  }

  /**
   * @description Disconnects the connection to the database
   * @alias closeConnection
   */
  async disconnect(): Promise<void> {
    return this.closeConnection();
  }

  /**
   * @description Disconnects the main connection to the database established with SqlDataSource.connect() method
   * @alias closeConnection
   */
  static async disconnect(): Promise<void> {
    return SqlDataSource.closeConnection();
  }

  /**
   * @description Executes a raw query on the database
   */
  async rawQuery<T = any>(query: string, params: any[] = []): Promise<T> {
    if (!this.isConnected) {
      throw new HysteriaError(
        "SqlDataSource::rawQuery",
        "CONNECTION_NOT_ESTABLISHED",
      );
    }

    return execSql(query, params, this);
  }

  /**
   * @description Executes a raw query on the database with the base connection created with SqlDataSource.connect() method
   */
  static async rawQuery<T = any>(
    query: string,
    params: any[] = [],
  ): Promise<T> {
    return SqlDataSource.getInstance().rawQuery(query, params);
  }
}
