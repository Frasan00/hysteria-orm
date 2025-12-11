import type { Transaction as MssqlTransaction } from "mssql";
import type { PoolConnection } from "mysql2/promise";
import type {
  Connection as OracleDBConnection,
  Pool as OracleDBPool,
} from "oracledb";
import type { PoolClient } from "pg";
import { FormatOptionsWithLanguage } from "sql-formatter";
import type { AdminJsOptions } from "../adminjs/adminjs_types";
import type { CacheAdapter } from "../cache/cache_adapter";
import type { CacheKeys } from "../cache/cache_types";
import type {
  DataSourceType,
  MssqlDataSourceInput,
  MysqlSqlDataSourceInput,
  NotNullableMysqlSqlDataSourceInput,
  NotNullableOracleDBDataSourceInput,
  NotNullableOracleMssqlDataSourceInput,
  NotNullablePostgresSqlDataSourceInput,
  NotNullableSqliteDataSourceInput,
  OracleDBDataSourceInput,
  PostgresSqlDataSourceInput,
  SqliteDataSourceInput,
} from "../data_source/data_source_types";
import type {
  DriverSpecificOptions,
  MssqlImport,
  Mysql2Import,
  PgImport,
  Sqlite3Import,
} from "../drivers/driver_types";
import type { Model } from "./models/model";

export type Sqlite3ConnectionOptions = {
  mode: number;
};

export type SqlDriverSpecificOptions<T extends DataSourceType> = Omit<
  DriverSpecificOptions<T>,
  "mongoOptions" | "redisOptions"
>;

export type MysqlConnectionInstance = Awaited<
  ReturnType<Mysql2Import["createPool"]>
>;
export type PgPoolClientInstance = InstanceType<PgImport["Pool"]>;

export type SqliteConnectionInstance = InstanceType<Sqlite3Import["Database"]>;

export type OracleDBPoolInstance = OracleDBPool;

export type MssqlPoolInstance = InstanceType<MssqlImport["ConnectionPool"]>;
export type MssqlConnectionInstance = Awaited<
  ReturnType<MssqlPoolInstance["connect"]>
>;

export type SqlPoolType =
  | OracleDBPoolInstance
  | MysqlConnectionInstance
  | PgPoolClientInstance
  | SqliteConnectionInstance
  | MssqlPoolInstance;

/**
 * @description The connection policies for the sql data source
 * @default the connection policies are not set, so no query will be retried
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
 * @description Common input properties shared across all SqlDataSource types
 */
type SqlDataSourceInputBase<
  T extends Record<string, SqlDataSourceModel> = {},
  C extends CacheKeys = {},
> = {
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
   * @description The path to the migrations folder for the sql data source, it's used to configure the migrations path for the sql data source
   * @default "database/migrations"
   */
  migrationsPath?: string;

  /**
   * @description The cache strategy to use for the sql data source, it's used to configure the cache strategy for the sql data source
   */
  cacheStrategy?: {
    cacheAdapter?: CacheAdapter;
    keys: C;
  };

  /**
   * @description AdminJS configuration for the admin panel
   * @description To use AdminJS, install: `npm install adminjs`
   */
  adminJs?: AdminJsOptions;
};

/**
 * @description Maps a SqlDataSourceType to its corresponding input interface
 */
type MapSqlDataSourceTypeToInput<D extends SqlDataSourceType> = D extends
  | "mysql"
  | "mariadb"
  ? MysqlSqlDataSourceInput
  : D extends "postgres" | "cockroachdb"
    ? PostgresSqlDataSourceInput
    : D extends "sqlite"
      ? SqliteDataSourceInput
      : D extends "mssql"
        ? MssqlDataSourceInput
        : D extends "oracledb"
          ? OracleDBDataSourceInput
          : never;

/**
 * @description The input type for the SqlDataSource constructor
 * @description The connectionPolicies object is used to configure the connection policies for the sql data source
 */
export type SqlDataSourceInput<
  D extends SqlDataSourceType = SqlDataSourceType,
  T extends Record<string, SqlDataSourceModel> = {},
  C extends CacheKeys = {},
> = SqlDataSourceInputBase<T, C> & {
  /**
   * @description The type of the database to connect to
   */
  readonly type: D;
  /**
   * @description The driver specific options to use for the sql data source, it's used to configure the driver specific options for the sql data source
   * @warning For usage with types, you must have driver types installed if the driver handles types in a type package like e.g. `@types/pg`
   */
  driverOptions?: SqlDriverSpecificOptions<D>;

  /**
   * @description The replication configuration for the sql data source, it's used to configure the replication for the sql data source
   */
  replication?: {
    /**
     * @description The slaves data sources to use for the sql data source, slaves are automatically used for read operations unless specified otherwise
     */
    slaves?: Omit<
      UseConnectionInput<D, T, C>,
      | "slaves"
      | "models"
      | "cacheStrategy"
      | "adminJs"
      | "logs"
      | "queryFormatOptions"
      | "migrationsPath"
    >[];

    /**
     * @description The algorithm to use for selecting the slave for read operations
     * @default "roundRobin" - Distributes requests evenly across all slaves in sequence
     * @option "random" - Randomly selects a slave for each request
     */
    slaveAlgorithm?: SlaveAlgorithm;
  };
} & Omit<MapSqlDataSourceTypeToInput<D>, "type">;

/**
 * @description Maps a SqlDataSourceType to its corresponding non-nullable input interface
 */
type MapSqlDataSourceTypeToNotNullableInput<D extends SqlDataSourceType> =
  D extends "mysql" | "mariadb"
    ? NotNullableMysqlSqlDataSourceInput
    : D extends "postgres" | "cockroachdb"
      ? NotNullablePostgresSqlDataSourceInput
      : D extends "sqlite"
        ? NotNullableSqliteDataSourceInput
        : D extends "mssql"
          ? NotNullableOracleMssqlDataSourceInput
          : D extends "oracledb"
            ? NotNullableOracleDBDataSourceInput
            : never;

export type UseConnectionInput<
  D extends SqlDataSourceType = SqlDataSourceType,
  T extends Record<string, SqlDataSourceModel> = {},
  C extends CacheKeys = {},
> = {
  /**
   * @description The type of the database to connect to
   */
  readonly type: D;
  readonly logs?: boolean;
  readonly models?: T;
  readonly driverOptions?: SqlDriverSpecificOptions<D>;
  connectionPolicies?: ConnectionPolicies;
  queryFormatOptions?: FormatOptionsWithLanguage;
  cacheStrategy?: {
    cacheAdapter: CacheAdapter;
    keys: C;
  };
  /**
   * @description AdminJS configuration for the admin panel
   * @description AdminJS is completely optional - dependencies are loaded at runtime via dynamic import()
   */
  adminJs?: AdminJsOptions;
} & Omit<MapSqlDataSourceTypeToNotNullableInput<D>, "type">;

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
          : T extends "mssql"
            ? MssqlPoolInstance
            : T extends "oracledb"
              ? OracleDBPoolInstance
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
          : T extends "mssql"
            ? MssqlTransaction
            : T extends "oracledb"
              ? OracleDBConnection
              : never;

/** Only accepts formats `string` e `string as string` */
type NoSpace<S extends string> = S extends `${infer _} ${infer _}` ? never : S;

export type TableFormat<S extends string> =
  | NoSpace<S>
  | (S extends `${infer L} as ${infer R}`
      ? `${NoSpace<L>} as ${NoSpace<R>}`
      : never);

export type ReplicationType = "master" | "slave";

/**
 * @description Algorithm for selecting a slave database for read operations
 * @option "roundRobin" - Distributes requests evenly across all slaves in sequence
 * @option "random" - Randomly selects a slave for each request
 */
export type SlaveAlgorithm = "roundRobin" | "random";

export type RawQueryOptions = {
  replicationMode?: ReplicationType;
};
