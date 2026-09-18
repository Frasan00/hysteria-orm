import type { RedisOptions } from "ioredis";
import type { config as MssqlConfig } from "mssql";
import type { PoolOptions } from "mysql2/promise";
import type { PoolConfig } from "pg";
import type { DataSourceType } from "../data_source/data_source_types";
import type {
  JsEnvironmentValue,
  ResolvedJsEnvironment,
} from "../platform/js_environment";

/**
 * Registered factory names per resolved environment, keyed by dialect. Kept in
 * sync by hand with the registrations in drivers/adapters/{node,bun,web}.
 */
export type DriverNamesByEnvironment = {
  node: {
    postgres: "pg";
    cockroachdb: "pg";
    mysql: "mysql2";
    mariadb: "mysql2";
    sqlite: "sqlite3";
    mssql: "mssql";
  };
  bun: {
    postgres: "bun-sql";
    cockroachdb: "bun-sql";
    mysql: "bun-sql";
    mariadb: "bun-sql";
    sqlite: "bun-sqlite";
    mssql: "mssql";
  };
  web: { sqlite: "sqlite-wasm" };
  "react-native": { sqlite: "sqlite-rn" };
};

// Distributes over both parameters: keyof (A | B) is an intersection, so a
// non-distributive lookup would break the widened JsEnvironmentValue case.
type DriversFor<
  R extends ResolvedJsEnvironment,
  D extends DataSourceType,
> = R extends ResolvedJsEnvironment
  ? D extends keyof DriverNamesByEnvironment[R]
    ? DriverNamesByEnvironment[R][D]
    : never
  : never;

/**
 * Factory names valid for a (dialect, environment) pair, or never when the pair
 * has no driver (e.g. postgres on web). "auto" maps to node because the real
 * runtime is unknown to the type system.
 */
export type AllowedDrivers<
  E extends JsEnvironmentValue,
  D extends DataSourceType,
> = DriversFor<E extends "auto" ? "node" : E, D>;

/**
 * The `driver` prop. Known names autocomplete; any string stays assignable so
 * third-party registerDriverAdapter names keep compiling. Typos are caught at
 * runtime by DriverNotFoundError.
 */
export type BuiltinDriverName<
  E extends JsEnvironmentValue,
  D extends DataSourceType,
> = [AllowedDrivers<E, D>] extends [never]
  ? never
  : AllowedDrivers<E, D> | (string & {});

export type Mysql2Import = typeof import("mysql2/promise");
export type Mysql2SyncImport = typeof import("mysql2");
export type PgImport = (typeof import("pg"))["default"];
export type Sqlite3Import = typeof import("sqlite3");
export type MongoClientImport = typeof import("mongodb");
export type MssqlImport = typeof import("mssql");

export type MysqlCreateConnectionOptions = PoolOptions;
export type PgPoolOptions = PoolConfig;
export type MssqlConnectionOptions = Omit<MssqlConfig, "options"> & {
  options?: Omit<
    NonNullable<MssqlConfig["options"]>,
    "abortTransactionOnError" | "enableImplicitTransactions"
  >;
};

export type MongoConnectionOptions = NonNullable<
  ConstructorParameters<MongoClientImport["MongoClient"]>[1]
>;

export type DriverSpecificOptions<T extends DataSourceType> = T extends "mongo"
  ? MongoConnectionOptions
  : T extends "cockroachdb" | "postgres"
    ? PgPoolOptions
    : T extends "redis"
      ? RedisOptions
      : T extends "mysql" | "mariadb"
        ? MysqlCreateConnectionOptions
        : T extends "mssql"
          ? MssqlConnectionOptions
          : never;

export type DriverImport =
  | Mysql2Import
  | PgImport
  | Sqlite3Import
  | MongoClientImport
  | MssqlImport;
