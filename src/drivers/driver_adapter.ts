import type { PassThrough } from "node:stream";
import type { ResolvedJsEnvironment } from "../platform/js_environment";
import type { Model } from "../sql/models/model";
import type { StreamOptions } from "../sql/query_builder/query_builder_types";
import type {
  GetConnectionReturnType,
  SqlDataSourceType,
  getPoolReturnType,
} from "../sql/sql_data_source_types";
import type {
  RawQueryResponseType,
  Returning,
  SqlLiteOptions,
  SqlRunnerReturnType,
} from "../sql/sql_runner/sql_runner_types";
import type { TransactionIsolationLevel } from "../sql/transactions/transaction_types";

export interface ExecuteOptions<D extends SqlDataSourceType, M extends Model> {
  returning: Returning;
  sqlLiteOptions?: SqlLiteOptions<M>;
  /** Reserved connection when inside a transaction; pool otherwise */
  connection?: GetConnectionReturnType<D>;
}

/** rawQuery keeps transaction-level SQL flowing through the datasource (observers/logs) */
export type TransactionRawQuery<D extends SqlDataSourceType> = (
  query: string,
  params?: unknown[],
) => Promise<RawQueryResponseType<D>>;

export interface BeginTransactionOptions<D extends SqlDataSourceType> {
  isolationLevel?: TransactionIsolationLevel;
  rawQuery: TransactionRawQuery<D>;
}

export interface EndTransactionOptions<D extends SqlDataSourceType> {
  rawQuery: TransactionRawQuery<D>;
}

export interface StreamEvents {
  onData?(
    passThrough: PassThrough & AsyncGenerator<Record<string, unknown>>,
    row: unknown,
  ): void | Promise<void>;
}

/**
 * @description A pluggable driver implementation for a concrete dialect. All SQL
 * execution in the runtime routes through an adapter; swapping the underlying
 * driver (e.g. pg → bun-sql, mysql2 → mysql) is just a registry choice.
 */
export interface DriverAdapter<
  D extends SqlDataSourceType = SqlDataSourceType,
  M extends Model = Model,
> {
  readonly dialect: D;
  readonly jsEnvironment: ResolvedJsEnvironment;
  /** The driver pool/connection handle this adapter manages */
  pool: getPoolReturnType<D>;

  createPool(): Promise<void> | void;
  closePool(): Promise<void>;

  reserveConnection():
    | Promise<GetConnectionReturnType<D>>
    | GetConnectionReturnType<D>;
  releaseConnection(
    connection?: GetConnectionReturnType<D>,
  ): Promise<void> | void;

  beginTransaction(
    connection: GetConnectionReturnType<D>,
    options: BeginTransactionOptions<D>,
  ): Promise<void>;
  commitTransaction(
    connection: GetConnectionReturnType<D>,
    options: EndTransactionOptions<D>,
  ): Promise<void>;
  rollbackTransaction(
    connection: GetConnectionReturnType<D>,
    options: EndTransactionOptions<D>,
  ): Promise<void>;

  /** Executes and returns the canonical raw driver result (observers/logging are the runner's job) */
  execute(
    query: string,
    params: unknown[],
    options: ExecuteOptions<D, M>,
  ): Promise<RawQueryResponseType<D>>;

  /** Pure mapping of a raw driver result to rows | affectedRows | raw */
  extract<T extends Returning>(
    raw: RawQueryResponseType<D>,
    returning: T,
  ): SqlRunnerReturnType<T, D>;

  stream(
    query: string,
    params: unknown[],
    options: StreamOptions & { connection?: GetConnectionReturnType<D> },
    events: StreamEvents,
  ): Promise<PassThrough & AsyncGenerator<Record<string, unknown>>>;
}
