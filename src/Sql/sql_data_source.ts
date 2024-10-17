import { Datasource, DataSourceInput, DataSourceType } from "../datasource";
import mysql, { createConnection } from "mysql2/promise";
import pg from "pg";
import sqlite3 from "sqlite3";
import { Model } from "./models/model";
import { Mysql_model_manager } from "./mysql/mysql_model_manager";
import { Postgres_model_manager } from "./postgres/postgres_model_manager";
import logger, { log } from "../logger";
import { Sql_lite_model_manager } from "./sqlite/sql_lite_model_manager";
import { Transaction } from "./transaction";

type DriverSpecificOptions = {
  mysqlOptions?: mysql.PoolOptions;
  pgOptions?: pg.PoolConfig;
};

export type ModelManager<T extends Model> =
  | Mysql_model_manager<T>
  | Postgres_model_manager<T>
  | Sql_lite_model_manager<T>;

export type SqlConnectionType = mysql.Connection | pg.Client | sqlite3.Database;

export interface SqlDataSourceInput extends DataSourceInput {
  type: Exclude<DataSourceType, "redis">;
}

export type SqlDataSourceType = SqlDataSourceInput["type"];

export class SqlDataSource extends Datasource {
  public isConnected: boolean;
  protected sqlConnection!: SqlConnectionType;
  private static instance: SqlDataSource | null = null;

  private constructor(input?: SqlDataSourceInput) {
    super(input);
    this.isConnected = false;
  }

  public getDbType(): SqlDataSourceType {
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
        throw new Error(`Unsupported datasource type: ${sqlDataSource.type}`);
    }

    sqlDataSource.isConnected = true;
    SqlDataSource.instance = sqlDataSource;
    cb?.();
    return sqlDataSource;
  }

  static getInstance(): SqlDataSource | null {
    if (!this.instance) {
      throw new Error("sql database connection not established");
    }

    return SqlDataSource.instance;
  }

  /**
   * @description Starts a transaction on the database and returns the transaction object
   * @param model
   * @returns {Promise<Transaction>} trx
   */
  public async startTransaction(
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
   * @description Alias for startTransaction
   * @returns {Promise<Transaction>} trx
   */
  public async beginTransaction(
    driverSpecificOptions?: DriverSpecificOptions,
  ): Promise<Transaction> {
    return this.startTransaction(driverSpecificOptions);
  }

  /**
   * @description Alias for startTransaction
   * @returns {Promise<Transaction>} trx
   */
  public async transaction(
    driverSpecificOptions?: DriverSpecificOptions,
  ): Promise<Transaction> {
    return this.startTransaction(driverSpecificOptions);
  }

  /**
   * @description Returns model manager for the provided model
   * @param model
   */
  public getModelManager<T extends Model>(
    model: { new (): T } | typeof Model,
  ): ModelManager<T> {
    if (!this.isConnected) {
      throw new Error("sql database connection not established");
    }

    switch (this.type) {
      case "mysql":
      case "mariadb":
        return new Mysql_model_manager<T>(
          model as typeof Model,
          this.sqlConnection as mysql.Connection,
          this.logs,
          this,
        );
      case "postgres":
        return new Postgres_model_manager<T>(
          model as typeof Model,
          this.sqlConnection as pg.Client,
          this.logs,
          this,
        );
      case "sqlite":
        return new Sql_lite_model_manager<T>(
          model as typeof Model,
          this.sqlConnection as sqlite3.Database,
          this.logs,
          this,
        );
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }

  /**
   * @description Executes a callback function with the provided connection details
   * @description Static Model methods will always use the base connection created with SqlDataSource.connect() method
   * @param connectionDetails
   * @param cb
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
   * @description Returns the current connection
   * @returns {Promise<SqlConnectionType>} sqlConnection
   */
  public getCurrentConnection(): SqlConnectionType {
    return this.sqlConnection;
  }

  /**
   * @description Returns separate raw sql connection
   */
  public async getRawConnection(
    driverSpecificOptions?: DriverSpecificOptions,
  ): Promise<SqlConnectionType> {
    switch (this.type) {
      case "mysql":
      case "mariadb":
        return await createConnection({
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
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }

  /**
   * @description Closes the connection to the database
   * @returns
   */
  public async closeConnection(): Promise<void> {
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
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }

  /**
   * @description Executes a raw query on the database
   * @param query
   * @param params
   * @returns
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
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }

  /**
   * @description Executes a raw query on the database with the base connection created with SqlDataSource.connect() method
   * @param query
   * @param params
   * @returns
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
        throw new Error(`Unsupported datasource type: ${sqlDataSource.type}`);
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
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }
}
