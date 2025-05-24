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

export type CacheOptions = {
  /**
   * @description The type of cache to use, currently only memory and redis are supported
   */
  type: "memory" | "redis";
  /**
   * @description The ttl for the cache in milliseconds, if not set, the cache will never expire
   */
  ttl?: number;
};

type FixedTimeZone = `+${number}:${number}` | `-${number}:${number}`;
type CountryTimezone = `${string}/${string}`;
export type DatabaseTimezone = Timezone | FixedTimeZone | CountryTimezone;

/**
 * @description The input type for the SqlDataSource constructor
 * @description The connectionPolicies object is used to configure the connection policies for the sql data source
 */
export type SqlDataSourceInput = {
  readonly type: Exclude<DataSourceType, "mongo">;
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
   * @description The cache options to use for the sql data source, it tells if and how the sql queries should be cached
   */
  readonly cacheOptions?: CacheOptions;
} & (
  | MysqlSqlDataSourceInput
  | PostgresSqlDataSourceInput
  | SqliteDataSourceInput
);

export type UseConnectionInput = {
  readonly type: Exclude<DataSourceType, "mongo">;
  readonly logs?: boolean;
  readonly timezone?: DatabaseTimezone;
  readonly connectionPolicies?: ConnectionPolicies;
  readonly queryFormatOptions?: FormatOptionsWithLanguage;
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
