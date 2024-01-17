import { Datasource, DatasourceInput, DatasourceType } from "../Datasource";
import mysql, { createPool, Pool } from "mysql2/promise";
import pg from "pg";
import { Model } from "./Models/Model";
import { MysqlModelManager } from "./Mysql/MysqlModelManager";
import { PostgresModelManager } from "./Postgres/PostgresModelManager";

type ModelManagerType<T extends Model> =
  | MysqlModelManager<T>
  | PostgresModelManager<T>;

export type SqlPoolType = mysql.Pool | pg.Pool;
export type SqlPoolConnectionType = mysql.PoolConnection | pg.PoolClient;

export class SqlDatasource extends Datasource {
  protected sqlPool!: SqlPoolType;

  public constructor(input: DatasourceInput) {
    super(input);
  }

  /**
   * @description Connects to the database establishing a connection pool.
   */
  public async connect(): Promise<void> {
    switch (this.type) {
      case "mysql":
        this.sqlPool = createPool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
        });
        break;

      case "postgres":
        this.sqlPool = new pg.Pool({
          host: this.host,
          port: this.port,
          user: this.username,
          password: this.password,
          database: this.database,
        });
        break;
      default:
        throw new Error(`Unsupported datasource type: ${this.type}`);
    }
  }

  /**
   * @description Returns model manager for the provided model
   * @param model
   */
  public getModelManager<T extends Model>(
    model: new () => T,
  ): ModelManagerType<T> {
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
