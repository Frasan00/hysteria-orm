import { DataSourceInput, DataSourceType, DataSource } from "../data_source";
import logger, { log } from "../utils/logger";
import { Model } from "./models/model";
import { MysqlModelManager } from "./mysql/mysql_model_manager";
import { PostgresModelManager } from "./postgres/postgres_model_manager";
import { SqliteModelManager } from "./sqlite/sql_lite_model_manager";
import { Transaction } from "./transactions/transaction";
import pg from "pg";
import mysql from "mysql2/promise";
import sqlite3 from "sqlite3";

type DriverSpecificOptions = {
  mysqlOptions?: mysql.PoolOptions;
  pgOptions?: pg.PoolConfig;
};

export type ModelManager<T extends Model> =
  | MysqlModelManager<T>
  | PostgresModelManager<T>
  | SqliteModelManager<T>;

export type SqlConnectionType = mysql.Connection | pg.Client | sqlite3.Database;

export interface ISqlDataSourceInput extends DataSourceInput {
  type: Exclude<DataSourceType, "mongo">;
}

export type SqlDataSourceInput = Exclude<ISqlDataSourceInput, "mongoOptions">;

export type SqlDataSourceType = SqlDataSourceInput["type"];

export class SqlDataSource extends DataSource {
  isConnected: boolean;
  protected sqlConnection!: SqlConnectionType;
  private static instance: SqlDataSource | null = null;

  private constructor(input?: SqlDataSourceInput) {
    super(input);
    this.isConnected = false;
  }

  getDbType(): SqlDataSourceType {
    return this.type as SqlDataSourceType;
  }

  /**
   * @description Connects to the database establishing a connection. If no connection details are provided, the default values from the env will be taken instead
   * @description The User input connection details will always come first
   */
  static async connect(
    input?: SqlDataSourceInput,
    cb?: () => Promise<void> | void,
  ): Promise<SqlDataSource> {
    const sqlDataSource = new this(input);
    switch (sqlDataSource.type) {
      case "mysql":
      case "mariadb":
        sqlDataSource.sqlConnection = await mysql.createConnection({
          host: sqlDataSource.host,
          port: sqlDataSource.port,
          user: sqlDataSource.username,
          password: sqlDataSource.password,
          database: sqlDataSource.database,
          ...input?.mysqlOptions,
        });
        break;

      case "postgres":
        sqlDataSource.sqlConnection = new pg.Client({
          host: sqlDataSource.host,
          port: sqlDataSource.port,
          user: sqlDataSource.username,
          password: sqlDataSource.password,
          database: sqlDataSource.database,
          ...input?.pgOptions,
        });
        await (sqlDataSource.sqlConnection as pg.Client).connect();
        break;

      case "sqlite":
        sqlDataSource.sqlConnection = new sqlite3.Database(
          sqlDataSource.database,
          sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
          (err) => {
            if (err) {
              throw new Error(`Error while connecting to sqlite: ${err}`);
            }
          },
        );
        break;

      default:
        throw new Error(`Unsupported data source type: ${sqlDataSource.type}`);
    }

    sqlDataSource.isConnected = true;
    SqlDataSource.instance = sqlDataSource;
    cb?.();
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
    driverSpecificOptions?: DriverSpecificOptions,
  ): Promise<void> {
    const trx = await this.getInstance().startTransaction(
      driverSpecificOptions,
    );
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
   * @description Executes a callback function with the provided connection details
   * @description The callback automatically commits or rollbacks the transaction based on the result of the callback
   * @description NOTE: trx must always be passed to single methods that are part of the transaction
   */
  async useTransaction(
    cb: (trx: Transaction) => Promise<void>,
    driverSpecificOptions?: DriverSpecificOptions,
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
  async startTransaction(
    driverSpecificOptions?: DriverSpecificOptions,
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

    await sqlDataSource.connectDriver();
    sqlDataSource.isConnected = true;
    const mysqlTrx = new Transaction(sqlDataSource, this.logs);
    await mysqlTrx.startTransaction();
    return mysqlTrx;
  }

  /**
   * @description Alias for startTransaction {Promise<Transaction>} trx
   */
  async beginTransaction(
    driverSpecificOptions?: DriverSpecificOptions,
  ): Promise<Transaction> {
    return this.startTransaction(driverSpecificOptions);
  }

  /**
   * @description Alias for startTransaction {Promise<Transaction>} trx
   */
  async transaction(
    driverSpecificOptions?: DriverSpecificOptions,
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
          model as typeof Model,
          this.sqlConnection as mysql.Connection,
          this.logs,
          this,
        );
      case "postgres":
        return new PostgresModelManager<T>(
          model as typeof Model,
          this.sqlConnection as pg.Client,
          this.logs,
          this,
        );
      case "sqlite":
        return new SqliteModelManager<T>(
          model as typeof Model,
          this.sqlConnection as sqlite3.Database,
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
    connectionDetails: SqlDataSourceInput,
    cb: (sqlDataSource: SqlDataSource) => Promise<void>,
  ) {
    const customSqlInstance = new SqlDataSource(connectionDetails);
    await customSqlInstance.connectDriver({
      mysqlOptions: connectionDetails.mysqlOptions,
      pgOptions: connectionDetails.pgOptions,
    });
    customSqlInstance.isConnected = true;
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
   * @description Returns the current connection {Promise<SqlConnectionType>} sqlConnection
   */
  getCurrentConnection(): SqlConnectionType {
    return this.sqlConnection;
  }

  /**
   * @description Returns separate raw sql connection
   */
  async getRawConnection(
    driverSpecificOptions?: DriverSpecificOptions,
  ): Promise<SqlConnectionType> {
    switch (this.type) {
      case "mysql":
      case "mariadb":
        return await mysql.createConnection({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.mysqlOptions,
        });
      case "postgres":
        const client = new pg.Client({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.pgOptions,
        });
        await client.connect();
        return client;

      case "sqlite":
        return new sqlite3.Database(
          this.database,
          sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
          (err) => {
            if (err) {
              throw new Error(`Error while connecting to sqlite: ${err}`);
            }
          },
        );
      default:
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
  }

  /**
   * @description Closes the connection to the database
   */
  async closeConnection(): Promise<void> {
    if (!this.isConnected) {
      logger.warn("Connection already closed", this);
      return;
    }

    logger.warn("Closing connection", this);
    switch (this.type) {
      case "mysql":
      case "mariadb":
        await (this.sqlConnection as mysql.Connection).end();
        this.isConnected = false;
        SqlDataSource.instance = null;
        break;
      case "postgres":
        await (this.sqlConnection as pg.Client).end();
        this.isConnected = false;
        SqlDataSource.instance = null;
        break;
      case "sqlite":
        await new Promise<void>((resolve, reject) => {
          (this.sqlConnection as sqlite3.Database).close((err) => {
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
    const sqlDataSource = SqlDataSource.getInstance();
    if (!sqlDataSource.isConnected) {
      logger.warn("Connection already closed", sqlDataSource);
      return;
    }

    logger.warn("Closing connection", sqlDataSource);
    switch (sqlDataSource.type) {
      case "mysql":
      case "mariadb":
        await (sqlDataSource.sqlConnection as mysql.Connection).end();
        sqlDataSource.isConnected = false;
        SqlDataSource.instance = null;
        break;
      case "postgres":
        await (sqlDataSource.sqlConnection as pg.Client).end();
        sqlDataSource.isConnected = false;
        SqlDataSource.instance = null;
        break;
      case "sqlite":
        await new Promise<void>((resolve, reject) => {
          (sqlDataSource.sqlConnection as sqlite3.Database).close((err) => {
            if (err) {
              reject(err);
            }
            resolve();
          });
        });
        sqlDataSource.isConnected = false;
        SqlDataSource.instance = null;
        break;
      default:
        throw new Error(`Unsupported data source type: ${sqlDataSource.type}`);
    }
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
   * @alias closeMainConnection
   */
  static async disconnect(): Promise<void> {
    return SqlDataSource.closeConnection();
  }

  /**
   * @description Executes a raw query on the database
   */
  async rawQuery(query: string, params: any[] = []): Promise<any> {
    if (!this.isConnected) {
      throw new Error("sql database connection not established");
    }

    log(query, this.logs, params);
    switch (this.type) {
      case "mysql":
      case "mariadb":
        const [mysqlRows] = await (
          this.sqlConnection as mysql.Connection
        ).execute(query, params);

        return mysqlRows;
      case "postgres":
        const { rows } = await (this.sqlConnection as pg.Client).query(
          query,
          params as any[],
        );

        return rows;
      case "sqlite":
        return new Promise((resolve, reject) => {
          (this.sqlConnection as sqlite3.Database).all(
            query,
            params,
            (err, rows) => {
              if (err) {
                reject(err);
              }

              resolve(rows);
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
  static async rawQuery(query: string, params: any[] = []): Promise<any> {
    const sqlDataSource = SqlDataSource.getInstance();
    if (!sqlDataSource || !sqlDataSource.isConnected) {
      throw new Error("sql database connection not established");
    }

    log(query, SqlDataSource.getInstance()?.logs ?? false, params);
    switch (sqlDataSource.type) {
      case "mysql":
      case "mariadb":
        const [mysqlRows] = await (
          sqlDataSource.sqlConnection as mysql.Connection
        ).execute(query, params);

        return mysqlRows;
      case "postgres":
        const { rows } = await (sqlDataSource.sqlConnection as pg.Client).query(
          query,
          params,
        );

        return rows;
      case "sqlite":
        return new Promise((resolve, reject) => {
          (sqlDataSource.sqlConnection as sqlite3.Database).all(
            query,
            params,
            (err, rows) => {
              if (err) {
                reject(err);
              }

              resolve(rows);
            },
          );
        });
      default:
        throw new Error(`Unsupported data source type: ${sqlDataSource.type}`);
    }
  }

  private async connectDriver(
    driverSpecificOptions?: DriverSpecificOptions,
  ): Promise<void> {
    switch (this.type) {
      case "mysql":
      case "mariadb":
        this.sqlConnection = await mysql.createConnection({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.mysqlOptions,
        });
        break;
      case "postgres":
        this.sqlConnection = new pg.Client({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
          ...driverSpecificOptions?.pgOptions,
        });
        await (this.sqlConnection as pg.Client).connect();
        break;
      case "sqlite":
        this.sqlConnection = new sqlite3.Database(
          this.database,
          sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
          (err) => {
            if (err) {
              throw new Error(`Error while connecting to sqlite: ${err}`);
            }
          },
        );
        break;
      default:
        throw new Error(`Unsupported data source type: ${this.type}`);
    }
  }
}
