import type { RedisOptions } from "ioredis";
import type { PoolOptions } from "mysql2/promise";
import type { ClientConfig } from "pg";
import type { DataSourceType } from "../data_source/data_source_types";

export type Mysql2Import = typeof import("mysql2/promise");
export type Mysql2SyncImport = typeof import("mysql2");
export type PgImport = typeof import("pg");
export type Sqlite3Import = typeof import("sqlite3");
export type MongoClientImport = typeof import("mongodb");

export type MysqlCreateConnectionOptions = PoolOptions;
export type PgClientOptions = ClientConfig;

export type MongoConnectionOptions = NonNullable<
  ConstructorParameters<MongoClientImport["MongoClient"]>[1]
>;

export type DriverSpecificOptions<T extends DataSourceType> = T extends "mongo"
  ? MongoConnectionOptions
  : T extends "cockroachdb" | "postgres"
    ? PgClientOptions
    : T extends "redis"
      ? RedisOptions
      : T extends "mysql" | "mariadb"
        ? MysqlCreateConnectionOptions
        : never;

export type DriverImport =
  | Mysql2Import
  | PgImport
  | Sqlite3Import
  | MongoClientImport;
