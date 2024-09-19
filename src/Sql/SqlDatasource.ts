import { DataSource, DataSourceInput, DataSourceType } from "../Datasource";
import mysql, { createPool } from "mysql2/promise";
import pg from "pg";
import { Model } from "./Models/Model";
import { MysqlModelManager } from "./Mysql/MysqlModelManager";
import { PostgresModelManager } from "./Postgres/PostgresModelManager";
import { MysqlTransaction } from "./Mysql/MysqlTransaction";
import { PostgresTransaction } from "./Postgres/PostgresTransaction";
import logger from "../Logger";

type ModelManager<T extends Model> =
  | MysqlModelManager<T>
  | PostgresModelManager<T>;

export type SqlPoolType = mysql.Pool | pg.Pool;
export type SqlPoolConnectionType = mysql.PoolConnection | pg.PoolClient;

export class SqlDataSource extends DataSource {
  public isConnected: boolean;
  protected sqlPool!: SqlPoolType;
  private static instance: SqlDataSource | null = null;

  private constructor(input?: DataSourceInput) {
    super(input);
    this.isConnected = false;
  }

  public getDbType(): DataSourceType {
    return this.type;
  }

  /**
   * @description Connects to the database establishing a connection pool. If no connection details are provided, the default values from the env will be taken instead
   * @description The User input connection details will always come first
   */
  public static async connect(
    input?: DataSourceInput,
    cb?: () => Promise<void> | void,
  ): Promise<SqlDataSource> {
    const sqlDataSource = new this(input);
    switch (sqlDataSource.type) {
      case "mysql":
      case "mariadb":
        sqlDataSource.sqlPool = createPool({
          host: sqlDataSource.host,
          port: sqlDataSource.port,
          user: sqlDataSource.username,
          password: sqlDataSource.password,
          database: sqlDataSource.database,
          ...input?.mysqlOptions,
        }) as mysql.Pool;
        break;

      case "postgres":
        sqlDataSource.sqlPool = new pg.Pool({
          host: sqlDataSource.host,
          port: sqlDataSource.port,
          user: sqlDataSource.username,
          password: sqlDataSource.password,
          database: sqlDataSource.database,
          ...input?.pgOptions,
        }) as pg.Pool;
        break;
      default:
        throw new Error(`Unsupported datasource type: ${sqlDataSource.type}`);
    }

    switch (sqlDataSource.type) {
      case "mysql":
      case "mariadb":
        await (sqlDataSource.sqlPool as mysql.Pool).getConnection();
        break;
      case "postgres":
        await (sqlDataSource.sqlPool as pg.Pool).connect();
        break;
      default:
        throw new Error(`Unsupported datasource type: ${sqlDataSource.type}`);
    }

    sqlDataSource.isConnected = true;
    SqlDataSource.instance = sqlDataSource;
    cb?.();
    return sqlDataSource;
  }

  public static getInstance(): SqlDataSource | null {
    if (!this.instance) {
      throw new Error("Sql database connection not established");
    }

    return SqlDataSource.instance;
  }

  /**
   * @description Begins a transaction on the database and returns the transaction object
   * @param model
   * @returns {Promise<MysqlTransaction | PostgresTransaction>} trx
   */
  public async startTransaction(): Promise<
    MysqlTransaction | PostgresTransaction
  > {
    switch (this.type) {
      case "mariadb":
      case "mysql":
        const trxMysql = new MysqlTransaction(
          this.sqlPool as mysql.Pool,
          this.logs,
        );
        await trxMysql.start();
        return trxMysql;
      case "postgres":
        const trxPg = new PostgresTransaction(
          this.sqlPool as pg.Pool,
          this.logs,
        );
        await trxPg.start();
        return trxPg;
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
          this.sqlPool as mysql.Pool,
          this.logs,
          this,
        );
      case "postgres":
        return new PostgresModelManager<T>(
          model as typeof Model,
          this.sqlPool as pg.Pool,
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
  public static async useConnection(
    connectionDetails: DataSourceInput,
    cb: (sqlDataSource: SqlDataSource) => Promise<void>,
  ) {
    const customSqlInstance = new SqlDataSource(connectionDetails);
    switch (customSqlInstance.type) {
      case "mysql":
      case "mariadb":
        customSqlInstance.sqlPool = createPool({
          host: customSqlInstance.host,
          port: customSqlInstance.port,
          user: customSqlInstance.username,
          password: customSqlInstance.password,
          database: customSqlInstance.database,
        }) as mysql.Pool;
        break;

      case "postgres":
        customSqlInstance.sqlPool = new pg.Pool({
          host: customSqlInstance.host,
          port: customSqlInstance.port,
          user: customSqlInstance.username,
          password: customSqlInstance.password,
          database: customSqlInstance.database,
        }) as pg.Pool;
        break;
      default:
        throw new Error(
          `Unsupported datasource type: ${customSqlInstance.type}`,
        );
    }

    try {
      switch (customSqlInstance.type) {
        case "mysql":
        case "mariadb":
          await (customSqlInstance.sqlPool as mysql.Pool).getConnection();
          break;
        case "postgres":
          await (customSqlInstance.sqlPool as pg.Pool).connect();
          break;
        default:
          throw new Error(
            `Unsupported datasource type: ${customSqlInstance.type}`,
          );
      }
    } catch (error) {
      throw error;
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
   * @description Returns separate raw sql pool
   */
  public async getRawPool(): Promise<SqlPoolType> {
    switch (this.type) {
      case "mysql":
      case "mariadb":
        return createPool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
        });
      case "postgres":
        return new pg.Pool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
        });
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
        (this.sqlPool as mysql.Pool).end().catch((error) => {
          logger.error(`Error while closing sql connection ${String(error)}`);
        });
        SqlDataSource.instance = null;
        break;
      case "postgres":
        (this.sqlPool as pg.Pool).end().catch((error) => {
          logger.error(`Error while closing sql connection ${String(error)}`);
        });
        SqlDataSource.instance = null;
        break;
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }

  /**
   * @description Returns a separate raw sql PoolConnection
   */
  public async getRawPoolConnection(): Promise<SqlPoolConnectionType> {
    switch (this.type) {
      case "mysql":
      case "mariadb":
        return createPool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
        }).getConnection();
      case "postgres":
        return new pg.Pool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
        }).connect();
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }
}
