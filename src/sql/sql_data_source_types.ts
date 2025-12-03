import type { PoolConnection } from "mysql2/promise";
import type { PoolClient } from "pg";
import { FormatOptionsWithLanguage } from "sql-formatter";
import type { CacheAdapter } from "../cache/cache_adapter";
import type { CacheKeys, UseCacheReturnType } from "../cache/cache_types";
import type {
  DataSourceType,
  MysqlSqlDataSourceInput,
  NotNullableMysqlSqlDataSourceInput,
  NotNullablePostgresSqlDataSourceInput,
  NotNullableSqliteDataSourceInput,
  PostgresSqlDataSourceInput,
  SqliteDataSourceInput,
} from "../data_source/data_source_types";
import type {
  DriverSpecificOptions,
  Mysql2Import,
  PgImport,
  Sqlite3Import,
} from "../drivers/driver_constants";
import type { Model } from "./models/model";
import type { SqlDataSource } from "./sql_data_source";

export type SqlDriverSpecificOptions<T extends DataSourceType> = Omit<
  DriverSpecificOptions<T>,
  "mongoOptions" | "redisOptions"
>;

export type MysqlConnectionInstance = Awaited<
  ReturnType<Mysql2Import["createPool"]>
>;
export type PgPoolClientInstance = InstanceType<PgImport["Pool"]>;

export type SqliteConnectionInstance = InstanceType<Sqlite3Import["Database"]>;

export type SqlPoolType =
  | MysqlConnectionInstance
  | PgPoolClientInstance
  | SqliteConnectionInstance;

/**
 * @description The connection policies for the sql data source
 * @default By default, the connection policies are not set, so no query will be retried
 */
export type ConnectionPolicies = {
  /**
   * @description The retry policy for the sql data source, it allows to retry a query if it fails
   */
  retry?: {
    maxRetries?: number;
    delay?: number;
  };
};

export type SqlDataSourceModel = typeof Model;

/**
 * @description The input type for the SqlDataSource constructor
 * @description The connectionPolicies object is used to configure the connection policies for the sql data source
 */
export type SqlDataSourceInput<
  D extends SqlDataSourceType,
  T extends Record<string, SqlDataSourceModel> = {},
  C extends CacheKeys = {},
> = {
  readonly type?: Exclude<DataSourceType, "mongo">;
  /**
   * @description Whether to log the sql queries and other debug information
   */
  readonly logs?: boolean;
  /**
   * @description The connection policies to use for the sql data source that are not configured in the driverOptions
   */
  connectionPolicies?: ConnectionPolicies;
  /**
   * @description The query format options to use for the sql data source, it tells how the sql queries should be formatted before being executed and logged
   */
  queryFormatOptions?: FormatOptionsWithLanguage;

  /**
   * @description The models to use for the sql data source, if used models will be registered in the sql data source instance and will be available for the models to use
   * @description Models can still be used as standalone entities, but they won't be available for the sql data source instance
   */
  models?: T;

  /**
   * @description The driver specific options to use for the sql data source, it's used to configure the driver specific options for the sql data source
   */
  driverOptions?: SqlDriverSpecificOptions<D>;

  cacheStrategy?: {
    cacheAdapter?: CacheAdapter;
    keys: C;
  };
} & (
  | MysqlSqlDataSourceInput
  | PostgresSqlDataSourceInput
  | SqliteDataSourceInput
);

export type UseConnectionInput<
  D extends SqlDataSourceType,
  T extends Record<string, SqlDataSourceModel> = {},
  C extends CacheKeys = {},
> = {
  readonly type: Exclude<DataSourceType, "mongo">;
  readonly logs?: boolean;
  readonly models?: T;
  readonly driverOptions?: SqlDriverSpecificOptions<D>;
  connectionPolicies?: ConnectionPolicies;
  queryFormatOptions?: FormatOptionsWithLanguage;
  cacheStrategy?: {
    cacheAdapter: CacheAdapter;
    keys: C;
  };
} & (
  | NotNullableMysqlSqlDataSourceInput
  | NotNullablePostgresSqlDataSourceInput
  | NotNullableSqliteDataSourceInput
);

export type SqlDataSourceType = Exclude<DataSourceType, "mongo">;

export type SqlCloneOptions = {
  /**
   * @description Whether to recreate the pool of connections for the given driver, by default it's false
   * @warning If false, the pool of connections will be reused from the caller instance
   */
  shouldRecreatePool?: boolean;
};

export type getPoolReturnType<T = SqlDataSourceType> = T extends "mysql"
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

export type GetConnectionReturnType<T = SqlDataSourceType> = T extends "mysql"
  ? PoolConnection
  : T extends "mariadb"
    ? PoolConnection
    : T extends "postgres"
      ? PoolClient
      : T extends "cockroachdb"
        ? PoolClient
        : T extends "sqlite"
          ? InstanceType<Sqlite3Import["Database"]>
          : never;

type UseCacheOverloads<C extends CacheKeys> = {
  <K extends keyof C>(
    key: K,
    ...args: Parameters<C[K]>
  ): Promise<UseCacheReturnType<C, K>>;
  <K extends keyof C>(
    key: K,
    ttl: number,
    ...args: Parameters<C[K]>
  ): Promise<UseCacheReturnType<C, K>>;
};

type UseCacheType<C extends CacheKeys> = keyof C extends never
  ? SqlDataSource["useCache"]
  : UseCacheOverloads<C>;

type InvalidCacheType<C extends CacheKeys> = keyof C extends never
  ? SqlDataSource["invalidCache"]
  : <K extends keyof C>(key: K) => Promise<void>;

export type AugmentedSqlDataSource<
  T extends Record<string, SqlDataSourceModel> = {},
  C extends CacheKeys = {},
> = Omit<SqlDataSource, "useCache" | "invalidCache" | "clone"> & {
  useCache: UseCacheType<C>;
  invalidCache: InvalidCacheType<C>;
  clone(options?: SqlCloneOptions): Promise<AugmentedSqlDataSource<T, C>>;
} & {
  [key in keyof T]: T[key];
};

export type SqlDataSourceWithoutTransaction<
  T extends Record<string, SqlDataSourceModel> = {},
> = Pick<
  SqlDataSource,
  | "sqlPool"
  | "sqlConnection"
  | "inputDetails"
  | "isConnected"
  | "getDbType"
  | "clone"
  | "getModelManager"
  | "getPool"
  | "getConnection"
  | "closeConnection"
  | "getConnectionDetails"
  | "disconnect"
  | "syncSchema"
  | "rawQuery"
  | "rawStatement"
  | "getTableSchema"
  | "getModelOpenApiSchema"
  | "getTableInfo"
  | "getIndexInfo"
  | "getForeignKeyInfo"
  | "getPrimaryKeyInfo"
  | "registeredModels"
  | "type"
  | "host"
  | "port"
  | "username"
  | "password"
  | "database"
  | "logs"
  | "query"
> & {
  [key in keyof T]: T[key];
};

/** Only accepts formats `string` e `string as string` */
type NoSpace<S extends string> = S extends `${infer _} ${infer _}` ? never : S;

export type TableFormat<S extends string> =
  | NoSpace<S>
  | (S extends `${infer L} as ${infer R}`
      ? `${NoSpace<L>} as ${NoSpace<R>}`
      : never);
