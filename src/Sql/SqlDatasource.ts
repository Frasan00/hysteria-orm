import { DataSource, DataSourceInput, DataSourceType } from "../Datasource";
import mysql, { createConnection } from "mysql2/promise";
import pg from "pg";
import sqlite3 from "sqlite3";
import { Model } from "./Models/Model";
import { MysqlModelManager } from "./Mysql/MysqlModelManager";
import { PostgresModelManager } from "./Postgres/PostgresModelManager";
import { MysqlTransaction } from "./Mysql/MysqlTransaction";
import { PostgresTransaction } from "./Postgres/PostgresTransaction";
import logger from "../Logger";
import { SQLiteModelManager } from "./Sqlite/SQLiteModelManager";
import { SQLiteTransaction } from "./Sqlite/SQLiteTransaction";
import { TransactionType } from "./Models/ModelManager/ModelManagerTypes";

type ModelManager<T extends Model> =
  | MysqlModelManager<T>
  | PostgresModelManager<T>
  | SQLiteModelManager<T>;

export type SqlConnectionType = mysql.Connection | pg.Client | sqlite3.Database;

export interface SqlDataSourceInput extends DataSourceInput {
  type: Exclude<DataSourceType, "redis">;
}

export type SqlDataSourceType = SqlDataSourceInput["type"];

export class SqlDataSource extends DataSource {
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
      throw new Error("Sql database connection not established");
    }

    return SqlDataSource.instance;
  }

  /**
   * @description Begins a transaction on the database and returns the transaction object
   * @param model
   * @returns {Promise<TransactionType>} trx
   */
  public async startTransaction(): Promise<TransactionType> {
    switch (this.type) {
      case "mariadb":
      case "mysql":
        const sqlPool = mysql.createPool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
        });

        const trxMysql = new MysqlTransaction(sqlPool, this.logs, this.type);
        await trxMysql.start();
        return trxMysql;
      case "postgres":
        const pgPool = new pg.Pool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
        });

        const trxPg = new PostgresTransaction(pgPool, this.logs);
        await trxPg.start();
        return trxPg;
      case "sqlite":
        const sqliteTransaction = new SQLiteTransaction(
          this.sqlConnection as sqlite3.Database,
          this.logs,
        );
        await sqliteTransaction.start();
        return sqliteTransaction;
      default:
        throw new Error(
          "Error while starting transaction: invalid sql database type provided",
        );
    }
  }

  /**
   * @description Returns model manager for the provided model
   * @param model
   */
  public getModelManager<T extends Model>(
    model: { new (): T } | typeof Model,
  ): ModelManager<T> {
    if (!this.isConnected) {
      throw new Error("Sql database connection not established");
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
        return new SQLiteModelManager<T>(
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
    switch (customSqlInstance.type) {
      case "mysql":
      case "mariadb":
        customSqlInstance.sqlConnection = await createConnection({
          host: customSqlInstance.host,
          port: customSqlInstance.port,
          user: customSqlInstance.username,
          password: customSqlInstance.password,
          database: customSqlInstance.database,
        });
        break;

      case "postgres":
        customSqlInstance.sqlConnection = new pg.Client({
          host: customSqlInstance.host,
          port: customSqlInstance.port,
          user: customSqlInstance.username,
          password: customSqlInstance.password,
          database: customSqlInstance.database,
        });
        await customSqlInstance.sqlConnection.connect();
        break;

      case "sqlite":
        customSqlInstance.sqlConnection = new sqlite3.Database(
          customSqlInstance.database,
          sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
          (err) => {
            if (err) {
              throw new Error(`Error while connecting to sqlite: ${err}`);
            }
          },
        );
        break;
      default:
        throw new Error(
          `Unsupported datasource type: ${customSqlInstance.type}`,
        );
    }

    customSqlInstance.isConnected = true;
    try {
      await cb(customSqlInstance).then(
        async () => await customSqlInstance.closeConnection(),
      );
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
  public async getRawConnection(): Promise<SqlConnectionType> {
    switch (this.type) {
      case "mysql":
      case "mariadb":
        return createConnection({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
        });
      case "postgres":
        const client = new pg.Client({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
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
}
