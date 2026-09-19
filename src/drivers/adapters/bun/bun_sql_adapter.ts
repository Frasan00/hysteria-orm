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
  SqlRunnerReturnType,
} from "../../../sql/sql_runner/sql_runner_types";
import type {
  BeginTransactionOptions,
  DriverAdapter,
  EndTransactionOptions,
  ExecuteOptions,
  StreamEvents,
} from "../../driver_adapter";
import { bufferIntoPassThrough } from "./stream_utils";

type BunServerDialect = "postgres" | "cockroachdb" | "mysql" | "mariadb";

/** Structural duck-types for Bun's native SQL client; never statically imported */
interface BunSqlLike {
  unsafe(sqlString: string, params?: unknown[]): unknown;
  reserve(): Promise<BunReservedSqlLike>;
  close(): void;
}

interface BunReservedSqlLike extends BunSqlLike {
  release(): void;
}

type BunDmlResult = {
  count: number;
  command: string;
  lastInsertRowid: number;
  affectedRows: number;
};

/**
 * @description Bun wraps server-side SQL errors in its own `Bun.SQL` error,
 * moving the SQLSTATE out of `.code` (where the node drivers put it) and into
 * `.errno`. Consumers that branch on `error.code === "23505"` therefore behave
 * differently under the default Bun driver, even though the adapter canonicalizes
 * result shapes to match the node drivers.
 *
 * This re-exposes a five-character SQLSTATE as `.code` (and keeps `.errno`),
 * preserving the original error as `.cause`. Bun's own codes stay put:
 * `ERR_POSTGRES_*`, `ERR_MYSQL_*` and similar are not SQLSTATEs, so they are left
 * untouched rather than overwriting a meaningful value.
 *
 * @knownlimitation MySQL/MariaDB report a numeric `errno` (1062 for a duplicate
 * key), not a SQLSTATE, so they are left as Bun produced them. The node `mysql2`
 * driver reports the symbolic `code` (`ER_DUP_ENTRY`) instead; matching that would
 * need a full server-error-number table, so only the Postgres family is
 * normalized here.
 */
const normalizeBunSqlError = (error: unknown): unknown => {
  if (!error || typeof error !== "object") {
    return error;
  }

  const candidate = error as {
    code?: unknown;
    errno?: unknown;
    cause?: unknown;
  };

  const sqlState = candidate.errno;
  const isSqlState =
    typeof sqlState === "string" && /^[0-9A-Z]{5}$/.test(sqlState);
  const codeIsBunCode =
    typeof candidate.code === "string" && candidate.code.startsWith("ERR_");

  if (!isSqlState || !codeIsBunCode) {
    return error;
  }

  // Keep the Bun error reachable for consumers that want the driver shape.
  // `cause` is usually undefined here, so only set it when it is unset.
  if (candidate.cause === undefined) {
    candidate.cause = error;
  }
  candidate.code = sqlState;
  return error;
};

/**
 * @description Bun native SQL driver adapter (Bun.sql — postgres | cockroachdb |
 * mysql | mariadb). No placeholder rewrite needed: Bun accepts both `?` and
 * `$N` positionally. Result shapes are canonicalized to match the node drivers
 * so every raw- contract consumer stays untouched.
 */
export class BunSqlDriverAdapter implements DriverAdapter<BunServerDialect> {
  readonly dialect: BunServerDialect;
  readonly jsEnvironment = "bun" as const;
  pool: getPoolReturnType<BunServerDialect>;

  private sql: BunSqlLike;

  constructor(
    dialect: BunServerDialect,
    input: SqlDataSourceInput<BunServerDialect>,
    SQL: new (options: Record<string, unknown>) => BunSqlLike,
  ) {
    this.dialect = dialect;
    // `coerceNumericTypes` is deliberately NOT threaded here: it is a node-`pg`
    // feature and is ignored on this path. Bun.sql exposes no type-parser hook
    // — it maps pg `int8`/`numeric` to JS numbers on its own, so there is no
    // equivalent `types.getTypeParser` seam to override. Passing the flag on a
    // bun-sql data source has no effect on the returned values.
    const options: Record<string, unknown> = {
      hostname: input.host,
      port: input.port,
      username: input.username,
      password: input.password,
      database: input.database,
      ...(input as { driverOptions?: object }).driverOptions,
    };
    if (dialect === "mysql" || dialect === "mariadb") {
      options.adapter = "mysql";
      // mysql 8 default auth plugin requests the server's RSA key over a
      // non-TLS channel unless explicitly allowed
      options.allowPublicKeyRetrieval = true;
    }
    this.sql = new SQL(options);
    this.pool = this.sql as unknown as getPoolReturnType<BunServerDialect>;
  }

  createPool(): void {}

  async closePool(): Promise<void> {
    this.sql.close();
  }

  async reserveConnection(): Promise<
    GetConnectionReturnType<BunServerDialect>
  > {
    return this.sql.reserve() as unknown as GetConnectionReturnType<BunServerDialect>;
  }

  releaseConnection(
    connection?: GetConnectionReturnType<BunServerDialect>,
  ): void {
    (connection as unknown as BunReservedSqlLike | undefined)?.release();
  }

  async beginTransaction(
    _connection: GetConnectionReturnType<BunServerDialect>,
    options: BeginTransactionOptions<BunServerDialect>,
  ): Promise<void> {
    // mysql requires the isolation level BEFORE BEGIN; postgres after it
    if (
      (this.dialect === "mysql" || this.dialect === "mariadb") &&
      options.isolationLevel
    ) {
      await options.rawQuery(
        `SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`,
      );
    }
    // bun has no native transaction methods, and mysql/mariadb reject
    // `BEGIN TRANSACTION` (it only accepts `BEGIN` or `START TRANSACTION`)
    await options.rawQuery(
      this.dialect === "mysql" || this.dialect === "mariadb"
        ? "START TRANSACTION"
        : "BEGIN TRANSACTION",
    );
    if (
      (this.dialect === "postgres" || this.dialect === "cockroachdb") &&
      options.isolationLevel
    ) {
      await options.rawQuery(
        `SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`,
      );
    }
  }

  async commitTransaction(
    _connection: GetConnectionReturnType<BunServerDialect>,
    options: EndTransactionOptions<BunServerDialect>,
  ): Promise<void> {
    await options.rawQuery("COMMIT");
  }

  async rollbackTransaction(
    _connection: GetConnectionReturnType<BunServerDialect>,
    options: EndTransactionOptions<BunServerDialect>,
  ): Promise<void> {
    await options.rawQuery("ROLLBACK");
  }

  async execute(
    query: string,
    params: unknown[],
    options: ExecuteOptions<BunServerDialect, Model>,
  ): Promise<RawQueryResponseType<BunServerDialect>> {
    const driver =
      (options.connection as unknown as BunReservedSqlLike | undefined) ??
      this.sql;
    let result: Record<string, unknown>[] | BunDmlResult;
    try {
      result = (await driver.unsafe(query, params)) as
        | Record<string, unknown>[]
        | BunDmlResult;
    } catch (error) {
      throw normalizeBunSqlError(error);
    }

    if (this.dialect === "mysql" || this.dialect === "mariadb") {
      // Bun's mysql results are SQLResultArray — an actual Array with
      // affectedRows/lastInsertRowid attached as own props, for BOTH reads and
      // DML (a 0-row SELECT and a 0-row DELETE are shape-identical). The raw
      // tuple consumers expect mysql2's [rows, fields] / [OkPacket, undefined],
      // so the leading keyword decides which shape raw[0] takes.
      const isRead = /^\s*(select|show|desc(ribe)?|explain)\b/i.test(query);
      if (Array.isArray(result) && (isRead || result.length > 0)) {
        return [result, undefined] as RawQueryResponseType<BunServerDialect>;
      }
      const dml = result as unknown as BunDmlResult;
      return [
        {
          affectedRows: Number(dml.affectedRows),
          insertId: Number(dml.lastInsertRowid),
        },
        undefined,
      ] as RawQueryResponseType<BunServerDialect>;
    }

    // pg/cockroach DML results are ALSO array-like `[]` carrying command/count
    // as own props, so `command` (not Array.isArray) separates reads from DML,
    // and pg reports affected rows via `count` (its `affectedRows` stays null).
    // RETURNING queries still return real rows, so length>0 always wins.
    const dml = result as unknown as BunDmlResult;
    if (Array.isArray(result)) {
      const isPgDml =
        (dml.command === "INSERT" ||
          dml.command === "UPDATE" ||
          dml.command === "DELETE") &&
        result.length === 0;
      if (!isPgDml) {
        return {
          rows: result,
          rowCount: result.length,
        } as unknown as RawQueryResponseType<BunServerDialect>;
      }
    }
    return {
      rows: [],
      rowCount: dml.count ?? dml.affectedRows ?? 0,
    } as unknown as RawQueryResponseType<BunServerDialect>;
  }

  extract<T extends Returning>(
    raw: RawQueryResponseType<BunServerDialect>,
    returning: T,
  ): SqlRunnerReturnType<T, BunServerDialect> {
    if (returning === "raw") {
      return raw as SqlRunnerReturnType<T, BunServerDialect>;
    }

    if (this.dialect === "mysql" || this.dialect === "mariadb") {
      const tuple = raw as unknown as [BunDmlResult, undefined] & {
        0?: { affectedRows?: number };
      };
      if (returning === "affectedRows") {
        return (tuple[0]?.affectedRows ?? 0) as SqlRunnerReturnType<
          T,
          BunServerDialect
        >;
      }
      return tuple[0] as SqlRunnerReturnType<T, BunServerDialect>;
    }

    const obj = raw as { rows: unknown[]; rowCount: number };
    if (returning === "affectedRows") {
      return obj.rowCount as SqlRunnerReturnType<T, BunServerDialect>;
    }
    return obj.rows as SqlRunnerReturnType<T, BunServerDialect>;
  }

  async stream(
    query: string,
    params: unknown[],
    options: StreamOptions & {
      connection?: GetConnectionReturnType<BunServerDialect>;
    },
    events: StreamEvents,
  ): Promise<PassThrough & AsyncGenerator<Record<string, unknown>>> {
    const driver =
      (options.connection as unknown as BunReservedSqlLike | undefined) ??
      this.sql;
    let result: Record<string, unknown>[] | BunDmlResult;
    try {
      result = (await driver.unsafe(query, params)) as
        | Record<string, unknown>[]
        | BunDmlResult;
    } catch (error) {
      throw normalizeBunSqlError(error);
    }
    const rows = Array.isArray(result) ? result : [];
    return bufferIntoPassThrough(rows, options, events);
  }
}
