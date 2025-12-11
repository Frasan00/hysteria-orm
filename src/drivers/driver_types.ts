import type { RedisOptions } from "ioredis";
import type { config as MssqlConfig } from "mssql";
import type { PoolOptions } from "mysql2/promise";
import type { PoolConfig } from "pg";
import type { DataSourceType } from "../data_source/data_source_types";
import type { PoolAttributes } from "oracledb";

export type Mysql2Import = typeof import("mysql2/promise");
export type Mysql2SyncImport = typeof import("mysql2");
export type PgImport = typeof import("pg");
export type Sqlite3Import = typeof import("sqlite3");
export type MongoClientImport = typeof import("mongodb");
export type MssqlImport = typeof import("mssql");
export type OracleDBImport = typeof import("oracledb");

export type OracleDBCreateConnectionOptions = PoolAttributes;
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
          : T extends "oracledb"
            ? OracleDBCreateConnectionOptions
            : never;

export type DriverImport =
  | OracleDBImport
  | Mysql2Import
  | PgImport
  | Sqlite3Import
  | MongoClientImport
  | MssqlImport;
