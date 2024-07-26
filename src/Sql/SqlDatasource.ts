import { Datasource, DataSourceInput, DataSourceType } from "../Datasource";
import mysql, { createPool, Pool } from "mysql2/promise";
import pg from "pg";
import { Model } from "./Models/Model";
import { MysqlModelManager } from "./Mysql/MysqlModelManager";
import { PostgresModelManager } from "./Postgres/PostgresModelManager";

type ModelManager<T extends Model> =
  | MysqlModelManager<T>
  | PostgresModelManager<T>;

export type SqlPoolType = mysql.Pool | pg.Pool;
export type SqlPoolConnectionType = mysql.PoolConnection | pg.PoolClient;

export class SqlDataSource extends Datasource {
  public isConnected: boolean;
  protected sqlPool!: SqlPoolType;
  private static instance: SqlDataSource;

  private constructor(input: DataSourceInput) {
    super(input);
    this.isConnected = false;
  }

  public getDbType(): DataSourceType {
    return this.type;
  }

  /**
   * @description Connects to the database establishing a connection pool.
   */
  public static async connect(input: DataSourceInput): Promise<SqlDataSource> {
    const sqlDataSource = new this(input);
    switch (input.type) {
      case "mysql":
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

    sqlDataSource.isConnected = true;
    SqlDataSource.instance = sqlDataSource;
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
   * @description Begins a transaction on the database
   * @param model
   * @returns
   */
  // TODO fix this
  public startTransaction<T extends Model>() {
    return this.getModelManager(Model).startTransaction();
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
