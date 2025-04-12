export type Mysql2Import = typeof import("mysql2/promise");
export type PgImport = typeof import("pg");
export type Sqlite3Import = typeof import("sqlite3");
export type MongoClientImport = typeof import("mongodb");
export type RedisImport = typeof import("ioredis");

type ExcludeStringFromOptions<T> = T extends string ? never : T;

export type MysqlCreateConnectionOptions = Parameters<
  Mysql2Import["createPool"]
>[0];

export type PgClientOptions = ExcludeStringFromOptions<
  ConstructorParameters<PgImport["Pool"]>[0]
>;

export type MongoConnectionOptions =
  | ConstructorParameters<MongoClientImport["MongoClient"]>[0]
  | ConstructorParameters<MongoClientImport["MongoClient"]>[1];
export type RedisOptions = ConstructorParameters<RedisImport["default"]>; // TODO: This is not correct, but it's a start

export type DriverSpecificOptions = {
  mysqlOptions?: MysqlCreateConnectionOptions;
  pgOptions?: PgClientOptions;
  mongoOptions?: MongoConnectionOptions;
  redisOptions?: RedisOptions;
};

export type DriverImport =
  | Mysql2Import
  | PgImport
  | Sqlite3Import
  | MongoClientImport
  | RedisImport;

export class DriverNotFoundError extends Error {
  constructor(driverName: string) {
    super("");
    this.message = `Driver '${driverName}' not found, it's likely not installed, try running 'npm install ${driverName}'`;
  }
}
