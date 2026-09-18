import type { PassThrough } from "node:stream";
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
import { bufferIntoPassThrough } from "../bun/stream_utils";
import { isTransactionalQuery } from "./sqlite_wasm.adapter";

/** Structural duck-types for @op-engineering/op-sqlite; never statically imported */
interface OpSqliteResultLike {
  rows?: unknown;
  rowsAffected?: number;
  insertId?: number;
}

interface OpSqliteDbLike {
  execute(sql: string, params?: unknown[]): Promise<OpSqliteResultLike>;
  close(): void;
}

export interface SqliteRnEngine {
  open(params: { name: string }): OpSqliteDbLike;
}

/**
 * op-sqlite returns rows through a JSI host-object array in some versions and a
 * plain array in others; consumers only ever index it, so normalize here.
 */
const normalizeRows = (rows: unknown): Record<string, unknown>[] =>
  Array.isArray(rows)
    ? (rows as Record<string, unknown>[])
    : (((rows as { _array?: Record<string, unknown>[] } | undefined)?._array ??
        []) as Record<string, unknown>[]);

/**
 * @description React Native driver adapter backed by @op-engineering/op-sqlite.
 * Same single-connection shape as the other sqlite drivers; the native handle is
 * opened in createPool() so a misconfigured file name fails at connect time.
 */
export class SqliteRnDriverAdapter implements DriverAdapter<"sqlite"> {
  readonly dialect = "sqlite" as const;
  readonly jsEnvironment = "react-native" as const;
  pool!: getPoolReturnType<"sqlite">;

  private db?: OpSqliteDbLike;
  private readonly filename: string;
  private readonly engine: SqliteRnEngine;

  constructor(
    _dialect: "sqlite",
    input: SqlDataSourceInput<"sqlite">,
    engine: SqliteRnEngine,
  ) {
    this.filename = String(input.database ?? ":memory:");
    this.engine = engine;
  }

  createPool(): void {
    this.db = this.engine.open({ name: this.filename });
    this.pool = this.db as unknown as getPoolReturnType<"sqlite">;
  }

  async closePool(): Promise<void> {
    this.db?.close();
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
      (options.connection as unknown as OpSqliteDbLike | undefined) ??
      this.requireDb();
    const sqliteOptions: SqlLiteOptions<Model> = options.sqlLiteOptions ?? {};
    const mode = sqliteOptions.mode || "fetch";

    const run = async (sql: string): Promise<number> =>
      (await db.execute(sql, params)).rowsAffected ?? 0;

    if (isTransactionalQuery(query)) {
      return run(query) as unknown as RawQueryResponseType<"sqlite">;
    }

    if (mode === "fetch") {
      const result = await db.execute(query, params);
      return normalizeRows(
        result.rows,
      ) as unknown as RawQueryResponseType<"sqlite">;
    }

    const typeofModel = sqliteOptions?.typeofModel;
    if (!typeofModel) {
      return run(query) as unknown as RawQueryResponseType<"sqlite">;
    }

    if (mode === "insertOne" || mode === "insertMany") {
      // SQLite ≥3.35 supports RETURNING: a single statement returns every inserted
      // row (including DB-generated defaults), so no per-row re-select is needed.
      const result = await db.execute(`${query} returning *`, params);
      return normalizeRows(result.rows) as unknown as RawQueryResponseType<
        "sqlite"
      >;
    }

    return run(query) as unknown as RawQueryResponseType<"sqlite">;
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
      (options.connection as unknown as OpSqliteDbLike | undefined) ??
      this.requireDb();
    // no cursor API: rows are materialized up front, then buffered
    const result = await db.execute(query, params);
    return bufferIntoPassThrough(normalizeRows(result.rows), options, events);
  }

  private requireDb(): OpSqliteDbLike {
    if (!this.db) {
      throw new Error(
        "sqlite-rn: pool not created, await createPool() before querying",
      );
    }
    return this.db;
  }
}
