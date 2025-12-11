import { PassThrough } from "node:stream";
import { DriverNotFoundError } from "../../drivers/driver_constants";
import { HysteriaError } from "../../errors/hysteria_error";
import { log, logMessage } from "../../utils/logger";
import { Model } from "../models/model";
import { AnnotatedModel } from "../models/model_query_builder/model_query_builder_types";
import { StreamOptions } from "../query_builder/query_builder_types";
import { SqlDataSource } from "../sql_data_source";
import {
  ConnectionPolicies,
  GetConnectionReturnType,
  MssqlPoolInstance,
  MysqlConnectionInstance,
  PgPoolClientInstance,
  SqlDataSourceType,
} from "../sql_data_source_types";
import {
  Returning,
  SqlLiteOptions,
  SqlRunnerReturnType,
} from "./sql_runner_types";
import { promisifySqliteQuery, SQLiteStream } from "./sql_runner_utils";
import {
  convertDateStringToDateForOracle,
  processOracleRow,
} from "../../utils/oracle_utils";

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
  if (!options?.shouldNotLog) {
    log(query, sqlDataSource.logs, params);
  }

  switch (sqlType) {
    case "mysql":
    case "mariadb":
      const mysqlDriver =
        (sqlDataSource.sqlConnection as GetConnectionReturnType<"mysql">) ??
        sqlDataSource.getPool();

      const mysqlResult = await withRetry(
        () => mysqlDriver.query(query, params),
        sqlDataSource.inputDetails.connectionPolicies?.retry,
        sqlDataSource.logs,
      );

      if (returning === "affectedRows") {
        return (mysqlResult[0] as { affectedRows: number })
          .affectedRows as SqlRunnerReturnType<T, D>;
      }

      if (returning === "raw") {
        return mysqlResult as SqlRunnerReturnType<T, D>;
      }

      return mysqlResult[0] as SqlRunnerReturnType<T, D>;
    case "postgres":
    case "cockroachdb":
      const pgDriver =
        (sqlDataSource.sqlConnection as GetConnectionReturnType<"postgres">) ??
        sqlDataSource.getPool();

      const pgResult = await withRetry(
        () => pgDriver.query(query, params),
        sqlDataSource.inputDetails.connectionPolicies?.retry,
        sqlDataSource.logs,
      );

      if (returning === "rows") {
        return pgResult.rows as SqlRunnerReturnType<T, D>;
      }

      if (returning === "raw") {
        return pgResult as SqlRunnerReturnType<T, D>;
      }

      return pgResult.rowCount as number as SqlRunnerReturnType<T, D>;
    case "sqlite":
      const sqliteResult = await withRetry(
        () =>
          promisifySqliteQuery<M>(query, params, sqlDataSource, {
            typeofModel: options?.sqlLiteOptions?.typeofModel,
            mode: options?.sqlLiteOptions?.mode || "fetch",
            models: options?.sqlLiteOptions?.models,
          }),
        sqlDataSource.inputDetails.connectionPolicies?.retry,
        sqlDataSource.logs,
      );

      if (returning === "raw") {
        return !Array.isArray(sqliteResult)
          ? ([sqliteResult] as SqlRunnerReturnType<T, D>)
          : (sqliteResult as SqlRunnerReturnType<T, D>);
      }

      return sqliteResult as SqlRunnerReturnType<T, D>;
    case "mssql":
      const mssqlPool = sqlDataSource.getPool() as MssqlPoolInstance;
      const mssqlRequest = sqlDataSource.sqlConnection
        ? (
            sqlDataSource.sqlConnection as GetConnectionReturnType<"mssql">
          ).request()
        : mssqlPool.request();

      params.forEach((param, index) => {
        mssqlRequest.input(`p${index}`, param);
      });

      let mssqlParamIdx = 0;
      const mssqlQuery = query.replace(
        /\?|@(\d+)/g,
        () => `@p${mssqlParamIdx++}`,
      );

      const mssqlResult = await withRetry(
        () => mssqlRequest.query(mssqlQuery),
        sqlDataSource.inputDetails.connectionPolicies?.retry,
        sqlDataSource.logs,
      );

      if (returning === "affectedRows") {
        return mssqlResult.rowsAffected[0] as SqlRunnerReturnType<T, D>;
      }

      if (returning === "raw") {
        return mssqlResult as SqlRunnerReturnType<T, D>;
      }

      return mssqlResult.recordset as SqlRunnerReturnType<T, D>;
    case "oracledb":
      const ORACLE_OUT_FORMAT_OBJECT = 4002 as const;

      let oracledbConnection: GetConnectionReturnType<"oracledb"> | null = null;
      const isInTransaction = !!sqlDataSource.sqlConnection;
      try {
        oracledbConnection = sqlDataSource.sqlConnection
          ? (sqlDataSource.sqlConnection as GetConnectionReturnType<"oracledb">)
          : ((await sqlDataSource.getConnection()) as GetConnectionReturnType<"oracledb">);

        const oracleParams = params.map(convertDateStringToDateForOracle);

        const oracledbResult = await withRetry(
          () =>
            (oracledbConnection as GetConnectionReturnType<"oracledb">).execute(
              query,
              oracleParams,
              {
                outFormat: ORACLE_OUT_FORMAT_OBJECT,
                autoCommit: !isInTransaction,
              },
            ),
          sqlDataSource.inputDetails.connectionPolicies?.retry,
          sqlDataSource.logs,
        );

        if (returning === "affectedRows") {
          return oracledbResult.rowsAffected as SqlRunnerReturnType<T, D>;
        }

        if (returning === "raw") {
          return oracledbResult as SqlRunnerReturnType<T, D>;
        }

        // Oracle returns column names in UPPERCASE - normalize to lowercase
        // Also convert any Lob objects (CLOB/BLOB) to strings/buffers
        const normalizedRows = await Promise.all(
          (oracledbResult.rows as any[])?.map(async (row) => {
            const processedRow = await processOracleRow(row);
            const normalizedRow: Record<string, any> = {};
            for (const key in processedRow) {
              normalizedRow[key.toLowerCase()] = processedRow[key];
            }
            return normalizedRow;
          }) ?? [],
        );

        return normalizedRows as SqlRunnerReturnType<T, D>;
      } finally {
        if (oracledbConnection && !isInTransaction) {
          await oracledbConnection.close();
        }
      }
    default:
      throw new HysteriaError(
        "ExecSql",
        `UNSUPPORTED_DATABASE_TYPE_${sqlType}`,
      );
  }
};

export const execSqlStreaming = async <
  M extends Model,
  T extends "generator" | "stream" = "generator",
  A extends Record<string, any> = {},
  R extends Record<string, any> = {},
>(
  query: string,
  params: any[],
  sqlDataSource: SqlDataSource,
  options: StreamOptions = {},
  events: {
    onData?: (
      passThrough: PassThrough & AsyncGenerator<AnnotatedModel<M, A, R>>,
      row: any,
    ) => void | Promise<void>;
  },
): Promise<PassThrough & AsyncGenerator<AnnotatedModel<M, A, R>>> => {
  const sqlType = sqlDataSource.type as SqlDataSourceType;

  switch (sqlType) {
    case "mariadb":
    case "mysql": {
      const pool = sqlDataSource.getPool() as MysqlConnectionInstance;
      const conn =
        (sqlDataSource.sqlConnection as GetConnectionReturnType<"mysql">) ??
        (await pool.getConnection());
      const passThrough = new PassThrough({
        objectMode: options.objectMode ?? true,
        highWaterMark: options.highWaterMark,
      }) as PassThrough & AsyncGenerator<AnnotatedModel<M, A, R>>;

      const rawConn = conn.connection as any;
      const mysqlStream = rawConn.query(query, params).stream({
        highWaterMark: options.highWaterMark,
        objectMode: options.objectMode ?? true,
      });

      let pending = 0;
      let ended = false;
      let hasError = false;

      const tryRelease = () => {
        try {
          conn.release();
        } catch {}
      };

      mysqlStream.on("data", (row: any) => {
        if (events.onData) {
          pending++;
          Promise.resolve(events.onData(passThrough, row))
            .then(() => {
              pending--;
              if (ended && pending === 0 && !hasError) {
                tryRelease();
                passThrough.end();
              }
            })
            .catch((err: any) => {
              hasError = true;
              tryRelease();
              passThrough.destroy(err);
            });
          return;
        }

        passThrough.write(row);
      });

      mysqlStream.on("end", () => {
        ended = true;
        if (pending === 0 && !hasError) {
          tryRelease();
          passThrough.end();
        }
      });

      mysqlStream.on("error", (err: any) => {
        hasError = true;
        tryRelease();
        passThrough.destroy(err);
      });

      passThrough.on("close", () => {
        tryRelease();
      });

      return passThrough;
    }

    case "cockroachdb":
    case "postgres": {
      const pgPool = sqlDataSource.getPool() as PgPoolClientInstance;
      const pgDriver =
        (sqlDataSource.sqlConnection as GetConnectionReturnType<"postgres">) ??
        (await pgPool.connect());

      const pgQueryStreamDriver = await import("pg-query-stream").catch(() => {
        throw new DriverNotFoundError("pg-query-stream");
      });

      const passThrough = new PassThrough({
        objectMode: options.objectMode || true,
        highWaterMark: options.highWaterMark,
      }) as PassThrough & AsyncGenerator<AnnotatedModel<M, A, R>>;

      const streamQuery = new pgQueryStreamDriver.default(query, params, {
        highWaterMark: options.highWaterMark,
        rowMode: options.rowMode,
        batchSize: options.batchSize,
        types: options.types,
      });

      const pgStream = pgDriver.query(streamQuery);

      let pending = 0;
      let ended = false;
      let hasError = false;

      const tryRelease = (err?: any) => {
        try {
          pgDriver.release(err);
        } catch {}
      };

      pgStream.on("data", (row: any) => {
        if (events.onData) {
          pending++;
          Promise.resolve(events.onData(passThrough, row))
            .then(() => {
              pending--;
              if (ended && pending === 0 && !hasError) {
                tryRelease();
                passThrough.end();
              }
            })
            .catch((err: any) => {
              hasError = true;
              tryRelease(err);
              passThrough.destroy(err);
            });
          return;
        }

        passThrough.write(row);
      });

      pgStream.on("end", () => {
        ended = true;
        if (pending === 0 && !hasError) {
          tryRelease();
          passThrough.end();
        }
      });

      pgStream.on("error", (err: any) => {
        hasError = true;
        tryRelease(err);
        passThrough.destroy(err);
      });

      return passThrough;
    }

    case "sqlite": {
      const sqliteDriver =
        (sqlDataSource.sqlConnection as GetConnectionReturnType<"sqlite">) ??
        sqlDataSource.getPool();
      const stream = new SQLiteStream(sqliteDriver, query, params, {
        onData: events.onData as (
          _passThrough: any,
          row: any,
        ) => void | Promise<void>,
      });

      return stream as unknown as PassThrough &
        AsyncGenerator<AnnotatedModel<M, A, R>>;
    }

    case "mssql": {
      const mssqlDriver =
        (sqlDataSource.sqlConnection as GetConnectionReturnType<"mssql">) ??
        sqlDataSource.getPool();
      const passThrough = new PassThrough({
        objectMode: options.objectMode ?? true,
        highWaterMark: options.highWaterMark,
      }) as PassThrough & AsyncGenerator<AnnotatedModel<M, A, R>>;

      const mssqlRequest = mssqlDriver.request();
      mssqlRequest.stream = true;

      params.forEach((param, index) => {
        mssqlRequest.input(`p${index}`, param);
      });

      let mssqlParamIdx = 0;
      const mssqlQuery = query.replace(
        /\?|@(\d+)/g,
        () => `@p${mssqlParamIdx++}`,
      );

      let pending = 0;
      let ended = false;
      let hasError = false;

      mssqlRequest.on("row", (row: any) => {
        if (hasError) return;

        if (events.onData) {
          pending++;
          Promise.resolve(events.onData(passThrough, row))
            .then(() => {
              pending--;
              if (ended && pending === 0 && !hasError) {
                passThrough.end();
              }
            })
            .catch((err: any) => {
              hasError = true;
              passThrough.destroy(err);
            });
          return;
        }

        passThrough.write(row);
      });

      mssqlRequest.on("error", (err: any) => {
        hasError = true;
        passThrough.destroy(err);
      });

      mssqlRequest.on("done", () => {
        ended = true;
        if (pending === 0 && !hasError) {
          passThrough.end();
        }
      });

      mssqlRequest.query(mssqlQuery);

      return passThrough;
    }

    case "oracledb": {
      // OracleDB supports result set streaming via queryStream
      const oraclePool = sqlDataSource.getPool();
      const oracleConnection =
        (sqlDataSource.sqlConnection as GetConnectionReturnType<"oracledb">) ??
        (await (oraclePool as any).getConnection());

      const passThrough = new PassThrough({
        objectMode: options.objectMode ?? true,
        highWaterMark: options.highWaterMark,
      }) as PassThrough & AsyncGenerator<AnnotatedModel<M, A, R>>;

      const ORACLE_STREAM_OUT_FORMAT_OBJECT = 4002 as const;

      const oracleStreamParams = params.map(convertDateStringToDateForOracle);
      const oracleStream = oracleConnection.queryStream(
        query,
        oracleStreamParams,
        {
          outFormat: ORACLE_STREAM_OUT_FORMAT_OBJECT,
        },
      );

      let pending = 0;
      let ended = false;
      let hasError = false;

      const tryRelease = async () => {
        try {
          await oracleConnection.close();
        } catch {}
      };

      oracleStream.on("data", (row: any) => {
        if (hasError) return;

        // Oracle returns column names in UPPERCASE - normalize to lowercase
        const normalizedRow: Record<string, any> = {};
        for (const key in row) {
          normalizedRow[key.toLowerCase()] = row[key];
        }

        if (events.onData) {
          pending++;
          Promise.resolve(events.onData(passThrough, normalizedRow))
            .then(() => {
              pending--;
              if (ended && pending === 0 && !hasError) {
                tryRelease();
                passThrough.end();
              }
            })
            .catch((err: any) => {
              hasError = true;
              tryRelease();
              passThrough.destroy(err);
            });
          return;
        }

        passThrough.write(normalizedRow);
      });

      oracleStream.on("end", () => {
        ended = true;
        if (pending === 0 && !hasError) {
          tryRelease();
          passThrough.end();
        }
      });

      oracleStream.on("error", (err: any) => {
        hasError = true;
        tryRelease();
        passThrough.destroy(err);
      });

      return passThrough;
    }

    default:
      throw new HysteriaError(
        "ExecSqlStreaming",
        `UNSUPPORTED_DATABASE_TYPE_${sqlType}`,
      );
  }
};

async function withRetry<T>(
  fn: () => Promise<T>,
  retryConfig: ConnectionPolicies["retry"] = { maxRetries: 0, delay: 0 },
  logs: boolean = false,
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
