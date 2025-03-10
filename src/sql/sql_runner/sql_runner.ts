import { format } from "sql-formatter";
import { log, logMessage } from "../../utils/logger";
import {
  ConnectionPolicies,
  SqlDataSourceType,
} from "../sql_data_source_types";
import { convertPlaceHolderToValue } from "../../utils/placeholder";
import { SqlDataSource } from "../sql_data_source";
import { HysteriaError } from "../../errors/hysteria_error";
import {
  Returning,
  SqlLiteOptions,
  SqlRunnerReturnType,
} from "./sql_runner_types";
import { Model } from "../models/model";
import { promisifySqliteQuery } from "./sql_runner_utils";

export const getSqlDialect = (
  sqlType: SqlDataSourceType,
): "mysql" | "postgresql" | "sqlite" | "mariadb" | "sql" => {
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
};

export const execSql = async <M extends Model, T extends Returning>(
  query: string,
  params: any[],
  sqlDataSource: SqlDataSource,
  returning: T = "raw" as T,
  options?: {
    sqlLiteOptions?: SqlLiteOptions<M>;
  },
): Promise<SqlRunnerReturnType<T>> => {
  const sqlType = sqlDataSource.type as SqlDataSourceType;
  query = convertPlaceHolderToValue(sqlType, query);
  query = format(query, {
    language: getSqlDialect(sqlType),
  });

  log(query, sqlDataSource.logs, params);
  switch (sqlType) {
    case "mysql":
    case "mariadb":
      const mysqlDriver = sqlDataSource.getCurrentDriverConnection("mysql");
      const [mysqlResult] = await withRetry(
        () => mysqlDriver.query(query, params),
        sqlDataSource.retryPolicy,
        sqlDataSource.logs,
      );

      if (returning === "affectedRows") {
        return (mysqlResult as { affectedRows: number })
          .affectedRows as SqlRunnerReturnType<T>;
      }

      return mysqlResult as SqlRunnerReturnType<T>;
    case "postgres":
      const pgDriver = sqlDataSource.getCurrentDriverConnection("postgres");
      const pgResult = await withRetry(
        () => pgDriver.query(query, params),
        sqlDataSource.retryPolicy,
        sqlDataSource.logs,
      );

      if (returning === "raw") {
        return pgResult.rows as SqlRunnerReturnType<T>;
      }

      return pgResult.rowCount as number as SqlRunnerReturnType<T>;
    case "sqlite":
      const result = await promisifySqliteQuery<M>(
        query,
        params,
        sqlDataSource,
        {
          typeofModel: options?.sqlLiteOptions?.typeofModel,
          mode: options?.sqlLiteOptions?.mode || "fetch",
          models: options?.sqlLiteOptions?.models,
        },
      );

      if (returning === "raw") {
        return !Array.isArray(result)
          ? ([result] as SqlRunnerReturnType<T>)
          : (result as SqlRunnerReturnType<T>);
      }

      return result as SqlRunnerReturnType<T>;
    default:
      throw new HysteriaError(
        "ExecSql",
        `UNSUPPORTED_DATABASE_TYPE_${sqlType}`,
      );
  }
};

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
