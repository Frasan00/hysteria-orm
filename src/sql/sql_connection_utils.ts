import type {
  MysqlSqlDataSourceInput,
  PostgresSqlDataSourceInput,
} from "../data_source/data_source_types";
import {
  Mysql2Import,
  PgImport,
  Sqlite3Import,
} from "../drivers/driver_constants";
import { DriverFactory } from "../drivers/drivers_factory";
import { HysteriaError } from "../errors/hysteria_error";
import {
  GetConnectionReturnType,
  SqlDataSourceInput,
  SqlDataSourceType,
  SqlPoolType,
} from "./sql_data_source_types";
import { SqlDataSource } from "./sql_data_source";

const getDriverConnection = async (type: SqlDataSourceType) => {
  const driver = (await DriverFactory.getDriver(type)).client;
  return driver;
};

export const createSqlPool = async (
  type: SqlDataSourceType,
  input?: SqlDataSourceInput,
): Promise<SqlPoolType> => {
  const driver = await getDriverConnection(type);
  switch (type) {
    case "mariadb":
    case "mysql":
      const mysqlInput = input as MysqlSqlDataSourceInput;
      const mysqlDriver = driver as Mysql2Import;
      const mysqlPool = mysqlDriver.createPool({
        host: mysqlInput.host,
        port: mysqlInput.port,
        user: mysqlInput.username,
        password: mysqlInput.password,
        database: mysqlInput.database,
        ...mysqlInput?.driverOptions,
      });
      return mysqlPool;
    case "postgres":
    case "cockroachdb":
      const pgInput = input as PostgresSqlDataSourceInput;
      const pgDriver = driver as PgImport;
      const pgPool = new pgDriver.Pool({
        host: pgInput.host,
        port: pgInput.port,
        user: pgInput.username,
        password: pgInput.password,
        database: pgInput.database,
        ...pgInput?.driverOptions,
      });

      return pgPool;
    case "sqlite":
      const sqliteDriver = driver as Sqlite3Import;
      const database = input?.database as string;
      const sqlitePool = new sqliteDriver.Database(
        database,
        sqliteDriver.OPEN_READWRITE | sqliteDriver.OPEN_CREATE,
        (err) => {
          if (err) {
            throw new HysteriaError(
              "SqliteDataSource::createSqlPool",
              "CONNECTION_NOT_ESTABLISHED",
            );
          }
        },
      );
      return sqlitePool;
    default:
      throw new HysteriaError(
        "SqlConnectionUtils::createSqlPool",
        `UNSUPPORTED_DATABASE_TYPE_${type}`,
      );
  }
};

export const createSqlConnection = async (
  type: SqlDataSourceType,
  sqlDataSource: SqlDataSource,
): Promise<GetConnectionReturnType> => {
  switch (type) {
    case "mariadb":
    case "mysql":
      return sqlDataSource.getConnection("mysql");
    case "postgres":
    case "cockroachdb":
      return sqlDataSource.getConnection("postgres");
    case "sqlite":
      return sqlDataSource.getConnection("sqlite");
    default:
      throw new HysteriaError(
        "SqlConnectionUtils::createSqlConnection",
        `UNSUPPORTED_DATABASE_TYPE_${type}`,
      );
  }
};
