import { MongoOptions } from "mongodb";
import {
  PgClientOptions,
  MysqlCreateConnectionOptions,
} from "../drivers/driver_constants";

/**
 * @description Creates a datasource for the selected database type with the provided credentials
 */
export type DataSourceType =
  | "mysql"
  | "postgres"
  | "mariadb"
  | "sqlite"
  | "mongo";

export interface CommonDataSourceInput {
  readonly type?: DataSourceType;
  readonly logs?: boolean;
}

export interface MongoDataSourceInput extends CommonDataSourceInput {
  readonly type: "mongo";
  readonly mongoOptions?: MongoOptions;
  readonly url?: string;
}

export interface PostgresSqlDataSourceInput extends CommonDataSourceInput {
  readonly type?: "postgres";
  readonly host?: string;
  readonly port?: number;
  readonly username?: string;
  readonly password?: string;
  readonly database?: string;
  readonly driverOptions?: PgClientOptions;
}

export interface MysqlSqlDataSourceInput extends CommonDataSourceInput {
  readonly type: "mysql" | "mariadb";
  readonly host?: string;
  readonly port?: number;
  readonly username?: string;
  readonly password?: string;
  readonly database?: string;
  readonly driverOptions?: MysqlCreateConnectionOptions;
}

export interface SqliteDataSourceInput extends CommonDataSourceInput {
  readonly type: "sqlite";
  readonly database?: string;
}

/**
 * @description By default the connection details can be provided in the .env file, you can still override each prop with your actual connection details in the input
 */
export type DataSourceInput =
  | MysqlSqlDataSourceInput
  | SqliteDataSourceInput
  | PostgresSqlDataSourceInput
  | MongoDataSourceInput;
