import type { RedisOptions } from "ioredis";
import type { DataSourceType } from "../data_source/data_source_types";

export type Mysql2Import = typeof import("mysql2/promise");
export type Mysql2SyncImport = typeof import("mysql2");
export type PgImport = typeof import("pg");
export type Sqlite3Import = typeof import("sqlite3");
export type MongoClientImport = typeof import("mongodb");

type ExcludeStringFromOptions<T> = T extends string ? never : T;

export type MysqlCreateConnectionOptions = Parameters<
  Mysql2Import["createPool"]
>[0];

export type PgClientOptions = ExcludeStringFromOptions<
  ConstructorParameters<PgImport["Pool"]>[0]
>;

export type MongoConnectionOptions = NonNullable<
  ConstructorParameters<MongoClientImport["MongoClient"]>[1]
>;

export type DriverSpecificOptions<T extends DataSourceType> = T extends "mongo"
  ? MongoConnectionOptions
  : T extends "cockroachdb"
    ? PgClientOptions
    : T extends "redis"
      ? RedisOptions
      : T extends "postgres"
        ? PgClientOptions
        : T extends "mongo"
          ? MongoConnectionOptions
          : T extends "mariadb"
            ? MysqlCreateConnectionOptions
            : T extends "mysql"
              ? MysqlCreateConnectionOptions
              : never;

export type DriverImport =
  | Mysql2Import
  | PgImport
  | Sqlite3Import
  | MongoClientImport;

export class DriverNotFoundError extends Error {
  constructor(driverName: string) {
    super("");
    this.message = `Driver '${driverName}' not found, it's likely not installed, try running 'npm install ${driverName}'`;
  }
}
