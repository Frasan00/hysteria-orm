import type { Transaction as MssqlTransaction } from "mssql";
import type { PoolConnection } from "mysql2/promise";
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
  NotNullableOracleMssqlDataSourceInput,
  NotNullablePostgresSqlDataSourceInput,
  NotNullableSqliteDataSourceInput,
  PostgresSqlDataSourceInput,
  SqliteDataSourceInput,
} from "../data_source/data_source_types";
import type {
  BuiltinDriverName,
  DriverSpecificOptions,
  MssqlImport,
  Mysql2Import,
  PgImport,
  Sqlite3Import,
} from "../drivers/driver_types";
import type { DriverAdapterFactory } from "../drivers/driver_adapter_registry";
import type { JsEnvironmentValue } from "../platform/js_environment";
import type { AnyModelConstructor } from "./models/define_model_types";
import type { LoggerConfig } from "../utils/logger";

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

export type MssqlPoolInstance = InstanceType<MssqlImport["ConnectionPool"]>;
export type MssqlConnectionInstance = Awaited<
  ReturnType<MssqlPoolInstance["connect"]>
>;

export type SqlPoolType =
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

/**
 * Accepts both decorator-based model classes (`typeof Model` subclasses)
 * and programmatic models created via `defineModel`.
 */
export type SqlDataSourceModel = AnyModelConstructor;

/**
 * @description Migration lock configuration
 */
export type MigrationLockConfig = {
  /**
   * @description Enable/disable migration locking
   * @default true
   */
  enabled?: boolean;

  /**
   * @description Lock timeout in milliseconds for migration advisory lock acquisition
   * @default 30000
   */
  timeout?: number;

  /**
   * @description Custom lock key value - can be string, number, or function returning string|number
   * @default "hysteria_migration_lock"
   */
  customValue?: string | number | (() => string | number);
};

/**
 * @description Base migration configuration options available for all databases
 */
export type MigrationConfigBase = {
  /**
   * @description The path to the migrations folder, can be overridden in the cli command
   * @default "database/migrations"
   */
  path?: string;

  /**
   * @description Path to the tsconfig.json file for TypeScript migration files, can be overridden in the cli command
   * @default "./tsconfig.json"
   */
  tsconfig?: string;

  /**
   * @description Migration lock configuration - can be boolean to enable/disable, or an object for advanced options
   * @default true
   */
  lock?: boolean | MigrationLockConfig;

  /**
   * @deprecated Use lock.timeout instead. Kept for backward compatibility.
   * @description Lock timeout in milliseconds for migration advisory lock acquisition
   * @default 30000
   */
  lockTimeout?: number;
};

/**
 * @description Migration configuration with transactional support for PostgreSQL and CockroachDB
 */
type MigrationConfigWithTransactional = MigrationConfigBase & {
  /**
   * @description Runs all pending migrations in a single transaction, can be overridden in the cli command
   * @default true
   * @note Only available for PostgreSQL and CockroachDB
   */
  transactional?: boolean;
};

/**
 * @description Migration configuration type based on database type
 * @description Adds transactional option only for PostgreSQL and CockroachDB
 */
export type MigrationConfig<D extends SqlDataSourceType = SqlDataSourceType> =
  D extends "postgres" | "cockroachdb"
    ? MigrationConfigWithTransactional
    : MigrationConfigBase;

/**
 * @description Seeder configuration options
 */
export type SeederConfig = {
  /**
   * @description The path to the seeders folder
   * @default "database/seeders"
   */
  path?: string;

  /**
   * @description Path to the tsconfig.json file for TypeScript seeder files
   * @default "./tsconfig.json"
   */
  tsconfig?: string;
};

/**
 * @description Common input properties shared across all SqlDataSource types
 */
type SqlDataSourceInputBase<
  T extends Record<string, SqlDataSourceModel> = {},
  C extends CacheKeys = {},
  D extends SqlDataSourceType = SqlDataSourceType,
> = {
  /**
   * @description Whether to log the sql queries and other debug information. Can be a boolean or a LoggerConfig object for granular control.
   * @warning Logs are synchronous by default and add overhead — do not use in production unless you override with an async custom logger.
   * @default false
   */
  readonly logs?: boolean | LoggerConfig;

  /**
   * @description Enable AsyncLocalStorage (CLS) for automatic transaction propagation.
   * When enabled, queries inside `sql.transaction(callback)` automatically use the active
   * transaction without explicit passing.
   * @default true
   */
  readonly clsEnabled?: boolean;

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
   * @description Migration configuration for the sql data source
   */
  migrations?: MigrationConfig<D>;

  /**
   * @description Seeder configuration for the sql data source
   */
  seeders?: SeederConfig;

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

  /**
   * @description If true, the data source will not throw when unconnected — it will auto-connect on the first query execution.
   * @default false
   */
  lazyLoad?: boolean;
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
        : never;

export type SlaveContext = {
  type: SqlDataSourceType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

/**
 * @description The input type for the SqlDataSource constructor
 * @description The connectionPolicies object is used to configure the connection policies for the sql data source
 */
export type SqlDataSourceInput<
  D extends SqlDataSourceType = SqlDataSourceType,
  T extends Record<string, SqlDataSourceModel> = {},
  C extends CacheKeys = {},
  E extends JsEnvironmentValue = "auto",
> = SqlDataSourceInputShape<D, T, C, E> & {
  /**
   * @description Which driver runs the queries: a registered name, or an inline
   * {@link DriverAdapterFactory} for a driver nobody registered.
   *
   * A factory value *is* the custom path — the registry takes it as-is and skips
   * environment filtering, since passing one is an explicit opt-in. It must
   * still declare the configured dialect.
   *
   * Known names autocomplete per `(dialect, jsEnvironment)`; the `string & {}`
   * hatch keeps names added via `registerDriverAdapter` compiling, so an unknown
   * name fails at connect time with `DriverNotFoundError`, not at compile time.
   * @default the environment's driver for `type` — e.g. `"pg"` on node, `"bun-sql"` on bun
   */
  readonly driver?: BuiltinDriverName<E, D> | DriverAdapterFactory<D>;
};

type SqlDataSourceInputShape<
  D extends SqlDataSourceType,
  T extends Record<string, SqlDataSourceModel>,
  C extends CacheKeys,
  E extends JsEnvironmentValue,
> = SqlDataSourceInputBase<T, C, D> & {
  /**
   * @description The type of the database to connect to
   */
  readonly type: D;
  /**
   * @description JS runtime to run as. Narrowed alongside `driver`, so the two
   * are chosen together (e.g. `jsEnvironment: "bun"` unlocks "bun-sql").
   * @default "auto" — resolved from the host at connect time
   */
  readonly jsEnvironment?: E;
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
     * @description The function to call when a slave server fails, if not provided an error will be thrown
     */
    onSlaveServerFailure?: (
      error: Error,
      context: SlaveContext,
    ) => void | Promise<void>;

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
      | "migrations"
    >[];

    /**
     * @description The algorithm to use for selecting the slave for read operations
     * @default "roundRobin" - Distributes requests evenly across all slaves in sequence
     * @option "random" - Randomly selects a slave for each request
     */
    slaveAlgorithm?: SlaveAlgorithm;
  };
} & Omit<
  MapSqlDataSourceTypeToInput<D>,
  "type" | "driver" | "jsEnvironment"
>;

/**
 * @description Widest SQL input shape, for internal seams (registry, factory
 * context) that must accept any caller's narrowed `driver`/`jsEnvironment`.
 * `driver` is re-declared as `string` rather than reusing `BuiltinDriverName`:
 * a conditional deferred behind a generic environment bears no relation to
 * itself at another environment, so the narrowed form would be rejected.
 */
export type AnySqlDataSourceInput<
  D extends SqlDataSourceType = SqlDataSourceType,
> = SqlDataSourceInputShape<
  D,
  Record<string, SqlDataSourceModel>,
  CacheKeys,
  JsEnvironmentValue
> & {
  readonly driver?: string | DriverAdapterFactory<D>;
};

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
  readonly logs?: boolean | LoggerConfig;
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

/**
 * @description Result of a health check ping operation
 */
export type PingResult = {
  /** Whether the ping was successful */
  ok: boolean;
  /** Latency in milliseconds */
  latencyMs: number;
  /** Database dialect/type */
  dialect: SqlDataSourceType;
};
