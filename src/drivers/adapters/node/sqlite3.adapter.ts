import { PassThrough, Readable, type ReadableOptions } from "node:stream";
import type { Sqlite3Import } from "../../driver_types";
import { HysteriaError } from "../../../errors/hysteria_error";
import type { Model } from "../../../sql/models/model";
import type { StreamOptions } from "../../../sql/query_builder/query_builder_types";
import type {
  GetConnectionReturnType,
  getPoolReturnType,
  SqlDataSourceInput,
  SqliteConnectionInstance,
} from "../../../sql/sql_data_source_types";
import type {
  RawQueryResponseType,
  Returning,
  SqlLiteOptions,
  SqlRunnerReturnType,
} from "../../../sql/sql_runner/sql_runner_types";
import type {
  BeginTransactionOptions,
  DriverAdapter,
  EndTransactionOptions,
  ExecuteOptions,
  StreamEvents,
} from "../../driver_adapter";

/**
 * @description node sqlite3 driver adapter
 * @description sqlite has no real pool — the Database instance is the shared, single connection
 */
export class Sqlite3DriverAdapter implements DriverAdapter<"sqlite"> {
  readonly dialect = "sqlite" as const;
  readonly jsEnvironment = "node" as const;
  pool: getPoolReturnType<"sqlite">;

  private client: Sqlite3Import;
  private input: SqlDataSourceInput<"sqlite">;

  constructor(
    dialect: "sqlite",
    input: SqlDataSourceInput<"sqlite">,
    client: Sqlite3Import,
  ) {
    this.dialect = dialect;
    this.client = client;
    this.input = input;
    this.pool = new client.Database(
      String(input.database ?? ":memory:"),
      (input as { driverOptions?: { mode?: number } }).driverOptions?.mode ??
        undefined,
      (err) => {
        if (err) {
          throw new HysteriaError(
            "SqliteDataSource::createSqlPool",
            "CONNECTION_NOT_ESTABLISHED",
          );
        }
      },
    );
  }

  createPool(): void {}

  async closePool(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.pool.close((err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  async reserveConnection(): Promise<GetConnectionReturnType<"sqlite">> {
    return this.pool;
  }

  releaseConnection(): void {
    // Single shared connection — nothing to release
  }

  async beginTransaction(
    _connection: GetConnectionReturnType<"sqlite">,
    options: BeginTransactionOptions<"sqlite">,
  ): Promise<void> {
    await options.rawQuery("BEGIN TRANSACTION");
  }

  async commitTransaction(
    _connection: GetConnectionReturnType<"sqlite">,
    options: EndTransactionOptions<"sqlite">,
  ): Promise<void> {
    await options.rawQuery("COMMIT");
  }

  async rollbackTransaction(
    _connection: GetConnectionReturnType<"sqlite">,
    options: EndTransactionOptions<"sqlite">,
  ): Promise<void> {
    await options.rawQuery("ROLLBACK");
  }

  async execute(
    query: string,
    params: unknown[],
    options: ExecuteOptions<"sqlite", Model>,
  ): Promise<RawQueryResponseType<"sqlite">> {
    const result = await this.promisify(query, params, options);
    return result as unknown as RawQueryResponseType<"sqlite">;
  }

  extract<T extends Returning>(
    raw: RawQueryResponseType<"sqlite">,
    returning: T,
  ): SqlRunnerReturnType<T, "sqlite"> {
    if (returning === "raw") {
      return (!Array.isArray(raw) ? [raw] : raw) as SqlRunnerReturnType<
        T,
        "sqlite"
      >;
    }
    return raw as SqlRunnerReturnType<T, "sqlite">;
  }

  async stream(
    query: string,
    params: unknown[],
    options: StreamOptions & { connection?: GetConnectionReturnType<"sqlite"> },
    events: StreamEvents,
  ): Promise<PassThrough & AsyncGenerator<Record<string, unknown>>> {
    const db = options.connection ?? this.pool;
    const stream = new SqliteStream(db, query, params, {
      onData: events.onData as (
        _passThrough: PassThrough & AsyncGenerator<Model>,
        row: unknown,
      ) => void | Promise<void>,
    });
    return stream as unknown as PassThrough &
      AsyncGenerator<Record<string, unknown>>;
  }

  private promisify(
    query: string,
    params: unknown[],
    options: ExecuteOptions<"sqlite", Model>,
  ): Promise<number | Record<string, unknown>[]> {
    const sqliteOptions: SqlLiteOptions<Model> = options.sqlLiteOptions ?? {};
    const mode = sqliteOptions.mode || "fetch";
    const db =
      (sqliteOptions.customConnection as
        | SqliteConnectionInstance
        | undefined) ??
      (options.connection as SqliteConnectionInstance | undefined) ??
      this.pool;

    const isTransactional = [
      "begin",
      "begin transaction",
      "commit",
      "rollback",
    ].includes(query.trim().toLowerCase());

    if (isTransactional) {
      return new Promise<number>((resolve, reject) => {
        (db as SqliteConnectionInstance).run(
          query,
          params,
          function (this: unknown, err: Error | null) {
            if (err) {
              reject(err);
            }
            resolve((this as { changes: number }).changes);
          },
        );
      });
    }

    if (mode === "fetch") {
      return new Promise<Record<string, unknown>[]>((resolve, reject) => {
        (db as SqliteConnectionInstance).all(query, params, (err, rows) => {
          if (err) {
            reject(err);
          }
          resolve((rows as Record<string, unknown>[]) || []);
        });
      });
    }

    const typeofModel = sqliteOptions?.typeofModel;
    if (!typeofModel) {
      return new Promise<number>((resolve, reject) => {
        (db as SqliteConnectionInstance).run(
          query,
          params,
          function (this: unknown, err: Error | null) {
            if (err) {
              reject(new Error(err.message));
            } else {
              resolve((this as { changes: number }).changes);
            }
          },
        );
      });
    }

    if (mode === "insertOne" || mode === "insertMany") {
      // SQLite ≥3.35 supports RETURNING: a single statement returns every inserted
      // row (including DB-generated defaults), so no per-row re-select is needed.
      const returningQuery = `${query} returning *`;
      return new Promise<Record<string, unknown>[]>((resolve, reject) => {
        (db as SqliteConnectionInstance).all(
          returningQuery,
          params,
          (err, rows) => {
            if (err) {
              return reject(err);
            }
            resolve((rows as Record<string, unknown>[]) || []);
          },
        );
      });
    }

    return new Promise<number>((resolve, reject) => {
      (db as SqliteConnectionInstance).run(
        query,
        params,
        function (this: { changes: number }, err: Error | null) {
          if (err) {
            reject(new Error(err.message));
          } else {
            resolve(this.changes);
          }
        },
      );
    });
  }
}

class SqliteStream extends Readable {
  private db: SqliteConnectionInstance;
  private query: string;
  private params: unknown[];
  private started: boolean;
  private events: {
    onData?: (
      passThrough: PassThrough & AsyncGenerator<Model>,
      row: unknown,
    ) => void | Promise<void>;
  };

  constructor(
    db: SqliteConnectionInstance,
    query: string,
    params: unknown[] = [],
    events: {
      onData?: (
        passThrough: PassThrough & AsyncGenerator<Model>,
        row: unknown,
      ) => void | Promise<void>;
    },
  ) {
    super({ objectMode: true } as ReadableOptions);
    this.db = db;
    this.query = query;
    this.params = params;
    this.started = false;
    this.events = events;
  }

  _read(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.readRows();
  }

  private readRows(): void {
    let pending = 0;
    let ended = false;
    let hasError = false;

    this.db.each(
      this.query,
      this.params as any[],
      (err: Error | null, row: unknown) => {
        if (err) {
          hasError = true;
          this.emit("error", err);
          return;
        }

        pending++;

        let wroteFlag = false;
        let wroteValue: unknown;

        const mockPassThrough = {
          write: (v: unknown) => {
            wroteFlag = true;
            wroteValue = v;
          },
        } as PassThrough & AsyncGenerator<Model>;

        Promise.resolve(this.events.onData?.(mockPassThrough, row))
          .then(() => {
            if (hasError) {
              return;
            }
            if (wroteFlag) {
              this.push(wroteValue as any);
              return;
            }
            this.push(row);
          })
          .catch((err: Error) => {
            hasError = true;
            this.emit("error", err);
          })
          .finally(() => {
            pending--;
            if (ended && pending === 0 && !hasError) {
              this.push(null);
            }
          });
      },
      (err: Error | null) => {
        if (err) {
          hasError = true;
          this.emit("error", err);
          return;
        }
        ended = true;
        if (pending === 0 && !hasError) {
          this.push(null);
        }
      },
    );
  }
}
