import { PassThrough } from "node:stream";
import type { MssqlImport } from "../../driver_types";
import { DriverNotFoundError } from "../../driver_constants";
import { env } from "../../../env/env";
import type { Model } from "../../../sql/models/model";
import type { StreamOptions } from "../../../sql/query_builder/query_builder_types";
import type {
  GetConnectionReturnType,
  getPoolReturnType,
  MssqlPoolInstance,
  SqlDataSourceInput,
} from "../../../sql/sql_data_source_types";
import type {
  RawQueryResponseType,
  Returning,
  SqlRunnerReturnType,
} from "../../../sql/sql_runner/sql_runner_types";
import { HysteriaError } from "../../../errors/hysteria_error";
import logger from "../../../utils/logger";
import type {
  BeginTransactionOptions,
  DriverAdapter,
  EndTransactionOptions,
  ExecuteOptions,
  StreamEvents,
} from "../../driver_adapter";

/**
 * @description node mssql driver adapter
 * @description TDS maps `?`/`@N` parameter markers to `@pN` named params — a protocol property, so it lives here
 */
export class MssqlDriverAdapter implements DriverAdapter<"mssql"> {
  readonly dialect = "mssql" as const;
  readonly jsEnvironment = "node" as const;
  pool: getPoolReturnType<"mssql">;

  private client: MssqlImport;
  private input: SqlDataSourceInput<"mssql">;

  /**
   * @description Transactions reserved from the pool and not yet finished. See
   * `releaseConnection` for why this has to be tracked.
   */
  private pendingTransactions = new Set<GetConnectionReturnType<"mssql">>();

  constructor(
    dialect: "mssql",
    input: SqlDataSourceInput<"mssql">,
    client: MssqlImport,
  ) {
    this.dialect = dialect;
    this.client = client;
    this.input = input;

    const driverOptions = input.driverOptions as {
      options?: Record<string, unknown>;
    };
    const { options, ...rest } = driverOptions ?? {};
    this.pool = new client.ConnectionPool({
      server: input.host ?? "localhost",
      port: input.port,
      database: input.database,
      user: input.username,
      password: input.password,
      ...rest,
      options: {
        trustServerCertificate: env.MSSQL_TRUST_SERVER_CERTIFICATE ?? undefined,
        ...options,
        abortTransactionOnError: false,
        enableImplicitTransactions: false,
      },
    }) as getPoolReturnType<"mssql">;
  }

  async createPool(): Promise<void> {
    await (this.pool as MssqlPoolInstance).connect();
  }

  async closePool(): Promise<void> {
    // A transaction nobody finished holds a pooled connection, and the pool will not
    // close cleanly while one is out. End them before closing.
    await this.endPendingTransactions();
    await (this.pool as MssqlPoolInstance).close();
  }

  async reserveConnection(): Promise<GetConnectionReturnType<"mssql">> {
    const transaction = await (this.pool as MssqlPoolInstance).transaction();
    this.pendingTransactions.add(transaction);
    return transaction;
  }

  /**
   * @description mssql hands out a Transaction that owns a pooled connection, and that
   * connection only returns to the pool when the transaction is committed or rolled
   * back. A commit or rollback that throws therefore strands the connection along with
   * whatever locks the transaction took, which shows up as an unrelated query blocking
   * until it times out. Ending the transaction here is what gives it back.
   */
  releaseConnection(
    connection?: GetConnectionReturnType<"mssql">,
    _error?: unknown,
  ): Promise<void> | void {
    // Not pending means it was already committed or rolled back, and released itself.
    if (!connection || !this.pendingTransactions.delete(connection)) {
      return;
    }

    return this.endTransaction(connection);
  }

  private async endPendingTransactions(): Promise<void> {
    const pending = [...this.pendingTransactions];
    this.pendingTransactions.clear();

    for (const transaction of pending) {
      await this.endTransaction(
        transaction as GetConnectionReturnType<"mssql">,
      );
    }
  }

  private async endTransaction(
    connection: GetConnectionReturnType<"mssql">,
  ): Promise<void> {
    try {
      await connection.rollback();
      return;
    } catch (rollbackError) {
      logger.error(
        rollbackError instanceof Error ? rollbackError : String(rollbackError),
      );
    }

    // The rollback failed and mssql exposes no other way to end a transaction. What
    // matters beyond the connection is the DB-side transaction holding its locks, so ask
    // the server to end it directly rather than through the method that just failed.
    // Without this the locks outlive the transaction and later queries block on them.
    try {
      await connection
        .request()
        .batch("IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION");
    } catch (recoveryError) {
      // Nothing further to try; the pool drops the connection when it closes.
      logger.error(
        recoveryError instanceof Error ? recoveryError : String(recoveryError),
      );
    }
  }

  async beginTransaction(
    connection: GetConnectionReturnType<"mssql">,
    options: BeginTransactionOptions<"mssql">,
  ): Promise<void> {
    if (options.isolationLevel) {
      const level = await this.getMssqlTransactionLevel(options.isolationLevel);
      await connection.begin(level);
      return;
    }
    await connection.begin();
  }

  async commitTransaction(
    connection: GetConnectionReturnType<"mssql">,
    _options: EndTransactionOptions<"mssql">,
  ): Promise<void> {
    await connection.commit();
    // Done means mssql returned the connection itself, so releaseConnection has nothing
    // left to do. Only a transaction that is still pending needs ending there.
    this.pendingTransactions.delete(connection);
  }

  async rollbackTransaction(
    connection: GetConnectionReturnType<"mssql">,
    _options: EndTransactionOptions<"mssql">,
  ): Promise<void> {
    await connection.rollback();
    this.pendingTransactions.delete(connection);
  }

  async execute(
    query: string,
    params: unknown[],
    options: ExecuteOptions<"mssql", Model>,
  ): Promise<RawQueryResponseType<"mssql">> {
    const pool = this.pool as MssqlPoolInstance;
    const mssqlRequest = options.connection
      ? (options.connection as GetConnectionReturnType<"mssql">).request()
      : pool.request();

    params.forEach((param, index) => {
      mssqlRequest.input(`p${index}`, param as any);
    });

    let mssqlParamIdx = 0;
    const mssqlQuery = query.replace(
      /\?|@(\d+)/g,
      () => `@p${mssqlParamIdx++}`,
    );

    if (options.signal) {
      const onAbort = () => {
        try {
          (mssqlRequest as { cancel(): void }).cancel();
        } catch {
          // request already completed
        }
      };
      options.signal.addEventListener("abort", onAbort, { once: true });
      try {
        return (await mssqlRequest.query(
          mssqlQuery,
        )) as RawQueryResponseType<"mssql">;
      } finally {
        options.signal.removeEventListener("abort", onAbort);
      }
    }

    return mssqlRequest.query(mssqlQuery) as Promise<
      RawQueryResponseType<"mssql">
    >;
  }

  extract<T extends Returning>(
    raw: RawQueryResponseType<"mssql">,
    returning: T,
  ): SqlRunnerReturnType<T, "mssql"> {
    if (returning === "affectedRows") {
      return raw.rowsAffected[0] as number as SqlRunnerReturnType<T, "mssql">;
    }
    if (returning === "raw") {
      return raw as SqlRunnerReturnType<T, "mssql">;
    }
    return raw.recordset as SqlRunnerReturnType<T, "mssql">;
  }

  async stream(
    query: string,
    params: unknown[],
    options: StreamOptions & { connection?: GetConnectionReturnType<"mssql"> },
    events: StreamEvents,
  ): Promise<PassThrough & AsyncGenerator<Record<string, unknown>>> {
    const mssqlDriver = options.connection ?? this.pool;
    const passThrough = new PassThrough({
      objectMode: options.objectMode ?? true,
      highWaterMark: options.highWaterMark,
    }) as PassThrough & AsyncGenerator<Record<string, unknown>>;

    const mssqlRequest = (
      mssqlDriver as {
        request(): any;
      }
    ).request();
    mssqlRequest.stream = true;

    params.forEach((param, index) => {
      mssqlRequest.input(`p${index}`, param as any);
    });

    let mssqlParamIdx = 0;
    const mssqlQuery = query.replace(
      /\?|@(\d+)/g,
      () => `@p${mssqlParamIdx++}`,
    );

    let pending = 0;
    let ended = false;
    let hasError = false;

    mssqlRequest.on("row", (row: unknown) => {
      if (hasError) return;

      if (events.onData) {
        pending++;
        Promise.resolve(
          (events.onData as (...args: any[]) => any)(passThrough, row),
        )
          .then(() => {
            pending--;
            if (ended && pending === 0 && !hasError) {
              passThrough.end();
            }
          })
          .catch((err: unknown) => {
            hasError = true;
            passThrough.destroy(err as Error);
          });
        return;
      }

      passThrough.write(row);
    });

    mssqlRequest.on("error", (err: Error) => {
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

  private async getMssqlTransactionLevel(
    isolationLevel: string,
  ): Promise<number> {
    const mssqlTransactionLevels = await import("mssql")
      .then((module) => module.default.ISOLATION_LEVEL)
      .catch((error) => {
        logger.error(error);
        throw new DriverNotFoundError("mssql");
      });

    switch (isolationLevel) {
      case "READ UNCOMMITTED":
        return mssqlTransactionLevels.READ_UNCOMMITTED;
      case "READ COMMITTED":
        return mssqlTransactionLevels.READ_COMMITTED;
      case "REPEATABLE READ":
        return mssqlTransactionLevels.REPEATABLE_READ;
      case "SERIALIZABLE":
        return mssqlTransactionLevels.SERIALIZABLE;
      default:
        throw new HysteriaError(
          "TRANSACTION::getMssqlTransactionLevel",
          `UNSUPPORTED_ISOLATION_LEVEL_${isolationLevel}`,
        );
    }
  }
}
