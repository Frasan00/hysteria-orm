import type { MongoConnectionOptions } from "../drivers/driver_types";
import type { JsEnvironmentValue } from "../platform/js_environment";
import type { LoggerConfig } from "../utils/logger";

/**
 * @description Creates a datasource for the selected database type with the provided credentials
 */
export type DataSourceType =
  | "cockroachdb"
  | "mysql"
  | "postgres"
  | "mariadb"
  | "sqlite"
  | "mssql"
  | "mongo";

export interface MssqlDataSourceInput extends CommonDataSourceInput {
  readonly type: "mssql";
  readonly host?: string;
  readonly port?: number;
  readonly username?: string;
  readonly password?: string;
  readonly database?: string;
}

export interface CommonDataSourceInput {
  readonly type?: DataSourceType;
  /**
   * @description Query logging configuration. Enabled only when explicitly provided.
   * @default false — query logs are OFF unless you opt in (input or DB_LOGS=true)
   * @warning When enabled, logs are emitted synchronously by default, which blocks
   * the event loop on every query — not recommended for production. Override with
   * `{ customLogger: <async logger> }` via {@link LoggerConfig} to log asynchronously.
   */
  readonly logs?: boolean | LoggerConfig;
  /**
   * @description JS runtime to run as (auto-detected when omitted)
   * @default "auto"
   */
  readonly jsEnvironment?: JsEnvironmentValue;
  /**
   * @description Driver name override (e.g. "pg", "mysql2", "sqlite3", "mssql", "bun-sql", "bun-sqlite")
   */
  readonly driver?: string;
}

export interface MongoDataSourceInput extends CommonDataSourceInput {
  readonly type: "mongo";
  readonly mongoOptions?: MongoConnectionOptions;
  readonly url?: string;
}

export interface PostgresSqlDataSourceInput extends CommonDataSourceInput {
  readonly type?: "postgres" | "cockroachdb";
  readonly host?: string;
  readonly port?: number;
  readonly username?: string;
  readonly password?: string;
  readonly database?: string;
}

export interface NotNullablePostgresSqlDataSourceInput extends PostgresSqlDataSourceInput {
  readonly type?: "postgres" | "cockroachdb";
  readonly host: string;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly port?: number;
}

export interface NotNullableOracleMssqlDataSourceInput extends MssqlDataSourceInput {
  readonly type: "mssql";
  readonly host: string;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly port?: number;
}

export interface MysqlSqlDataSourceInput extends CommonDataSourceInput {
  readonly type?: "mysql" | "mariadb";
  readonly host?: string;
  readonly port?: number;
  readonly username?: string;
  readonly password?: string;
  readonly database?: string;
}

export interface NotNullableMysqlSqlDataSourceInput extends MysqlSqlDataSourceInput {
  readonly type?: "mysql" | "mariadb";
  readonly host: string;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly port?: number;
}

export interface SqliteDataSourceInput extends CommonDataSourceInput {
  readonly type?: "sqlite";
  /**
   * @description The filename of the database file for SQLite
   * @default ":memory:"
   */
  readonly database?: ":memory:" | "file::memory:?cache=shared" | (string & {});
}

export interface NotNullableSqliteDataSourceInput extends SqliteDataSourceInput {
  readonly type?: "sqlite";
  readonly database: string;
}

/**
 * @description By default the connection details can be provided in the .env file, you can still override each prop with your actual connection details in the input
 */
export type DataSourceInput =
  | MssqlDataSourceInput
  | MysqlSqlDataSourceInput
  | SqliteDataSourceInput
  | PostgresSqlDataSourceInput
  | MongoDataSourceInput;
