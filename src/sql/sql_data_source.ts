import { DataSource } from "../data_source/data_source";
import logger, { log } from "../utils/logger";
import { Model } from "./models/model";
import { MysqlModelManager } from "./mysql/mysql_model_manager";
import { PostgresModelManager } from "./postgres/postgres_model_manager";
import { createSqlConnection } from "./sql_connection_utils";
import {
  ConnectionPolicies,
  GetCurrentConnectionReturnType,
  ModelManager,
  MysqlConnectionInstance,
  PgPoolClientInstance,
  SqlConnectionType,
  SqlDataSourceInput,
  SqlDataSourceType,
  SqlDriverSpecificOptions,
  SqliteConnectionInstance,
  UseConnectionInput,
} from "./sql_data_source_types";
import { SqliteModelManager } from "./sqlite/sql_lite_model_manager";
import { Transaction } from "./transactions/transaction";

export class SqlDataSource extends DataSource {
  declare private sqlConnection: SqlConnectionType;
  private static instance: SqlDataSource | null = null;
  private sqlType: SqlDataSourceType;
  retryPolicy: ConnectionPolicies["retry"];
  isConnected: boolean;

  private constructor(input?: SqlDataSourceInput) {
    super(input);
    this.isConnected = false;
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
    input?: SqlDataSourceInput,
    cb?: () => Promise<void> | void,
  ): Promise<SqlDataSource>;
  static async connect(cb?: () => Promise<void> | void): Promise<SqlDataSource>;
  static async connect(
    input?: SqlDataSourceInput | (() => Promise<void> | void),
    cb?: () => Promise<void> | void,
  ): Promise<SqlDataSource> {
    if (typeof input === "function") {
      cb = input;
      input = undefined;
    }

    const sqlDataSource = new this(input);
    sqlDataSource.sqlConnection = await createSqlConnection(
      sqlDataSource.sqlType,
      {
        type: sqlDataSource.sqlType,
        host: sqlDataSource.host,
        port: sqlDataSource.port,
        username: sqlDataSource.username,
        password: sqlDataSource.password,
        database: sqlDataSource.database,
        timezone: input?.timezone,
      },
    );

    SqlDataSource.instance = sqlDataSource;
    sqlDataSource.isConnected = true;
    sqlDataSource.addRetryConnectionListener(input?.connectionPolicies?.retry);
    await cb?.();
    return sqlDataSource;
  }

  static getInstance(): SqlDataSource {
    if (!SqlDataSource.instance) {
      throw new Error("sql database connection not established");
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
  static startTransaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    return this.getInstance().startTransaction(driverSpecificOptions);
  }

  /**
   * @description Alias for startTransaction {Promise<Transaction>} trx
   */
  static beginTransaction(
    driverSpecificOptions?: SqlDriverSpecificOptions,
  ): Promise<Transaction> {
    return this.getInstance().startTransaction(driverSpecificOptions);
  }

  /**
   * @description Alias for startTransaction {Promise<Transaction>} trx
   */
  static transaction(
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
      type: this.type as SqlDataSourceType,
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      database: this.database,
      logs: this.logs,
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
    sqlDataSource.isConnected = true;
    const mysqlTrx = new Transaction(sqlDataSource, this.logs);
    await mysqlTrx.startTransaction();
    return mysqlTrx;
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
      throw new Error("sql database connection not established");
    }

    switch (this.type) {
      case "mysql":
      case "mariadb":
        return new MysqlModelManager<T>(
          this.type,
          model as typeof Model,
          this.sqlConnection as MysqlConnectionInstance,
          this.logs,
          this,
        );
      case "postgres":
        return new PostgresModelManager<T>(
          model as typeof Model,
          this.sqlConnection as PgPoolClientInstance,
          this.logs,
          this,
        );
      case "sqlite":
        return new SqliteModelManager<T>(
          model as typeof Model,
          this.sqlConnection as SqliteConnectionInstance,
          this.logs,
          this,
        );
      default:
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
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
    customSqlInstance.isConnected = true;
    customSqlInstance.addRetryConnectionListener(
      connectionDetails.connectionPolicies?.retry,
    );

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
        this.isConnected = false;
        SqlDataSource.instance = null;
        break;
      case "postgres":
        (this.sqlConnection as PgPoolClientInstance).end();
        this.isConnected = false;
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
        this.isConnected = false;
        SqlDataSource.instance = null;
        break;
      default:
        throw new Error(`Unsupported data source type: ${this.type}`);
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
      throw new Error("sql database connection not established");
    }

    log(query, this.logs, params);
    switch (this.type) {
      case "mysql":
      case "mariadb":
        const [mysqlRows] = await (
          this.sqlConnection as MysqlConnectionInstance
        ).execute(query, params);

        return mysqlRows as T;
      case "postgres":
        const { rows } = await (
          this.sqlConnection as PgPoolClientInstance
        ).query(query, params as any[]);

        return rows as T;
      case "sqlite":
        return new Promise((resolve, reject) => {
          (this.sqlConnection as SqliteConnectionInstance).all(
            query,
            params,
            (err, rows) => {
              if (err) {
                reject(err);
              }

              resolve(rows as T);
            },
          );
        });
      default:
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
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

  private addRetryConnectionListener(
    retryConfig: ConnectionPolicies["retry"],
  ): void {
    const maxRetries = retryConfig?.maxRetries ?? 3;
    const delay = retryConfig?.delay ?? 1000;

    this.getCurrentDriverConnection().addListener("error", async (err) => {
      console.log(err);
    });
  }
}
