import {
  DataSourceType,
  MysqlSqlDataSourceInput,
  NotNullableMysqlSqlDataSourceInput,
  NotNullablePostgresSqlDataSourceInput,
  NotNullableSqliteDataSourceInput,
  PostgresSqlDataSourceInput,
  SqliteDataSourceInput,
} from "../data_source/data_source_types";
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
  ReturnType<Mysql2Import["createPool"]>
>;
export type PgPoolClientInstance = InstanceType<PgImport["Pool"]>;

export type SqliteConnectionInstance = InstanceType<Sqlite3Import["Database"]>;

export type SqlConnectionType =
  | MysqlConnectionInstance
  | PgPoolClientInstance
  | SqliteConnectionInstance;

/**
 * @description The connection policies for the sql data source
 */
export type ConnectionPolicies = {
  retry?: {
    maxRetries?: number;
    delay?: number;
  };
};

type FixedTimeZone = `+${number}:${number}` | `-${number}:${number}`;
type CountryTimezone = `${string}/${string}`;
export type Timezone = "UTC" | "LOCAL" | FixedTimeZone | CountryTimezone;

/**
 * @description The input type for the SqlDataSource constructor
 * @description The connectionPolicies object is used to configure the connection policies for the sql data source
 */
export type SqlDataSourceInput = {
  readonly type: Exclude<DataSourceType, "mongo">;
  /**
   * @description Whether to log the sql queries and other debug information
   */
  readonly logs?: boolean;
  /**
   * @description The timezone to use for the sql data source, default is "UTC"
   */
  readonly timezone?: Timezone;
  /**
   * @description The connection policies to use for the sql data source that are not configured in the driverOptions
   */
  readonly connectionPolicies?: ConnectionPolicies;
} & (
  | MysqlSqlDataSourceInput
  | PostgresSqlDataSourceInput
  | SqliteDataSourceInput
);

export type UseConnectionInput = {
  readonly type: Exclude<DataSourceType, "mongo">;
  readonly logs?: boolean;
  readonly timezone?: Timezone;
  readonly connectionPolicies?: ConnectionPolicies;
} & (
  | NotNullableMysqlSqlDataSourceInput
  | NotNullablePostgresSqlDataSourceInput
  | NotNullableSqliteDataSourceInput
);

export type SqlDataSourceType = Exclude<DataSourceType, "mongo">;

export type GetCurrentConnectionReturnType<T = SqlDataSourceType> =
  T extends "mysql"
    ? MysqlConnectionInstance
    : T extends "mariadb"
      ? MysqlConnectionInstance
      : T extends "postgres"
        ? PgPoolClientInstance
        : T extends "sqlite"
          ? SqliteConnectionInstance
          : never;
