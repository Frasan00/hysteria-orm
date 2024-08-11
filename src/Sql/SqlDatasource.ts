import { DataSource, DataSourceInput, DataSourceType } from "../Datasource";
import mysql, { createPool, Pool } from "mysql2/promise";
import pg from "pg";
import { Model } from "./Models/Model";
import { MysqlModelManager } from "./Mysql/MysqlModelManager";
import { PostgresModelManager } from "./Postgres/PostgresModelManager";
import { MysqlTransaction } from "./Mysql/MysqlTransaction";
import { PostgresTransaction } from "./Postgres/PostgresTransaction";

type ModelManager<T extends Model> =
  | MysqlModelManager<T>
  | PostgresModelManager<T>;

export type SqlPoolType = mysql.Pool | pg.Pool;
export type SqlPoolConnectionType = mysql.PoolConnection | pg.PoolClient;

export class SqlDataSource extends DataSource {
  public isConnected: boolean;
  protected sqlPool!: SqlPoolType;
  private static instance: SqlDataSource;

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
    cb?: () => void,
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
        }) as mysql.Pool;
        break;

      case "postgres":
        sqlDataSource.sqlPool = new pg.Pool({
          host: sqlDataSource.host,
          port: sqlDataSource.port,
          user: sqlDataSource.username,
          password: sqlDataSource.password,
          database: sqlDataSource.database,
        }) as pg.Pool;
        break;
      default:
        throw new Error(`Unsupported datasource type: ${sqlDataSource.type}`);
    }

    try {
      switch (sqlDataSource.type) {
        case "mysql":
        case "mariadb":
          await (sqlDataSource.sqlPool as Pool).getConnection();
          break;
        case "postgres":
          await (sqlDataSource.sqlPool as pg.Pool).connect();
          break;
        default:
          throw new Error(`Unsupported datasource type: ${sqlDataSource.type}`);
      }
    } catch (error) {
      throw error;
    }

    sqlDataSource.isConnected = true;
    SqlDataSource.instance = sqlDataSource;
    cb?.();
    return sqlDataSource;
  }

  /**
   * @description Generates a temporary connection to the database, the instance will not be saved and cannot be accessed later in the getInstance method
   * @private
   * @internal
   */
  public static async tempConnect(
    input: DataSourceInput,
  ): Promise<SqlDataSource> {
    const sqlDataSource = new this(input);
    switch (input.type) {
      case "mysql":
      case "mariadb":
        sqlDataSource.sqlPool = createPool({
          host: input.host,
          port: input.port,
          user: input.username,
          password: input.password,
          database: input.database,
        });

        break;

      case "postgres":
        sqlDataSource.sqlPool = new pg.Pool({
          host: input.host,
          port: input.port,
          user: input.username,
          password: input.password,
          database: input.database,
        });
        break;
      default:
        throw new Error(`Unsupported datasource type: ${input.type}`);
    }

    try {
      switch (input.type) {
        case "mysql":
        case "mariadb":
          await (sqlDataSource.sqlPool as Pool).getConnection();
          break;
        case "postgres":
          await (sqlDataSource.sqlPool as pg.Pool).connect();
          break;
        default:
          throw new Error(`Unsupported datasource type: ${input.type}`);
      }
    } catch (error) {
      throw error;
    }

    sqlDataSource.isConnected = true;
    return sqlDataSource;
  }

  public static getInstance(): SqlDataSource {
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
      case "mysql" || "mariadb":
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
    model: typeof Model,
  ): ModelManager<T> {
    if (!this.isConnected) {
      throw new Error("Sql database connection not established");
    }

    switch (this.type) {
      case "mysql":
      case "mariadb":
        return new MysqlModelManager<T>(
          model,
          this.sqlPool as mysql.Pool,
          this.logs,
        );
      case "postgres":
        return new PostgresModelManager<T>(
          model,
          this.sqlPool as pg.Pool,
          this.logs,
        );
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }

  /**
   * @description Returns raw mysql pool
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
    switch (this.type) {
      case "mysql":
      case "mariadb":
        return await (this.sqlPool as Pool).end();
      case "postgres":
        return await (this.sqlPool as pg.Pool).end();
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }

  /**
   * @description Returns raw mysql PoolConnection
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
