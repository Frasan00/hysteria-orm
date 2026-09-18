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
// Shared with the bun adapters: the PassThrough contract is identical. The
// node:stream import it drags in is the tracked browser-bundle gap.
import { bufferIntoPassThrough } from "../bun/stream_utils";
import type { PassThrough } from "node:stream";

/** Structural duck-types for @sqlite.org/sqlite-wasm; never statically imported */
interface SqliteWasmDbLike {
  exec(sql: string, opts?: { bind?: unknown[] }): unknown;
  selectObjects(sql: string, bind?: unknown[]): Record<string, unknown>[];
  changes(): number;
  close(): void;
}

interface SqliteWasmOo1Like {
  DB: new (filename?: string, flags?: string) => SqliteWasmDbLike;
  OpfsDb?: new (filename: string, flags?: string) => SqliteWasmDbLike;
}

/**
 * `wasmBinary` is a standard Emscripten Module option but is absent from the
 * published types; it is the only way to boot the engine where the .wasm cannot
 * be fetched (jsdom), so it doubles as the test seam.
 */
export interface SqliteWasmInitConfig {
  wasmBinary?: ArrayBuffer | Uint8Array;
}

export type SqliteWasmLoader = (
  initConfig?: SqliteWasmInitConfig,
) => Promise<SqliteWasmOo1Like>;

const loadSqliteWasmOo1: SqliteWasmLoader = async (initConfig) => {
  const mod = (await import("@sqlite.org/sqlite-wasm" as string)) as {
    default: (opts?: unknown) => Promise<{ oo1: SqliteWasmOo1Like }>;
  };
  const sqlite3 = await mod.default(initConfig);
  return sqlite3.oo1;
};

/**
 * @description Browser driver adapter backed by @sqlite.org/sqlite-wasm. Like
 * node-sqlite3 there is no pool: a single Database instance is the shared
 * connection. wasm init is async, so the DB handle is opened in createPool()
 * (awaited before any query) rather than in the constructor.
 */
export class SqliteWasmDriverAdapter implements DriverAdapter<"sqlite"> {
  readonly dialect = "sqlite" as const;
  readonly jsEnvironment = "web" as const;
  pool!: getPoolReturnType<"sqlite">;

  private db?: SqliteWasmDbLike;
  private readonly filename: string;
  private readonly loader: SqliteWasmLoader;
  private readonly initConfig?: SqliteWasmInitConfig;

  constructor(
    _dialect: "sqlite",
    input: SqlDataSourceInput<"sqlite">,
    loader: SqliteWasmLoader = loadSqliteWasmOo1,
    initConfig?: SqliteWasmInitConfig,
  ) {
    this.filename = String(input.database ?? ":memory:");
    this.loader = loader;
    this.initConfig = initConfig;
  }

  async createPool(): Promise<void> {
    const oo1 = await this.loader(this.initConfig);
    const { filename } = this;
    // ":memory:" and "" are sqlite's special names; anything else persists.
    // OPFS needs a dedicated worker plus COOP/COEP headers on the host page.
    this.db =
      filename.startsWith(":memory:") || filename === ""
        ? new oo1.DB(filename)
        : oo1.OpfsDb
          ? new oo1.OpfsDb(filename, "c")
          : new oo1.DB(filename, "c");
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
      (options.connection as unknown as SqliteWasmDbLike | undefined) ??
      this.requireDb();
    const sqliteOptions: SqlLiteOptions<Model> = options.sqlLiteOptions ?? {};
    const mode = sqliteOptions.mode || "fetch";

    const run = (sql: string): number => {
      db.exec(sql, { bind: params });
      return db.changes();
    };

    if (isTransactionalQuery(query)) {
      return run(query) as unknown as RawQueryResponseType<"sqlite">;
    }

    if (mode === "fetch") {
      return db.selectObjects(query, params) as unknown as RawQueryResponseType<
        "sqlite"
      >;
    }

    const typeofModel = sqliteOptions?.typeofModel;
    if (!typeofModel) {
      return run(query) as unknown as RawQueryResponseType<"sqlite">;
    }

    if (mode === "insertOne" || mode === "insertMany") {
      // SQLite ≥3.35 supports RETURNING: a single statement returns every inserted
      // row (including DB-generated defaults), so no per-row re-select is needed.
      return db.selectObjects(
        `${query} returning *`,
        params,
      ) as unknown as RawQueryResponseType<"sqlite">;
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
      (options.connection as unknown as SqliteWasmDbLike | undefined) ??
      this.requireDb();
    // no cursor API in the oo1 surface — the set is materialized, then buffered
    return bufferIntoPassThrough(db.selectObjects(query, params), options, events);
  }

  private requireDb(): SqliteWasmDbLike {
    if (!this.db) {
      throw new Error(
        "sqlite-wasm: pool not created, await createPool() before querying",
      );
    }
    return this.db;
  }
}

/** Shared with the react-native adapter; transaction SQL arrives as raw text */
export const isTransactionalQuery = (query: string): boolean =>
  ["begin", "begin transaction", "commit", "rollback"].includes(
    query.trim().toLowerCase(),
  );
