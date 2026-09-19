import { PassThrough } from "node:stream";
import type { CustomTypesConfig } from "pg";
import { DriverNotFoundError } from "../../driver_constants";
import type { PgImport } from "../../driver_types";
import type { Model } from "../../../sql/models/model";
import type { StreamOptions } from "../../../sql/query_builder/query_builder_types";
import type {
  GetConnectionReturnType,
  getPoolReturnType,
  SqlDataSourceInput,
  SqlDataSourceType,
} from "../../../sql/sql_data_source_types";
import type {
  RawQueryResponseType,
  Returning,
  SqlRunnerReturnType,
} from "../../../sql/sql_runner/sql_runner_types";
import type {
  BeginTransactionOptions,
  DriverAdapter,
  EndTransactionOptions,
  ExecuteOptions,
  StreamEvents,
} from "../../driver_adapter";

type PgDialect = "postgres" | "cockroachdb";

/**
 * @description node pg driver adapter (postgres | cockroachdb)
 * @description The `?`→`$N` placeholder rewrite is a pg-family protocol property and lives here, not in the runner
 */
export class PgDriverAdapter implements DriverAdapter<PgDialect> {
  readonly dialect: PgDialect;
  readonly jsEnvironment = "node" as const;
  pool: getPoolReturnType<PgDialect>;

  private client: PgImport;
  private input: SqlDataSourceInput<PgDialect>;

  constructor(
    dialect: PgDialect,
    input: SqlDataSourceInput<PgDialect>,
    client: PgImport,
  ) {
    this.dialect = dialect;
    this.client = client;
    this.input = input;

    // `coerceNumericTypes` is sugar over the pool's `types` hook: pg hands
    // every result column through `getTypeParser(oid, format)` unless the
    // caller supplies one, and its built-in parsers return decimal strings for
    // both int8 and numeric. Only the text format is overridden — pg never
    // requests binary for these types by default, and a binary buffer is not
    // what these parsers accept.
    //
    // A caller-supplied `driverOptions.types` is the lower-level escape hatch
    // and wins outright: the flag is skipped rather than layered on top, so the
    // shorthand can never silently replace the caller's parsers.
    const numericTypes: CustomTypesConfig | undefined =
      input.coerceNumericTypes && !input.driverOptions?.types
        ? {
            getTypeParser: (oid, format) => {
              const isText = !format || format === "text";
              if (isText && oid === 20) {
                return (value: string) => BigInt(value);
              }
              if (isText && oid === 1700) {
                return (value: string) => Number.parseFloat(value);
              }
              return client.types.getTypeParser(oid, format);
            },
          }
        : undefined;

    this.pool = new client.Pool({
      host: input.host,
      port: input.port,
      user: input.username,
      password: input.password,
      database: input.database,
      ...input.driverOptions,
      ...(numericTypes ? { types: numericTypes } : {}),
    });
  }

  createPool(): void {}

  async closePool(): Promise<void> {
    await this.pool.end();
  }

  async reserveConnection(): Promise<GetConnectionReturnType<PgDialect>> {
    return this.pool.connect();
  }

  releaseConnection(connection?: GetConnectionReturnType<PgDialect>): void {
    connection?.release();
  }

  async beginTransaction(
    connection: GetConnectionReturnType<PgDialect>,
    options: BeginTransactionOptions<PgDialect>,
  ): Promise<void> {
    await options.rawQuery("BEGIN TRANSACTION");
    if (options.isolationLevel) {
      await options.rawQuery(
        `SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`,
      );
    }
  }

  async commitTransaction(
    _connection: GetConnectionReturnType<PgDialect>,
    options: EndTransactionOptions<PgDialect>,
  ): Promise<void> {
    await options.rawQuery("COMMIT");
  }

  async rollbackTransaction(
    _connection: GetConnectionReturnType<PgDialect>,
    options: EndTransactionOptions<PgDialect>,
  ): Promise<void> {
    await options.rawQuery("ROLLBACK");
  }

  async execute(
    query: string,
    params: unknown[],
    options: ExecuteOptions<PgDialect, Model>,
  ): Promise<RawQueryResponseType<PgDialect>> {
    let pgParamIdx = 0;
    const pgQuery = query.replace(/\?/g, () => `$${++pgParamIdx}`);
    const driver =
      (options.connection as GetConnectionReturnType<PgDialect>) ?? this.pool;
    return driver.query(pgQuery, params);
  }

  extract<T extends Returning>(
    raw: RawQueryResponseType<PgDialect>,
    returning: T,
  ): SqlRunnerReturnType<T, PgDialect> {
    if (returning === "rows") {
      return raw.rows as SqlRunnerReturnType<T, PgDialect>;
    }
    if (returning === "raw") {
      return raw as SqlRunnerReturnType<T, PgDialect>;
    }
    return raw.rowCount as number as SqlRunnerReturnType<T, PgDialect>;
  }

  async stream(
    query: string,
    params: unknown[],
    options: StreamOptions & {
      connection?: GetConnectionReturnType<PgDialect>;
    },
    events: StreamEvents,
  ): Promise<PassThrough & AsyncGenerator<Record<string, unknown>>> {
    const transactionConnection = options.connection;
    const ownsConnection = !transactionConnection;
    const pgDriver = transactionConnection ?? (await this.pool.connect());

    const pgQueryStream = await import("pg-query-stream").catch(() => {
      throw new DriverNotFoundError("pg-query-stream");
    });

    const passThrough = new PassThrough({
      objectMode: options.objectMode || true,
      highWaterMark: options.highWaterMark,
    }) as PassThrough & AsyncGenerator<Record<string, unknown>>;

    let pgStreamParamIdx = 0;
    const pgStreamQuery = query.replace(/\?/g, () => `$${++pgStreamParamIdx}`);

    const streamQuery = new pgQueryStream.default(pgStreamQuery, params, {
      highWaterMark: options.highWaterMark,
      rowMode: options.rowMode,
      batchSize: options.batchSize,
      types: options.types,
    });

    const pgStream = pgDriver.query(streamQuery);

    let pending = 0;
    let ended = false;
    let hasError = false;

    const tryRelease = (err?: unknown) => {
      if (!ownsConnection) return;
      try {
        (pgDriver as { release(err?: unknown): void }).release(err as Error);
      } catch {
        // already released
      }
    };

    pgStream.on("data", (row: any) => {
      if (events.onData) {
        pending++;
        Promise.resolve(
          (events.onData as (...args: any[]) => any)(passThrough, row),
        )
          .then(() => {
            pending--;
            if (ended && pending === 0 && !hasError) {
              tryRelease();
              passThrough.end();
            }
          })
          .catch((err: unknown) => {
            hasError = true;
            tryRelease(err);
            passThrough.destroy(err as Error);
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

    pgStream.on("error", (err: Error) => {
      hasError = true;
      tryRelease(err);
      passThrough.destroy(err);
    });

    return passThrough;
  }
}
