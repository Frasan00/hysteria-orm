import {
  MysqlSqlDataSourceInput,
  PostgresSqlDataSourceInput,
} from "../data_source/data_source_types";
import {
  Mysql2Import,
  PgImport,
  Sqlite3Import,
} from "../drivers/driver_constants";
import { DriverFactory } from "../drivers/drivers_factory";
import { log, logMessage } from "../utils/logger";
import { parseTimeZone } from "../utils/timezone";
import {
  SqlConnectionType,
  SqlDataSourceInput,
  SqlDataSourceType,
} from "./sql_data_source_types";
import { execSql } from "./sql_runner/sql_runner";

const getDriverConnection = async (type: SqlDataSourceType) => {
  const driver = (await DriverFactory.getDriver(type)).client;
  return driver;
};

export const createSqlConnection = async (
  type: SqlDataSourceType,
  input: SqlDataSourceInput,
): Promise<SqlConnectionType> => {
  const driver = await getDriverConnection(type);
  const timezone = parseTimeZone(type, input.timezone || "UTC");
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
        timezone: timezone,
      });
      await execSql("SELECT 1", [], type, mysqlPool);
      return mysqlPool;
    case "postgres":
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

      pgPool.on("connect", async (client) => {
        const query = `SET TIME ZONE '${timezone}'`;
        log(query, input.logs || false);
        await client.query(query);
        logMessage(`Timezone set to: ${timezone}`, "info", input.logs);
      });

      await execSql("SELECT 1", [], type, pgPool);

      return pgPool;
    case "sqlite":
      const sqliteDriver = driver as Sqlite3Import;
      const database = input.database as string;
      const sqlitePool = new sqliteDriver.Database(
        database,
        sqliteDriver.OPEN_READWRITE | sqliteDriver.OPEN_CREATE,
        (err) => {
          if (err) {
            throw new Error(`Error while connecting to sqlite: ${err}`);
          }
        },
        // TODO: Add retry with execSql
      );
      await new Promise((resolve) =>
        sqlitePool.run("SELECT 1", (err) => {
          if (err) {
            throw new Error(`Error while connecting to sqlite: ${err}`);
          }

          resolve(true);
        }),
      );
      return sqlitePool;
    default:
      throw new Error(`Unsupported data source type: ${type}`);
  }
};
