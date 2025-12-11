import type { MongoConnectionOptions } from "../drivers/driver_types";

/**
 * @description Creates a datasource for the selected database type with the provided credentials
 */
export type DataSourceType =
  | "oracledb"
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

export interface OracleDBDataSourceInput extends CommonDataSourceInput {
  readonly type: "oracledb";
  readonly host?: string;
  readonly port?: number;
  readonly username?: string;
  readonly password?: string;
  readonly database?: string;
}

export interface CommonDataSourceInput {
  readonly type?: DataSourceType;
  readonly logs?: boolean;
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

export interface NotNullablePostgresSqlDataSourceInput
  extends PostgresSqlDataSourceInput {
  readonly type?: "postgres" | "cockroachdb";
  readonly host: string;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly port?: number;
}

export interface NotNullableOracleMssqlDataSourceInput
  extends MssqlDataSourceInput {
  readonly type: "mssql";
  readonly host: string;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly port?: number;
}

export interface NotNullableOracleDBDataSourceInput
  extends OracleDBDataSourceInput {
  readonly type: "oracledb";
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

export interface NotNullableMysqlSqlDataSourceInput
  extends MysqlSqlDataSourceInput {
  readonly type?: "mysql" | "mariadb";
  readonly host: string;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly port?: number;
}

export interface SqliteDataSourceInput extends CommonDataSourceInput {
  readonly type?: "sqlite";
  readonly database?: string;
}

export interface NotNullableSqliteDataSourceInput
  extends SqliteDataSourceInput {
  readonly type?: "sqlite";
  readonly database: string;
}

/**
 * @description By default the connection details can be provided in the .env file, you can still override each prop with your actual connection details in the input
 */
export type DataSourceInput =
  | OracleDBDataSourceInput
  | MssqlDataSourceInput
  | MysqlSqlDataSourceInput
  | SqliteDataSourceInput
  | PostgresSqlDataSourceInput
  | MongoDataSourceInput;
