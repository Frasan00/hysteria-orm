import { PassThrough } from "node:stream";
import type { Model } from "../../../sql/models/model";
import type { StreamOptions } from "../../../sql/query_builder/query_builder_types";
import type {
  GetConnectionReturnType,
  SqlDataSourceInput,
  getPoolReturnType,
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
import { streamIntoPassThrough } from "./stream_utils";

/** Structural duck-types for bun:sqlite; never statically imported */
interface BunSqliteQueryLike {
  all(...params: unknown[]): Record<string, unknown>[];
  run(...params: unknown[]): { changes: number; lastInsertRowid: number };
  get(...params: unknown[]): Record<string, unknown> | undefined;
  /** synchronous cursor — rows materialize lazily, one at a time */
  iterate(...params: unknown[]): Iterable<Record<string, unknown>>;
}

interface BunSqliteDatabaseLike {
  query(sql: string): BunSqliteQueryLike;
  close(): void;
}

/**
 * @description bun:sqlite driver adapter. Like node-sqlite3 there is no real
 * pool — a single Database instance is the shared connection, so never
 * `.reserve()`. Execution mirrors the node adapter's promisify mode matrix.
 */
export class BunSqliteDriverAdapter implements DriverAdapter<"sqlite"> {
  readonly dialect = "sqlite" as const;
  readonly jsEnvironment = "bun" as const;
  pool: getPoolReturnType<"sqlite">;

  private db: BunSqliteDatabaseLike;

  constructor(
    _dialect: "sqlite",
    input: SqlDataSourceInput<"sqlite">,
    Database: new (
      path: string,
      options?: Record<string, unknown>,
    ) => BunSqliteDatabaseLike,
  ) {
    this.db = new Database(
      String(input.database ?? ":memory:"),
      (input as { driverOptions?: Record<string, unknown> }).driverOptions,
    );
    this.pool = this.db as unknown as getPoolReturnType<"sqlite">;
  }

  createPool(): void {}

  async closePool(): Promise<void> {
    this.db.close();
  }

  async reserveConnection(): Promise<GetConnectionReturnType<"sqlite">> {
    // single shared connection, not pooled
    return this.pool;
  }

  releaseConnection(): void {
    // nothing to release
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
    const db =
      (options.connection as unknown as BunSqliteDatabaseLike | undefined) ??
      this.db;
    const sqliteOptions: SqlLiteOptions<Model> = options.sqlLiteOptions ?? {};
    const mode = sqliteOptions.mode || "fetch";

    const isTransactional = [
      "begin",
      "begin transaction",
      "commit",
      "rollback",
    ].includes(query.trim().toLowerCase());

    if (isTransactional) {
      return db.query(query).run(...params)
        .changes as unknown as RawQueryResponseType<"sqlite">;
    }

    if (mode === "fetch") {
      return db
        .query(query)
        .all(...params) as unknown as RawQueryResponseType<"sqlite">;
    }

    const typeofModel = sqliteOptions?.typeofModel;
    if (!typeofModel) {
      return db.query(query).run(...params)
        .changes as unknown as RawQueryResponseType<"sqlite">;
    }

    if (mode === "insertOne" || mode === "insertMany") {
      // SQLite ≥3.35 supports RETURNING: a single statement returns every inserted
      // row (including DB-generated defaults), so no per-row re-select is needed.
      return db
        .query(`${query} returning *`)
        .all(...params) as unknown as RawQueryResponseType<"sqlite">;
    }

    return db.query(query).run(...params)
      .changes as unknown as RawQueryResponseType<"sqlite">;
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
    const db =
      (options.connection as unknown as BunSqliteDatabaseLike | undefined) ??
      this.db;
    // cursor-based: rows stream lazily instead of materializing .all()
    return streamIntoPassThrough(
      db.query(query).iterate(...params),
      options,
      events,
    );
  }
}
