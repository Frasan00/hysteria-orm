import { DataSourceInput, DataSourceType } from "../data_source";
import {
  DriverSpecificOptions,
  Mysql2Import,
  PgImport,
  Sqlite3Import,
} from "../drivers/driver_constants";
import { Model } from "./models/model";
import { MysqlModelManager } from "./mysql/mysql_model_manager";
import { PostgresModelManager } from "./postgres/postgres_model_manager";
import { SqliteModelManager } from "./sqlite/sql_lite_model_manager";

export type SqlDriverSpecificOptions = Omit<
  DriverSpecificOptions,
  "mongoOptions" | "redisOptions"
>;

export type ModelManager<T extends Model> =
  | MysqlModelManager<T>
  | PostgresModelManager<T>
  | SqliteModelManager<T>;

export type MysqlConnectionInstance = Awaited<
  ReturnType<Mysql2Import["createConnection"]>
>;
export type PgClientInstance = InstanceType<PgImport["Client"]>;
export type SqliteConnectionInstance = InstanceType<Sqlite3Import["Database"]>;

export type SqlConnectionType =
  | MysqlConnectionInstance
  | PgClientInstance
  | SqliteConnectionInstance;

export interface ISqlDataSourceInput extends DataSourceInput {
  type: Exclude<DataSourceType, "mongo">;
}

export type SqlDataSourceInput = Exclude<ISqlDataSourceInput, "mongoOptions">;

export type SqlDataSourceType = SqlDataSourceInput["type"];
