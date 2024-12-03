import { PoolOptions } from "mysql2";
import { PoolConfig } from "pg";
import { MongoClientOptions } from "mongodb";
import { RedisOptions } from "ioredis";

export type DriverSpecificOptions = {
  mysqlOptions?: PoolOptions;
  pgOptions?: PoolConfig;
  mongoOptions?: MongoClientOptions;
  redisOptions: RedisOptions;
};

export type Mysql2Import = typeof import("mysql2/promise");
export type PgImport = typeof import("pg");
export type Sqlite3Import = typeof import("sqlite3");
export type MongoClientImport = typeof import("mongodb");
export type RedisImport = typeof import("ioredis");

export type DriverImport =
  | Mysql2Import
  | PgImport
  | Sqlite3Import
  | MongoClientImport
  | RedisImport;

export class DriverNotFoundError extends Error {
  constructor(driverName: string) {
    super(driverName);
    this.name = `Driver ${driverName} not found, it's likely not installed, try running npm install ${driverName}`;
  }
}
