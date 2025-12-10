import type {
  MssqlDataSourceInput,
  MysqlSqlDataSourceInput,
  PostgresSqlDataSourceInput,
  SqliteDataSourceInput,
} from "../data_source/data_source_types";
import type {
  MssqlImport,
  Mysql2Import,
  PgImport,
  Sqlite3Import,
} from "../drivers/driver_types";
import { DriverFactory } from "../drivers/drivers_factory";
import { HysteriaError } from "../errors/hysteria_error";
import { SqlDataSource } from "./sql_data_source";
import {
  GetConnectionReturnType,
  SqlDataSourceInput,
  SqlDataSourceType,
  SqlDriverSpecificOptions,
  Sqlite3ConnectionOptions,
  SqlPoolType,
} from "./sql_data_source_types";

const getDriverConnection = async (type: SqlDataSourceType) => {
  const driver = (await DriverFactory.getDriver(type)).client;
  return driver;
};

export const createSqlPool = async <T extends SqlDataSourceType>(
  type: T,
  input?: SqlDataSourceInput<T>,
): Promise<SqlPoolType> => {
  const driver = await getDriverConnection(type);
  switch (type) {
    case "mariadb":
    case "mysql":
      const mysqlInput = input as MysqlSqlDataSourceInput & {
        driverOptions?: SqlDriverSpecificOptions<"mysql" | "mariadb">;
      };

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
      const pgInput = input as PostgresSqlDataSourceInput & {
        driverOptions?: SqlDriverSpecificOptions<"postgres" | "cockroachdb">;
      };
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
      const sqliteInput = input as SqliteDataSourceInput & {
        driverOptions?: Sqlite3ConnectionOptions;
      };

      const database = sqliteInput?.database as string;
      const sqlitePool = new sqliteDriver.Database(
        database,
        sqliteInput?.driverOptions?.mode ?? undefined,
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
    case "mssql":
      const mssqlDriver = driver as MssqlImport;
      const mssqlInput = input as MssqlDataSourceInput & {
        driverOptions?: SqlDriverSpecificOptions<"mssql">;
      };

      const { options, ...rest } = mssqlInput.driverOptions ?? {};
      const mssqlPool = await mssqlDriver.connect({
        server: mssqlInput.host ?? "localhost",
        port: mssqlInput.port,
        database: mssqlInput.database,
        user: mssqlInput.username,
        password: mssqlInput.password,
        ...rest,
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true,
          ...options,
          // todo mark those as implicit and required on the documentation and also make those not selectable by the user
          abortTransactionOnError: false,
          enableImplicitTransactions: true,
        },
      });

      return mssqlPool;
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
    case "mssql":
      return sqlDataSource.getConnection("mssql");
    default:
      throw new HysteriaError(
        "SqlConnectionUtils::createSqlConnection",
        `UNSUPPORTED_DATABASE_TYPE_${type}`,
      );
  }
};
