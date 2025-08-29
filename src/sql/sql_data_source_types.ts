import { FormatOptionsWithLanguage } from "sql-formatter";
import type {
  DataSourceType,
  MysqlSqlDataSourceInput,
  NotNullableMysqlSqlDataSourceInput,
  NotNullablePostgresSqlDataSourceInput,
  NotNullableSqliteDataSourceInput,
  PostgresSqlDataSourceInput,
  SqliteDataSourceInput,
} from "../data_source/data_source_types";
import {
  DriverSpecificOptions,
  Mysql2Import,
  PgImport,
  Sqlite3Import,
} from "../drivers/driver_constants";
import { Timezone } from "../utils/date_utils";
import { Model } from "./models/model";
import { SqlDataSource } from "./sql_data_source";

export type SqlDriverSpecificOptions = Omit<
  DriverSpecificOptions,
  "mongoOptions" | "redisOptions"
>;

export type MysqlConnectionInstance = Awaited<
  ReturnType<Mysql2Import["createPool"]>
>;
export type PgPoolClientInstance = InstanceType<PgImport["Pool"]>;

export type SqliteConnectionInstance = InstanceType<Sqlite3Import["Database"]>;

export type SqlConnectionType =
  | MysqlConnectionInstance
  | PgPoolClientInstance
  | SqliteConnectionInstance;

/**
 * @description The connection policies for the sql data source
 * @default By default, the connection policies are not set, so no query will be retried
 */
export type ConnectionPolicies = {
  retry?: {
    maxRetries?: number;
    delay?: number;
  };
};

type FixedTimeZone = `+${number}:${number}` | `-${number}:${number}`;
type CountryTimezone = `${string}/${string}`;
export type DatabaseTimezone = Timezone | FixedTimeZone | CountryTimezone;

export type SqlDataSourceModel = typeof Model;

/**
 * @description The input type for the SqlDataSource constructor
 * @description The connectionPolicies object is used to configure the connection policies for the sql data source
 */
export type SqlDataSourceInput<
  T extends Record<string, SqlDataSourceModel> = {},
> = {
  readonly type?: Exclude<DataSourceType, "mongo">;
  /**
   * @description Whether to log the sql queries and other debug information
   */
  readonly logs?: boolean;
  /**
   * @description The timezone to use for the sql data source, default is "UTC"
   */
  readonly timezone?: DatabaseTimezone;
  /**
   * @description The connection policies to use for the sql data source that are not configured in the driverOptions
   */
  readonly connectionPolicies?: ConnectionPolicies;
  /**
   * @description The query format options to use for the sql data source, it tells how the sql queries should be formatted before being executed and logged
   */
  readonly queryFormatOptions?: FormatOptionsWithLanguage;

  /**
   * @description The models to use for the sql data source, if used models will be registered in the sql data source instance and will be available for the models to use
   * @description Models can still be used as standalone entities, but they won't be available for the sql data source instance
   */
  readonly models?: T;

  /**
   * @description Whether to sync the schema of the database with the models metadata
   * @description Manual or auto generated migrations are always suggested instead of using this option
   * @warning !! DO NOT USE THIS OPTION IN PRODUCTION !!
   * @warning This will drop and recreate all the indexes and constraints, use with caution
   * @warning Data Loss is highly likely if you use this option, renames are always implemented as drop and add, use with caution
   * @sqlite Since sqlite is very limited in alter statements, it's not recommended to use this option with sqlite
   * @default false
   */
  readonly syncModels?: boolean;
} & (
  | MysqlSqlDataSourceInput
  | PostgresSqlDataSourceInput
  | SqliteDataSourceInput
);

export type UseConnectionInput<
  T extends Record<string, SqlDataSourceModel> = {},
> = {
  readonly type: Exclude<DataSourceType, "mongo">;
  readonly logs?: boolean;
  readonly timezone?: DatabaseTimezone;
  readonly connectionPolicies?: ConnectionPolicies;
  readonly queryFormatOptions?: FormatOptionsWithLanguage;
  readonly models?: T;
} & (
  | NotNullableMysqlSqlDataSourceInput
  | NotNullablePostgresSqlDataSourceInput
  | NotNullableSqliteDataSourceInput
);

export type SqlDataSourceType = Exclude<DataSourceType, "mongo">;

export type GetCurrentConnectionReturnType<T = SqlDataSourceType> =
  T extends "mysql"
    ? MysqlConnectionInstance
    : T extends "mariadb"
      ? MysqlConnectionInstance
      : T extends "postgres"
        ? PgPoolClientInstance
        : T extends "cockroachdb"
          ? PgPoolClientInstance
          : T extends "sqlite"
            ? SqliteConnectionInstance
            : never;

export type AugmentedSqlDataSource<
  T extends Record<string, SqlDataSourceModel> = {},
> = SqlDataSource & {
  [key in keyof T]: T[key];
};
