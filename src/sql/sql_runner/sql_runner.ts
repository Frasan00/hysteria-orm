import { PassThrough } from "node:stream";
import { loadPlatform } from "../../platform/platform_adapter";
import { HysteriaError } from "../../errors/hysteria_error";
import { log, logMessage, type LoggerConfig } from "../../utils/logger";
import { Model } from "../models/model";
import { StreamOptions } from "../query_builder/query_builder_types";
import { SqlDataSource } from "../sql_data_source";
import {
  ConnectionPolicies,
  GetConnectionReturnType,
  SqlDataSourceType,
} from "../sql_data_source_types";
import {
  Returning,
  SqlLiteOptions,
  SqlRunnerReturnType,
  RawQueryResponseType,
} from "./sql_runner_types";
import {
  deriveOperationFromQuery,
  QueryContext,
  ObserverChain,
} from "../../sql/observers/observer";
import type { DriverAdapter } from "../../drivers/driver_adapter";

const platform = loadPlatform();

function formatDuration(start: number): number {
  const duration = platform.timing.now() - start;
  return Math.round(duration * 100) / 100;
}

export const execSql = async <
  S extends SqlDataSource,
  M extends Model,
  T extends Returning,
  D extends SqlDataSourceType = ReturnType<S["getDbType"]>,
>(
  query: string,
  params: any[],
  sqlDataSource: S,
  sqlType: D,
  returning: T = "rows" as T,
  options?: {
    sqlLiteOptions?: SqlLiteOptions<M>;
    shouldNotLog?: boolean;
  },
): Promise<SqlRunnerReturnType<T, D>> => {
  await sqlDataSource.ensureConnected();

  // Prepare and fire before-query observers if any
  const context: QueryContext = {
    id: platform.crypto.randomUUID(),
    sql: query,
    params,
    model: undefined,
    operation: deriveOperationFromQuery(query),
    timestamp: platform.timing.now(),
  };

  try {
    const chain = sqlDataSource.observerChain as ObserverChain | undefined;
    if (chain && typeof chain.notifyBefore === "function") {
      await chain.notifyBefore(context);
    }
  } catch {
    // ignore observer errors during before phase to not block query
  }

  const start = platform.timing.now();

  const logQuery = (durationMs?: number) => {
    if (options?.shouldNotLog) {
      return;
    }
    log(
      query,
      sqlDataSource.logs,
      params,
      sqlDataSource.inputDetails.queryFormatOptions,
      sqlType,
      durationMs,
    );
  };

  try {
    const adapter = sqlDataSource.driverAdapter as DriverAdapter<D>;
    if (!adapter) {
      throw new HysteriaError("ExecSql", `CONNECTION_NOT_ESTABLISHED`);
    }

    const result = await withRetry(
      () =>
        adapter.execute(query, params, {
          returning,
          sqlLiteOptions: options?.sqlLiteOptions,
          connection: sqlDataSource.sqlConnection as
            | GetConnectionReturnType<D>
            | undefined,
        }),
      sqlDataSource.inputDetails.connectionPolicies?.retry,
      sqlDataSource.logs,
    );

    // After-query observers
    try {
      const duration = formatDuration(start);
      const chain = sqlDataSource.observerChain as ObserverChain | undefined;
      if (chain && typeof chain.notifyAfter === "function") {
        const afterCtx = { ...context, duration, result };
        await chain.notifyAfter(afterCtx);
      }
    } catch {
      // ignore observer errors in after phase
    }

    logQuery(formatDuration(start));
    return adapter.extract<T>(result, returning);
  } catch (error) {
    logQuery(formatDuration(start));
    throw error;
  }
};

export const execSqlStreaming = async <
  M extends Model,
  T extends "generator" | "stream" = "generator",
  S extends Record<string, any> = {},
  R extends Record<string, any> = {},
>(
  query: string,
  params: any[],
  sqlDataSource: SqlDataSource,
  options: StreamOptions = {},
  events: {
    onData?: (
      passThrough: PassThrough & AsyncGenerator<M & S & R>,
      row: any,
    ) => void | Promise<void>;
  },
): Promise<PassThrough & AsyncGenerator<M & S & R>> => {
  const adapter = sqlDataSource.driverAdapter;
  if (!adapter) {
    throw new HysteriaError("ExecSqlStreaming", "CONNECTION_NOT_ESTABLISHED");
  }

  const stream = await adapter.stream(
    query,
    params,
    {
      ...options,
      connection: sqlDataSource.sqlConnection ?? undefined,
    },
    {
      onData: events.onData as (
        passThrough: PassThrough & AsyncGenerator<Record<string, unknown>>,
        row: unknown,
      ) => void | Promise<void>,
    },
  );

  return stream as unknown as PassThrough & AsyncGenerator<M & S & R>;
};

async function withRetry<T>(
  fn: () => Promise<T>,
  retryConfig: ConnectionPolicies["retry"] = { maxRetries: 0, delay: 0 },
  logs: boolean | LoggerConfig = false,
): Promise<T> {
  let retries = 0;
  const maxRetries = retryConfig.maxRetries || 0;
  const delay = retryConfig.delay || 0;

  async function attempt(): Promise<T> {
    try {
      return fn();
    } catch (err: any) {
      if (
        !Object.prototype.hasOwnProperty.call(err, "code") ||
        err.code !== "ECONNREFUSED"
      ) {
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
