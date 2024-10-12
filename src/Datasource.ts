import dotenv from "dotenv";
import mysql from "mysql2/promise";
import pg from "pg";

dotenv.config();

/*
 * Creates a datasource for the selected database type with the provided credentials
 */
export type DataSourceType =
  | "mysql"
  | "postgres"
  | "mariadb"
  | "sqlite"
  | "redis";

export type SqlDataSourceType = Omit<DataSourceType, "redis">;

/**
 * @description By default the connection details can be provided in the env.ts file, you can still override each prop with your actual connection details
 */
export interface DataSourceInput {
  type?: DataSourceType;
  readonly host?: string;
  readonly port?: number;
  readonly username?: string;
  readonly password?: string;
  readonly database?: string;
  readonly logs?: boolean;
  readonly mysqlOptions?: mysql.PoolOptions;
  readonly pgOptions?: pg.PoolConfig;
}

export abstract class DataSource {
  protected type!: DataSourceType;
  protected host!: string;
  protected port!: number;
  protected username!: string;
  protected password!: string;
  protected database!: string;
  protected logs!: boolean;

  protected constructor(input?: DataSourceInput) {
    if (this.type === "redis") {
      this.handleRedisSource(input);
      return;
    }

    this.handleSqlSource(input);
  }

  protected handleRedisSource(input?: DataSourceInput) {
    this.type = "redis";
    this.host = (input?.host || process.env.REDIS_HOST) as string;
    this.port = +(input?.port as number) || +(process.env.REDIS_PORT as string);
    this.logs =
      Boolean(input?.logs) || Boolean(process.env.REDIS_LOGS) || false;

    if (!this.port) {
      this.port = 6379;
    }

    if (![this.host].some((connectionDetail) => !connectionDetail)) {
      throw new Error(
        "Missing connection details in the envs or in the connection details",
      );
    }
  }

  protected handleSqlSource(input?: DataSourceInput) {
    this.type = (input?.type || process.env.DB_TYPE) as DataSourceType;
    this.host = (input?.host || process.env.DB_HOST) as string;
    this.port = +(input?.port as number) || +(process.env.DB_PORT as string);
    this.username = (input?.username || process.env.DB_USER) as string;
    this.password = (input?.password || process.env.DB_PASSWORD) as string;
    this.database = (input?.database || process.env.DB_DATABASE) as string;
    this.logs = Boolean(input?.logs) || Boolean(process.env.DB_LOGS) || false;

    if (!this.port) {
      switch (this.type) {
        case "mysql":
        case "mariadb":
          this.port = 3306;
          break;
        case "postgres":
          this.port = 5432;
        case "redis":
          this.port = 6379;
        case "sqlite":
          break;
        default:
          throw new Error(
            "Database type not provided in the envs nor in the connection details",
          );
      }
    }
  }
}
