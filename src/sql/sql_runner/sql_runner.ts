import { format } from "sql-formatter";
import { log, logMessage } from "../../utils/logger";
import {
  ConnectionPolicies,
  MysqlConnectionInstance,
  PgPoolClientInstance,
  SqlConnectionType,
  SqlDataSourceType,
} from "../sql_data_source_types";
import { convertPlaceHolderToValue } from "../../utils/placeholder";

export function getSqlDialect(
  sqlType: SqlDataSourceType,
): "mysql" | "postgresql" | "sqlite" | "mariadb" | "sql" {
  switch (sqlType) {
    case "mysql":
      return "mysql";

    case "mariadb":
      return "mariadb";

    case "postgres":
      return "postgresql";

    case "sqlite":
      return "sqlite";

    default:
      return "sql";
  }
}

export async function execSql(
  query: string,
  params: any[],
  sqlType: SqlDataSourceType,
  sqlDriver: SqlConnectionType,
  logs: boolean = false,
): Promise<any> {
  query = convertPlaceHolderToValue(sqlType, query);
  query = format(query, {
    language: getSqlDialect(sqlType),
  });

  log(query, logs, params);
  switch (sqlType) {
    // TODO; add sqlinstance here
    case "mysql":
    case "mariadb":
      const mysqlConnection = sqlDriver as MysqlConnectionInstance;
      return withRetry(() => mysqlConnection.query(query, params), {}, logs);

    case "postgres":
      const pgConnection = sqlDriver as PgPoolClientInstance;
      return withRetry(() => pgConnection.query(query, params), {}, logs);

    case "sqlite":
      throw new Error("Cannot use execSql with sqlite");

    default:
      throw new Error("Unsupported database type");
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retryConfig: ConnectionPolicies["retry"] = { maxRetries: 3, delay: 1000 },
  logs: boolean = false,
): Promise<T> {
  let retries = 0;
  const maxRetries = retryConfig.maxRetries || 3;
  const delay = retryConfig.delay || 1000;

  async function attempt(): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      if (!Object.hasOwn(err, "code") || err.code !== "ECONNREFUSED") {
        throw err;
      }

      if (retries < maxRetries) {
        retries++;
        logMessage(
          `Retrying sql in ${delay}ms (attempt ${retries}/${maxRetries})`,
          "info",
          logs,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return attempt();
      }

      throw err;
    }
  }

  return attempt();
}
