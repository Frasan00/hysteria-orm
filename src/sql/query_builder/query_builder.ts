import { PassThrough } from "node:stream";
import { HysteriaError } from "../../errors/hysteria_error";
import { baseSoftDeleteDate } from "../../utils/date_utils";
import { JsonPathInput } from "../../utils/json_path_utils";
import logger from "../../utils/logger";

import { bindParamsIntoQuery, formatQuery } from "../../utils/query";
import { coerceToNumber } from "../../utils/types";
import { AstParser } from "../ast/parser";
import { UnionNode, WithNode } from "../ast/query/node";
import { CommentNode } from "../ast/query/node/comment";
import { DeleteNode } from "../ast/query/node/delete";
import { FromNode } from "../ast/query/node/from";
import { RawNode } from "../ast/query/node/raw/raw_node";
import type { TableColumnInfo } from "../schema_introspection_types";
import { InsertNode } from "../ast/query/node/insert";
import { LockNode } from "../ast/query/node/lock/lock";
import { OnDuplicateNode } from "../ast/query/node/on_duplicate";
import { ReturningNode } from "../ast/query/node/returning/returning";
import { SelectNode } from "../ast/query/node/select/basic_select";
import { UnionCallBack } from "../ast/query/node/select/select_types";
import type { WindowOptions } from "../ast/query/node/window/window";
import { TruncateNode } from "../ast/query/node/truncate";
import type { TruncateOptions } from "../ast/query/node/truncate";
import { UpdateNode } from "../ast/query/node/update";
import { QueryNode } from "../ast/query/query";
import { InterpreterUtils } from "../interpreter/interpreter_utils";
import type { Model } from "../models/model";
import type { QueryContext } from "../observers/observer";
import type {
  ModelKey,
  RawModelKey,
  WhereColumnValue,
} from "../models/model_manager/model_manager_types";
import type { NumberModelKey } from "../models/model_types";
import { getPaginationMetadata } from "../pagination";
import { deepCloneNode } from "../resources/utils";
import { SqlDataSource } from "../sql_data_source";
import type {
  ReplicationType,
  SqlDataSourceType,
  TableFormat,
} from "../sql_data_source_types";
import type { SqlComment, SqlHint } from "./comment_types";
import { execSql, execSqlStreaming } from "../sql_runner/sql_runner";
import { SoftDeleteOptions } from "./delete_query_builder_type";
import { JsonQueryBuilder } from "./json_query_builder";
import type {
  ComposeBuildRawSelect,
  ComposeRawSelect,
  Cursor,
  PluckReturnType,
  RawCursorPaginatedData,
  RawPaginatedData,
  Selectable,
  SelectableColumn,
  SqlFunction,
  SqlFunctionReturnType,
  SetOperationOptions,
  StreamOptions,
  UpsertOptionsRawBuilder,
  ValueKey,
  WhereOnlyQueryBuilder,
  WriteQueryParam,
} from "./query_builder_types";
import { WriteOperation } from "./write_operation";
import { InsertWriteOperation } from "./insert_write_operation";
import type { InsertConflictConfig } from "./insert_write_operation";

/**
 * @description Minimal interface satisfied by both QueryBuilder and ModelQueryBuilder.
 * Used as the return type for subquery callbacks so that both QB and MQB can be
 * returned without TypeScript complaining about structural incompatibilities.
 */
export interface SubQueryable {
  extractQueryNodes(): QueryNode[];
}

/**
 * @description Which otherwise-select-only clauses a write operation tolerates.
 */
export interface WriteClauseAllowances {
  allowCte?: boolean;
}

/** SQLite gained `as materialized` in 3.35; the other dialects either lack both hints or reject them. */
const MATERIALIZED_CTE_DIALECTS: SqlDataSourceType[] = [
  "postgres",
  "cockroachdb",
  "sqlite",
];

export class QueryBuilder<
  T extends Model = any,
  S extends Record<string, any> = Record<string, any>,
  D extends SqlDataSourceType = SqlDataSourceType,
>
  extends JsonQueryBuilder<T, S>
  implements SubQueryable
{
  model: typeof Model;
  protected astParser: AstParser;
  protected unionNodes: UnionNode[];
  protected withNodes: WithNode[];
  protected lockQueryNodes: LockNode[];
  protected comments: string[];
  protected hints: string[];
  protected isNestedCondition = false;
  protected _interpreterUtils: InterpreterUtils | null = null;
  protected get interpreterUtils(): InterpreterUtils {
    if (!this._interpreterUtils) {
      this._interpreterUtils = new InterpreterUtils(this.model);
    }
    return this._interpreterUtils;
  }
  protected insertNode: InsertNode | null = null;
  protected insertNodeSource: QueryNode[] | undefined = undefined;
  protected onDuplicateNode: OnDuplicateNode | null = null;
  protected insertConflictConfig: InsertConflictConfig | null = null;
  protected updateNode: UpdateNode | null = null;
  protected updateFromNode: FromNode | null = null;
  protected deleteNode: DeleteNode | null = null;
  protected deleteUsingNode: FromNode | null = null;
  protected returningNode: ReturningNode | null = null;
  protected truncateNode: TruncateNode | null = null;
  protected replicationMode: ReplicationType | null = null;
  protected schemaName?: string;
  protected queryTimeout?: { ms: number; cancel: boolean };
  protected queryContextOptions?: Partial<QueryContext>;
  protected shouldLogQuery?: boolean;

  constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.dbType = sqlDataSource.getDbType();
    this.isNestedCondition = false;
    this.model = model;
    this.unionNodes = [];
    this.lockQueryNodes = [];
    this.withNodes = [];
    this.comments = [];
    this.hints = [];
    this.astParser = new AstParser(this.model, this.dbType);
  }

  /**
   * @description Sets the replication mode for the query builder
   * @param replicationMode - The replication mode to use for the query builder
   * @description If not specified, read operations will use slave (if available) else master, and write operations will always use master
   * @description If set to "master", all operations will use master
   * @description If set to "slave", read operations will use slave and write operations will use master
   */
  setReplicationMode(replicationMode: ReplicationType): this {
    this.replicationMode = replicationMode;
    return this;
  }

  /**
   * @description Adds a SELECT condition to the query with type safety.
   * @description Can be stacked multiple times
   * @description Supports: "column", "table.column", "*", "table.*", or [column, alias] tuples
   * @example
   * ```ts
   * const user = await sql.from("users").select("name", "age").one();
   * // user type: { name: any, age: any } | null
   *
   * const user = await sql.from("users").select(["name", "userName"]).one();
   * // user type: { userName: any } | null
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override select<const Columns extends readonly Selectable[]>(
    ...columns: Columns
  ): QueryBuilder<T, ComposeBuildRawSelect<S, Columns>, D>;
  // @ts-expect-error - intentionally returns different type for type-safety
  select<ValueType = any, Alias extends string = string>(
    cbOrQueryBuilder:
      | ((subQuery: QueryBuilder<T>) => void | SubQueryable)
      | QueryBuilder<any>,
    alias: Alias,
  ): QueryBuilder<T, ComposeRawSelect<S, { [K in Alias]: ValueType }>, D>;
  // @ts-expect-error - intentionally returns different type for type-safety
  select<const Columns extends readonly Selectable[]>(
    ...columns: Columns
  ): QueryBuilder<T, ComposeBuildRawSelect<S, Columns>, D> {
    if (
      columns.length === 2 &&
      (typeof columns[0] === "function" ||
        columns[0] instanceof QueryBuilder) &&
      typeof columns[1] === "string"
    ) {
      const [cbOrQueryBuilder, alias] = columns as unknown as [
        (
          | ((subQuery: QueryBuilder<T>) => void | SubQueryable)
          | QueryBuilder<any>
        ),
        string,
      ];
      if (typeof cbOrQueryBuilder === "function") {
        const subQuery = new QueryBuilder<T>(this.model, this.sqlDataSource);
        const result = cbOrQueryBuilder(subQuery);
        const resolvedQuery: SubQueryable =
          result != null && "extractQueryNodes" in result ? result : subQuery;
        this.selectNodes.push(
          new SelectNode(resolvedQuery.extractQueryNodes(), alias),
        );
        return this as any;
      }
      this.selectNodes.push(
        new SelectNode(cbOrQueryBuilder.extractQueryNodes(), alias),
      );
      return this as any;
    }
    super.select(...(columns as unknown as Selectable[]));
    return this as unknown as QueryBuilder<
      T,
      ComposeBuildRawSelect<S, Columns>,
      D
    >;
  }

  /**
   * @description Adds a raw SELECT statement to the query with type safety.
   * @description Use the generic parameter to specify the type of the selected columns.
   * @example
   * ```ts
   * const result = await sql.from("users")
   *   .selectRaw<{ total: number }>("count(*) as total")
   *   .one();
   * // result type: { total: number } | null
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectRaw<Added extends Record<string, any> = Record<string, any>>(
    statement: string,
  ): QueryBuilder<T, ComposeRawSelect<S, Added>, D> {
    super.selectRaw(statement);
    return this as unknown as QueryBuilder<T, ComposeRawSelect<S, Added>, D>;
  }

  /**
   * @description Clears the SELECT clause and resets type to default
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override clearSelect(): QueryBuilder<T, Record<string, any>, D> {
    super.clearSelect();
    return this as unknown as QueryBuilder<T, Record<string, any>, D>;
  }

  /**
   * @description Selects a SQL function applied to a column with a typed alias.
   * @description Provides intellisense for common SQL functions while accepting any custom function.
   * @description Return type is auto-inferred based on function name (number for count/sum/avg, string for upper/lower/trim, etc.)
   * @param sqlFunc The SQL function name (count, sum, avg, min, max, upper, lower, etc.)
   * @param column The column to apply the function to (use "*" for count(*))
   * @param alias The alias for the result
   * @example
   * ```ts
   * const result = await sql.from("users")
   *   .selectFunc("count", "*", "total")
   *   .one();
   * // result type: { total: number } | null - auto-inferred!
   * ```
   */
  // @ts-expect-error - intentionally returns different type for type-safety
  override selectFunc<F extends SqlFunction, Alias extends string>(
    sqlFunc: F,
    column: string,
    alias: Alias,
  ): QueryBuilder<
    T,
    ComposeRawSelect<S, { [K in Alias]: SqlFunctionReturnType<F> }>,
    D
  > {
    super.selectFunc(sqlFunc, column, alias);
    return this as unknown as QueryBuilder<
      T,
      ComposeRawSelect<S, { [K in Alias]: SqlFunctionReturnType<F> }>,
      D
    >;
  }

  // @ts-expect-error - intentionally returns different type for type-safety
  override selectJson<ValueType = any, Alias extends string = string>(
    column: ModelKey<T> | string,
    path: JsonPathInput,
    alias: Alias,
  ): QueryBuilder<T, ComposeRawSelect<S, { [K in Alias]: ValueType }>, D> {
    super.selectJson(column as string, path, alias);
    return this as unknown as QueryBuilder<
      T,
      ComposeRawSelect<S, { [K in Alias]: ValueType }>,
      D
    >;
  }

  // @ts-expect-error - intentionally returns different type for type-safety
  override selectJsonText<ValueType = string, Alias extends string = string>(
    column: ModelKey<T> | string,
    path: JsonPathInput,
    alias: Alias,
  ): QueryBuilder<T, ComposeRawSelect<S, { [K in Alias]: ValueType }>, D> {
    super.selectJsonText(column as string, path, alias);
    return this as unknown as QueryBuilder<
      T,
      ComposeRawSelect<S, { [K in Alias]: ValueType }>,
      D
    >;
  }

  // @ts-expect-error - intentionally returns different type for type-safety
  override selectJsonArrayLength<Alias extends string = string>(
    column: ModelKey<T> | string,
    path: JsonPathInput,
    alias: Alias,
  ): QueryBuilder<T, ComposeRawSelect<S, { [K in Alias]: number }>, D> {
    super.selectJsonArrayLength(column as string, path, alias);
    return this as unknown as QueryBuilder<
      T,
      ComposeRawSelect<S, { [K in Alias]: number }>,
      D
    >;
  }

  // @ts-expect-error - intentionally returns different type for type-safety
  override selectJsonKeys<Alias extends string = string>(
    column: ModelKey<T> | string,
    path: JsonPathInput,
    alias: Alias,
  ): QueryBuilder<T, ComposeRawSelect<S, { [K in Alias]: string[] }>, D> {
    super.selectJsonKeys(column as string, path, alias);
    return this as unknown as QueryBuilder<
      T,
      ComposeRawSelect<S, { [K in Alias]: string[] }>,
      D
    >;
  }

  // @ts-expect-error - intentionally returns different type for type-safety
  override selectJsonRaw<ValueType = any, Alias extends string = string>(
    raw: string,
    alias: Alias,
  ): QueryBuilder<T, ComposeRawSelect<S, { [K in Alias]: ValueType }>, D> {
    super.selectJsonRaw(raw, alias);
    return this as unknown as QueryBuilder<
      T,
      ComposeRawSelect<S, { [K in Alias]: ValueType }>,
      D
    >;
  }

  // @ts-expect-error - intentionally returns different type for type-safety
  override countDistinct<Alias extends string = string>(
    column: string,
    alias: Alias,
  ): QueryBuilder<T, ComposeRawSelect<S, { [K in Alias]: number }>, D> {
    super.countDistinct(column, alias);
    return this as unknown as QueryBuilder<
      T,
      ComposeRawSelect<S, { [K in Alias]: number }>,
      D
    >;
  }

  // @ts-expect-error - intentionally returns different type for type-safety
  override sumDistinct<Alias extends string = string>(
    column: string,
    alias: Alias,
  ): QueryBuilder<T, ComposeRawSelect<S, { [K in Alias]: number }>, D> {
    super.sumDistinct(column, alias);
    return this as unknown as QueryBuilder<
      T,
      ComposeRawSelect<S, { [K in Alias]: number }>,
      D
    >;
  }

  // @ts-expect-error - intentionally returns different type for type-safety
  override avgDistinct<Alias extends string = string>(
    column: string,
    alias: Alias,
  ): QueryBuilder<T, ComposeRawSelect<S, { [K in Alias]: number }>, D> {
    super.avgDistinct(column, alias);
    return this as unknown as QueryBuilder<
      T,
      ComposeRawSelect<S, { [K in Alias]: number }>,
      D
    >;
  }

  // @ts-expect-error - intentionally returns different type for type-safety
  override rank<Alias extends string = never>(
    alias?: Alias,
    options?: WindowOptions,
  ): QueryBuilder<T, ComposeRawSelect<S, { [K in Alias]: number }>, D> {
    super.rank(alias, options);
    return this as unknown as QueryBuilder<
      T,
      ComposeRawSelect<S, { [K in Alias]: number }>,
      D
    >;
  }

  // @ts-expect-error - intentionally returns different type for type-safety
  override denseRank<Alias extends string = never>(
    alias?: Alias,
    options?: WindowOptions,
  ): QueryBuilder<T, ComposeRawSelect<S, { [K in Alias]: number }>, D> {
    super.denseRank(alias, options);
    return this as unknown as QueryBuilder<
      T,
      ComposeRawSelect<S, { [K in Alias]: number }>,
      D
    >;
  }

  // @ts-expect-error - intentionally returns different type for type-safety
  override rowNumber<Alias extends string = never>(
    alias?: Alias,
    options?: WindowOptions,
  ): QueryBuilder<T, ComposeRawSelect<S, { [K in Alias]: number }>, D> {
    super.rowNumber(alias, options);
    return this as unknown as QueryBuilder<
      T,
      ComposeRawSelect<S, { [K in Alias]: number }>,
      D
    >;
  }

  /**
   * @description Executes the query and returns true if the query returns at least one result, false otherwise.
   */
  async exists(): Promise<boolean> {
    return !!(await this.one());
  }

  /**
   * @description Executes the query and retrieves multiple results.
   */
  async many(): Promise<S[]> {
    const { sql, bindings } = this.unWrap();
    return this.execSqlWithSlaveHandling("read", (dataSource) =>
      execSql(sql, bindings, dataSource, this.dbType, "rows", {
        timeout: this.queryTimeout,
        queryContext: this.queryContextOptions,
        shouldLog: this.shouldLogQuery,
        sqlLiteOptions: {
          typeofModel: this.model,
          mode: "fetch",
        },
      }),
    );
  }

  then<TResult1 = S[], TResult2 = never>(
    onfulfilled?:
      | ((value: S[]) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined,
  ): Promise<TResult1 | TResult2> {
    return this.many().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | null
      | undefined,
  ): Promise<S[] | TResult> {
    return this.many().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null | undefined): Promise<S[]> {
    return this.many().finally(onfinally);
  }

  /**
   * @description Executes the query and retrieves a single column from the results.
   * @param key - The column to retrieve from the results, must be a Model Column
   */
  async pluck<K extends RawModelKey<T>>(
    key: K,
  ): Promise<PluckReturnType<T, K>> {
    const result = await this.many();
    return result.map(
      (item) => (item as Record<string, any>)[key as string],
    ) as PluckReturnType<T, K>;
  }

  /**
   * @description Executes the query and retrieves a single column from the first result, or undefined when there is none.
   * @param key - A selected column, or any Model column when the query selects everything
   */
  async value<K extends ValueKey<T, S>>(
    key: K,
  ): Promise<PluckReturnType<T, K & RawModelKey<T>>[number] | undefined> {
    const result = await this.limit(1).many();
    if (!result || !result.length) {
      return undefined;
    }

    return (result[0] as Record<string, any>)[key as string] as PluckReturnType<
      T,
      K & RawModelKey<T>
    >[number];
  }

  /**
   * @description Executes the query and retrieves a single result.
   */
  async one(): Promise<S | null> {
    const result = (await this.limit(1).many()) as S[];
    if (!result || !result.length) {
      return null;
    }

    return result[0];
  }

  /**
   * @description Executes the query and retrieves the first result. Fail if no result is found.
   */
  async oneOrFail(): Promise<S> {
    const model = await this.one();
    if (!model) {
      throw new HysteriaError(
        "SqlDataSource::query::oneOrFail",
        "ROW_NOT_FOUND",
      );
    }

    return model;
  }

  /**
   * @description Executes the query and returns a node readable stream.
   * @description If used by a model query builder, it will serialize the models and apply the hooks and relations.
   * @postgres needs the pg-query-stream package in order to work
   * @throws If using postgres and the `pg-query-stream` package is not installed
   */
  async stream<M = S>(
    options: StreamOptions = {},
  ): Promise<PassThrough & AsyncGenerator<M>> {
    const { sql, bindings } = this.unWrap();
    return this.execSqlWithSlaveHandling("read", async (dataSource) => {
      const stream = await execSqlStreaming(
        sql,
        bindings,
        dataSource,
        options,
        {
          onData: (passThrough, row) => {
            passThrough.write(row);
          },
        },
      );

      return stream as PassThrough & AsyncGenerator<M>;
    });
  }

  /**
   * @description Chunks the query into smaller queries, it returns a generator of the chunks
   * @description It will continue to yield chunks until the query returns no results
   * @description Useful for large queries that need to be processed in chunks
   * @warning overrides limit and offset set before in the query builder
   * @warning chunk() methods uses limit-offset that could be slow on a large batch, ensure to use a cursor paginated chunking system for better performance
   * @param chunkSize - The size of the chunk
   * @returns a generator of the chunks
   * @example
   * const chunks = await queryBuilder.chunk(100);
   * // first chunk
   * const firstChunk = await chunks.next();
   * console.log(firstChunk.value);
   * // second chunk
   * const secondChunk = await chunks.next();
   * console.log(secondChunk.value);
   * // third chunk
   * const thirdChunk = await chunks.next();
   * console.log(thirdChunk.value);
   *
   * @example
   * const chunkSize = 3;
   * const chunks = [];
   * const query = sql.from("users").orderBy("name", "asc");
   * for await (const chunk of sql.chunk(chunkSize)) {
   *   chunks.push(chunk);
   * }
   *
   * console.log(chunks);
   */
  async *chunk(chunkSize: number) {
    let offset = 0;

    while (true) {
      const models = await this.limit(chunkSize).offset(offset).many();
      if (!models.length) {
        break;
      }

      offset += models.length;
      yield models;
    }
  }

  /**
   * @description Executes the query and retrieves multiple paginated results.
   * @description Overrides the limit and offset clauses in order to paginate the results.
   * @description Requires an `orderBy` clause to be set on the query — it is the source of truth for the cursor.
   * @throws Throws if no `orderBy` clause is set on the query
   * @warning orderByRaw is not supported for cursor pagination
   */
  async paginateWithCursor(
    limit: number,
    cursor?: Cursor<T, ModelKey<T>>,
  ): Promise<RawCursorPaginatedData<S>> {
    if (!this.orderByNodes.length) {
      throw new HysteriaError(
        this.model.name + "::paginateWithCursor",
        "ORDER_BY_REQUIRED",
      );
    }

    const orderByNodes = this.orderByNodes;
    if (orderByNodes.some((node) => node.isRawValue)) {
      throw new HysteriaError(
        this.model.name + "::paginateWithCursor",
        "ORDER_BY_RAW_NOT_SUPPORTED",
      );
    }

    if (orderByNodes.some((node) => node.nulls)) {
      // The cursor seeks on the ordering column's value, which a null rank would break
      throw new HysteriaError(
        this.model.name + "::paginateWithCursor",
        "ORDER_BY_NULLS_WITH_CURSOR_NOT_SUPPORTED",
      );
    }

    const keys = orderByNodes.map((node) => node.column);
    const operator = orderByNodes[0].direction === "desc" ? "<" : ">";

    if (cursor) {
      const values = Array.isArray(cursor.value)
        ? cursor.value
        : [cursor.value];

      // One AND-chained group so the keyset predicate composes as
      // "WHERE <base> AND ((g0) OR (g1) OR ...)" — sibling where nodes are
      // chained with the NEXT node's chainsWith, so appending bare
      // orWhere() siblings would OR them against any pre-existing WHERE.
      this.andWhere((cursorQuery) => {
        for (let i = 0; i < keys.length; i++) {
          const j = i;
          cursorQuery.orWhere((keysetQuery) => {
            for (let k = 0; k < j; k++) {
              keysetQuery.where(
                keys[k] as ModelKey<T>,
                "=",
                values[k] as WhereColumnValue<T, ModelKey<T>>,
              );
            }
            keysetQuery.where(
              keys[j] as ModelKey<T>,
              operator,
              values[j] as WhereColumnValue<T, ModelKey<T>>,
            );
          });
        }
      });
    }

    this.limit(limit + 1);

    const data = await this.many();
    const hasMore = data.length > limit;
    const pageData = hasMore ? data.slice(0, limit) : data;

    const lastItem = pageData[pageData.length - 1];

    // orderBy columns may be qualified typed refs ("users.age"); returned rows
    // are keyed by the bare model key ("age"), so resolve before reading.
    const rowKeys = keys.map((key) =>
      key.includes(".") ? key.slice(key.lastIndexOf(".") + 1) : key,
    );

    return {
      data: pageData,
      hasMore,
      nextCursor: lastItem
        ? {
            key: rowKeys.length === 1 ? rowKeys[0] : rowKeys,
            value:
              rowKeys.length === 1
                ? (lastItem[rowKeys[0] as keyof typeof lastItem] as
                    | string
                    | number)
                : rowKeys.map(
                    (d) =>
                      lastItem[d as keyof typeof lastItem] as string | number,
                  ),
          }
        : null,
    };
  }

  /**
   * @description Locks the table for update
   * @param skipLocked - If true, the query will skip locked rows
   * @sqlite does not support skipping locked rows, it will be ignored
   */
  lockForUpdate(
    options: { skipLocked?: boolean; noWait?: boolean } = {},
  ): this {
    this.lockQueryNodes.push(
      new LockNode("for_update", options.skipLocked, options.noWait),
    );
    return this;
  }

  /**
   * @description Locks the table for share
   * @param skipLocked - If true, the query will skip locked rows
   * @sqlite does not support skipping locked rows, it will be ignored
   */
  forShare(options: { skipLocked?: boolean; noWait?: boolean } = {}): this {
    this.lockQueryNodes.push(
      new LockNode("for_share", options.skipLocked, options.noWait),
    );
    return this;
  }

  /**
   * @description Locks the selected rows with the `FOR NO KEY UPDATE` strength.
   * Weaker than `FOR UPDATE`: it does not block foreign keys that reference the row.
   * @postgres only
   * @throws HysteriaError if the database type is not postgres
   */
  forNoKeyUpdate(
    options: { skipLocked?: boolean; noWait?: boolean } = {},
  ): this {
    this.assertPgLockStrength("forNoKeyUpdate", "FOR NO KEY UPDATE");
    this.lockQueryNodes.push(
      new LockNode("for_no_key_update", options.skipLocked, options.noWait),
    );
    return this;
  }

  /**
   * @description Locks the selected rows with the `FOR KEY SHARE` strength.
   * The weakest row lock: only blocks updates that change a key value.
   * @postgres only
   * @throws HysteriaError if the database type is not postgres
   */
  forKeyShare(options: { skipLocked?: boolean; noWait?: boolean } = {}): this {
    this.assertPgLockStrength("forKeyShare", "FOR KEY SHARE");
    this.lockQueryNodes.push(
      new LockNode("for_key_share", options.skipLocked, options.noWait),
    );
    return this;
  }

  private assertPgLockStrength(method: string, sql: string): void {
    if (this.dbType !== "postgres") {
      throw new HysteriaError(
        `QueryBuilder::${method}`,
        `LOCK_STRENGTH_NOT_SUPPORTED_IN_${this.dbType.toUpperCase()}` as any,
        new Error(`${sql} is only supported by postgres`),
      );
    }
  }

  /**
   * @description Sets a wall-clock timeout for this query. When exceeded the
   * query rejects with a `QUERY_TIMEOUT` HysteriaError.
   * @param ms - Maximum execution time in milliseconds
   * @param options.cancel - When true, ask the driver to cancel the running
   *   query. Honored by PostgreSQL and MySQL/MariaDB; MSSQL cancels its request;
   *   SQLite and Bun have no cancellation and only enforce the timeout.
   */
  timeout(ms: number, options: { cancel?: boolean } = {}): this {
    this.queryTimeout = { ms, cancel: options.cancel ?? false };
    return this;
  }

  /**
   * @description Attaches extra fields to the query context handed to observers.
   * `sql`, `params`, `id`, `operation` and `timestamp` are always filled in by the runner.
   */
  queryContext(ctx: Partial<QueryContext>): this {
    this.queryContextOptions = { ...this.queryContextOptions, ...ctx };
    return this;
  }

  /**
   * @description Logs this query regardless of the data source setting, or silences it
   * with `false`. Without an argument it turns logging on.
   */
  debug(enable = true): this {
    this.shouldLogQuery = enable;
    return this;
  }

  /**
   * @description Prepends a native SQL comment to the select statement, in the
   * syntax of the active dialect (e.g. `-- line`, `/* block *\/`; MySQL adds
   * `# line` and `/*! executable *\/`). Select-only. Stackable — each call adds
   * its own comment.
   * @throws If the value is not a valid comment for the dialect
   */
  comment(comment: SqlComment<D>): this {
    this.assertValidSqlComment(comment);
    this.comments.push(comment);
    return this;
  }

  /**
   * @description Adds an optimizer hint (`/*+ ... *\/`) immediately after the
   * SELECT keyword, where MySQL/MariaDB read it. Select-only.
   * @description Only callable when the dialect is MySQL/MariaDB; stackable —
   * repeated calls join into a single hint comment.
   * @throws If the value is not a valid optimizer hint
   */
  hintComment(hint: SqlHint<D>): this {
    this.assertValidSqlComment(hint);
    const inner = hint.slice(3, -2).trim();
    const previous = this.hints[0];
    this.hints = [
      previous
        ? `${previous.slice(0, -2).trimEnd()} ${inner} */`
        : `/*+ ${inner} */`,
    ];
    return this;
  }

  /**
   * @description Removes any comment added with `comment()`
   */
  clearComment(): this {
    this.comments = [];
    return this;
  }

  /**
   * @description Removes any hint added with `hintComment()`
   */
  clearHintComment(): this {
    this.hints = [];
    return this;
  }

  /**
   * @description Comments are interpolated into the SQL verbatim, so a value that
   * escapes the comment — a newline inside a line comment, or a nested `*\/` in a
   * block comment — would let the caller inject arbitrary SQL. A `?` is rejected
   * because the driver reads it as a bind placeholder even inside a comment.
   */
  private assertValidSqlComment(value: string): void {
    const invalid = (): never => {
      throw new HysteriaError("QueryBuilder::comment", "INVALID_SQL_COMMENT");
    };

    if (!value.trim().length || value.includes("?")) {
      invalid();
    }

    const isHashComment =
      (this.dbType === "mysql" || this.dbType === "mariadb") &&
      value.startsWith("#");

    if (value.startsWith("--") || isHashComment) {
      if (/[\r\n]/.test(value)) {
        invalid();
      }
      return;
    }

    if (value.startsWith("/*") && value.endsWith("*/") && value.length >= 4) {
      const inner = value.slice(2, -2);
      if (inner.includes("/*") || inner.includes("*/")) {
        invalid();
      }
      return;
    }

    invalid();
  }

  private resolveSetOperationOptions(
    bindingsOrOptions?: any[] | SetOperationOptions,
    options?: SetOperationOptions,
  ): { bindings?: any[]; wrap?: boolean } {
    return {
      bindings: Array.isArray(bindingsOrOptions)
        ? bindingsOrOptions
        : undefined,
      wrap: options?.wrap ?? (bindingsOrOptions as any)?.wrap,
    };
  }

  /**
   * @description Adds a UNION to the query.
   * @param options.wrap - Wraps the branch in parentheses
   */
  union(query: string, bindings?: any[], options?: SetOperationOptions): this;
  union(cb: UnionCallBack<T>, options?: SetOperationOptions): this;
  union(
    queryBuilderOrCb: UnionCallBack<any> | string,
    bindingsOrOptions?: any[] | SetOperationOptions,
    options?: SetOperationOptions,
  ): this {
    const { bindings, wrap } = this.resolveSetOperationOptions(
      bindingsOrOptions,
      options,
    );

    if (typeof queryBuilderOrCb === "string") {
      this.unionNodes.push(
        new UnionNode(queryBuilderOrCb, false, "union", bindings),
      );
      this.unionNodes[this.unionNodes.length - 1].wrap = wrap;
      return this;
    }

    const queryBuilder =
      queryBuilderOrCb instanceof QueryBuilder
        ? queryBuilderOrCb
        : queryBuilderOrCb(new QueryBuilder(this.model, this.sqlDataSource));

    const nodes = queryBuilder.extractQueryNodes();
    const unionNode = new UnionNode(nodes);
    unionNode.wrap = wrap;
    this.unionNodes.push(unionNode);
    return this;
  }

  /**
   * @description Adds a UNION ALL to the query.
   * @param options.wrap - Wraps the branch in parentheses
   */
  unionAll(
    query: string,
    bindings?: any[],
    options?: SetOperationOptions,
  ): this;
  unionAll(cb: UnionCallBack<T>, options?: SetOperationOptions): this;
  unionAll(
    queryBuilder: QueryBuilder<any>,
    options?: SetOperationOptions,
  ): this;
  unionAll(
    queryBuilderOrCb: UnionCallBack<any> | QueryBuilder<any> | string,
    bindingsOrOptions?: any[] | SetOperationOptions,
    options?: SetOperationOptions,
  ): this {
    const { bindings, wrap } = this.resolveSetOperationOptions(
      bindingsOrOptions,
      options,
    );

    if (typeof queryBuilderOrCb === "string") {
      const unionNode = new UnionNode(
        queryBuilderOrCb,
        true,
        "union",
        bindings,
      );
      unionNode.wrap = wrap;
      this.unionNodes.push(unionNode);
      return this;
    }

    const queryBuilder =
      queryBuilderOrCb instanceof QueryBuilder
        ? queryBuilderOrCb
        : queryBuilderOrCb(new QueryBuilder(this.model, this.sqlDataSource));

    const nodes = queryBuilder.extractQueryNodes();
    const unionNode = new UnionNode(nodes, true);
    unionNode.wrap = wrap;
    this.unionNodes.push(unionNode);
    return this;
  }

  /**
   * @description Adds an INTERSECT to the query (keeps only rows present in both queries).
   * @param options.wrap - Wraps the branch in parentheses
   */
  intersect(
    query: string,
    bindings?: any[],
    options?: SetOperationOptions,
  ): this;
  intersect(cb: UnionCallBack<T>, options?: SetOperationOptions): this;
  intersect(
    queryBuilderOrCb: UnionCallBack<any> | string,
    bindingsOrOptions?: any[] | SetOperationOptions,
    options?: SetOperationOptions,
  ): this {
    const { bindings, wrap } = this.resolveSetOperationOptions(
      bindingsOrOptions,
      options,
    );
    const unionNode = new UnionNode(
      this.resolveSetOperationNodes(queryBuilderOrCb),
      false,
      "intersect",
      bindings,
    );
    unionNode.wrap = options?.wrap ?? (bindingsOrOptions as any)?.wrap;
    this.unionNodes.push(unionNode);
    return this;
  }

  /**
   * @description Adds an EXCEPT to the query (keeps rows from the first query not present in the second).
   * @param options.wrap - Wraps the branch in parentheses
   */
  except(query: string, bindings?: any[], options?: SetOperationOptions): this;
  except(cb: UnionCallBack<T>, options?: SetOperationOptions): this;
  except(
    queryBuilderOrCb: UnionCallBack<any> | string,
    bindingsOrOptions?: any[] | SetOperationOptions,
    options?: SetOperationOptions,
  ): this {
    const { bindings, wrap } = this.resolveSetOperationOptions(
      bindingsOrOptions,
      options,
    );
    const unionNode = new UnionNode(
      this.resolveSetOperationNodes(queryBuilderOrCb),
      false,
      "except",
      bindings,
    );
    unionNode.wrap = options?.wrap ?? (bindingsOrOptions as any)?.wrap;
    this.unionNodes.push(unionNode);
    return this;
  }

  private resolveSetOperationNodes(
    queryBuilderOrCb: UnionCallBack<any> | string,
  ): QueryNode | QueryNode[] | string {
    if (typeof queryBuilderOrCb === "string") {
      return queryBuilderOrCb;
    }

    const queryBuilder =
      queryBuilderOrCb instanceof QueryBuilder
        ? queryBuilderOrCb
        : queryBuilderOrCb(new QueryBuilder(this.model, this.sqlDataSource));

    return queryBuilder.extractQueryNodes();
  }

  /**
   * @description Increments the value of a column by a given amount
   * @typeSafe - In typescript, only numeric columns of the model will be accepted if using a Model
   * @default value + 1
   * @returns WriteOperation that resolves to the number of affected rows
   */
  increment(column: string, value: number): WriteOperation<number>;
  increment(column: NumberModelKey<T>, value: number): WriteOperation<number>;
  increment(
    column: NumberModelKey<T> | string,
    value: number = 1,
  ): WriteOperation<number> {
    return this.update({
      [column as string]: this.sqlDataSource.rawStatement(
        `${column as string} + ${value}`,
      ),
    });
  }

  /**
   * @description Decrements the value of a column by a given amount
   * @typeSafe - In typescript, only numeric columns of the model will be accepted if using a Model
   * @default value - 1
   * @returns WriteOperation that resolves to the number of affected rows
   */
  decrement(column: string, value: number): WriteOperation<number>;
  decrement(column: NumberModelKey<T>, value: number): WriteOperation<number>;
  decrement(
    column: NumberModelKey<T> | string,
    value: number = 1,
  ): WriteOperation<number> {
    return this.update({
      [column as string]: this.sqlDataSource.rawStatement(
        `${column as string} - ${value}`,
      ),
    });
  }

  /**
   * @description Executes the query and retrieves the count of results, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getCount(column: string = "*"): Promise<number> {
    this.buildCountQuery(column);
    const result = (await this.one()) as { total: number } | null;
    return result ? coerceToNumber(result.total) : 0;
  }

  /**
   * @description Whether the query's row cardinality differs from the number of underlying
   * rows (e.g. GROUP BY, HAVING, DISTINCT). When true, a plain `count(*)` after clearing the
   * clauses would return the wrong number, so the query must be wrapped as a derived table.
   */
  protected needsDerivedTableCount(): boolean {
    return (
      this.groupByNodes.length > 0 ||
      this.havingNodes.length > 0 ||
      this.distinctNode !== null ||
      this.distinctOnNode !== null
    );
  }

  /**
   * @description Mutates this query builder into a `count(*)` query. For queries whose
   * cardinality differs from the underlying row count (GROUP BY / HAVING / DISTINCT), the
   * original query is wrapped as a derived table so the count reflects the number of groups
   * / distinct rows instead of the raw row count. Otherwise behaves like the historical
   * behavior of clearing select/group/order/limit/offset.
   */
  protected buildCountQuery(column: string = "*"): void {
    if (!this.needsDerivedTableCount()) {
      this.clearForFunctions();
      this.selectRaw(`count(${column}) as total`);
      return;
    }

    // Keep select/from/join/where/groupBy/having/distinct/unions inside the derived table,
    // dropping only the clauses that are irrelevant to a count.
    this.clearOrderBy();
    this.clearLimit();
    this.clearOffset();
    const innerNodes = this.extractQueryNodes();

    // Reset this to be the outer count query over the derived table.
    this.withNodes = [];
    this.distinctNode = null;
    this.distinctOnNode = null;
    this.clearSelect();
    this.fromNode = new FromNode(innerNodes, "g");
    this.joinNodes = [];
    this.whereNodes = [];
    this.groupByNodes = [];
    this.havingNodes = [];
    this.lockQueryNodes = [];
    this.unionNodes = [];
    this.comments = [];
    this.hints = [];
    this.selectRaw(`count(${column}) as total`);
  }

  /**
   * @description Executes the query and retrieves the maximum value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getMax(column: string): Promise<number> {
    this.clearForFunctions();
    this.selectFunc("max", column, "total");
    const result = (await this.one()) as { total: number } | null;
    return result ? coerceToNumber(result.total) : 0;
  }

  /**
   * @description Executes the query and retrieves the minimum value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getMin(column: string): Promise<number> {
    this.clearForFunctions();
    this.selectFunc("min", column, "total");
    const result = (await this.one()) as { total: number } | null;
    return result ? coerceToNumber(result.total) : 0;
  }

  /**
   * @description Executes the query and retrieves the average value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getAvg(column: string): Promise<number> {
    this.clearForFunctions();
    this.selectFunc("avg", column, "total");
    const result = (await this.one()) as { total: number } | null;
    return result ? coerceToNumber(result.total) : 0;
  }

  /**
   * @description Executes the query and retrieves the sum of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getSum(column: string): Promise<number> {
    this.clearForFunctions();
    this.selectFunc("sum", column, "total");
    const result = (await this.one()) as { total: number } | null;
    return result ? coerceToNumber(result.total) : 0;
  }

  /**
   * @description Introspects column metadata for the query's table. With a
   * column name it returns that column's info, otherwise every column.
   */
  async columnInfo(): Promise<TableColumnInfo[]>;
  async columnInfo(column: string): Promise<TableColumnInfo | undefined>;
  async columnInfo(
    column?: string,
  ): Promise<TableColumnInfo[] | TableColumnInfo | undefined> {
    const table =
      typeof this.fromNode.table === "string"
        ? this.fromNode.table
        : this.model.table;
    const dataSource = await this.getSqlDataSource("read");
    const columns = await dataSource.getTableInfo(table);

    if (column === undefined) {
      return columns;
    }

    return columns.find((info) => info.name === column);
  }

  /**
   * @description Executes the query and retrieves multiple paginated results.
   * @description Overrides the limit and offset clauses in order to paginate the results.
   */
  async paginate(page: number, perPage: number): Promise<RawPaginatedData<S>> {
    if (typeof page !== "number" || typeof perPage !== "number") {
      logger.warn(
        `${this.model.name}::paginate Non numeric values provided to \`paginate\``,
      );
    }

    const countQueryBuilder = this.clone();
    const paginatedQuery = this.limit(perPage).offset((page - 1) * perPage);

    const [models, total] = await this.executePaginateQueries(
      () => paginatedQuery.many(),
      () => countQueryBuilder.getCount("*"),
    );

    const paginationMetadata = getPaginationMetadata(page, perPage, total);

    return {
      paginationMetadata,
      data: models,
    };
  }

  /**
   * @description Overrides the from clause in the query.
   * @description If subquery is provided, alias must be provided too
   */
  table<S extends string>(table: TableFormat<S>, maybeAlias?: string): this;
  table<S extends string>(
    cb: (qb: QueryBuilder<T>) => void | SubQueryable,
    alias: string,
  ): this;
  table<S extends string>(
    tableOrCb: TableFormat<S> | ((qb: QueryBuilder<T>) => void | SubQueryable),
    maybeAlias?: string,
  ): this {
    if (typeof tableOrCb === "function") {
      if (!maybeAlias) {
        throw new HysteriaError(
          "QueryBuilder::table",
          "MISSING_ALIAS_FOR_SUBQUERY",
        );
      }

      const subQueryBuilder = new QueryBuilder<T>(
        this.model,
        this.sqlDataSource,
      );

      const cbResult = tableOrCb(subQueryBuilder);
      const resolvedFrom: SubQueryable =
        cbResult != null && "extractQueryNodes" in cbResult
          ? cbResult
          : subQueryBuilder;
      const subQueryNodes = resolvedFrom.extractQueryNodes();
      this.fromNode = new FromNode(subQueryNodes, maybeAlias);
      return this;
    }

    this.fromNode = new FromNode(tableOrCb, maybeAlias);
    return this;
  }

  /**
   * @description Sets the schema (search path) applied to every table reference in
   * this query, rendering two-part names such as `schema.table`.
   */
  withSchema(schemaName: string): this {
    this.schemaName = schemaName;
    return this;
  }

  /**
   * @description Uses a raw SQL fragment as the FROM source. `?` placeholders are
   * rewritten to the dialect's placeholders, in order with the rest of the query.
   */
  fromRaw(raw: string, bindings: any[] = []): this {
    this.fromNode = new FromNode(new RawNode(raw, bindings));
    return this;
  }

  /**
   * @description Renders the FROM clause as `from only <table>`, skipping rows of
   * tables that inherit from it. PostgreSQL only.
   */
  fromOnly(enable = true): this {
    if (this.dbType !== "postgres") {
      throw new HysteriaError("QueryBuilder::fromOnly", "ONLY_NOT_SUPPORTED");
    }

    this.fromNode.only = enable;
    return this;
  }

  /**
   * @description Adds a CTE to the query using a callback to build the subquery.
   * @param columns - Optional explicit column list for the CTE (`with t (a, b) as (...)`)
   */
  with(alias: string, cb: (qb: QueryBuilder<T>) => void | SubQueryable): this;
  with(
    alias: string,
    columns: string[],
    cb: (qb: QueryBuilder<T>) => void | SubQueryable,
  ): this;
  with(
    alias: string,
    columnsOrCb: string[] | ((qb: QueryBuilder<T>) => void | SubQueryable),
    maybeCb?: (qb: QueryBuilder<T>) => void | SubQueryable,
  ): this {
    const columns = Array.isArray(columnsOrCb) ? columnsOrCb : undefined;
    const cb = Array.isArray(columnsOrCb) ? maybeCb! : columnsOrCb;
    const subQuery = new QueryBuilder<T>(this.model, this.sqlDataSource);
    const result = cb(subQuery);
    const resolved: SubQueryable =
      result != null && "extractQueryNodes" in result ? result : subQuery;
    this.withNodes.push(
      new WithNode("normal", alias, resolved.extractQueryNodes(), columns),
    );
    return this;
  }

  /**
   * @description Adds a recursive CTE to the query using a callback to build the subquery.
   * @mssql not supported
   */
  withRecursive(
    alias: string,
    cb: (qb: QueryBuilder<T>) => void | SubQueryable,
  ): this {
    const subQuery = new QueryBuilder<T>(this.model, this.sqlDataSource);
    const result = cb(subQuery);
    const resolved: SubQueryable =
      result != null && "extractQueryNodes" in result ? result : subQuery;
    this.withNodes.push(
      new WithNode("recursive", alias, resolved.extractQueryNodes()),
    );
    return this;
  }

  /**
   * @description Adds a materialized CTE to the query using a callback to build the subquery.
   * @postgres/cockroachdb/sqlite only
   * @throws HysteriaError if the dialect has no `as materialized`
   */
  withMaterialized(
    alias: string,
    cb: (qb: QueryBuilder<T>) => void | SubQueryable,
  ): this {
    if (!MATERIALIZED_CTE_DIALECTS.includes(this.dbType)) {
      throw new HysteriaError(
        "QueryBuilder::withMaterialized",
        "MATERIALIZED_CTE_NOT_SUPPORTED",
        new Error(`MATERIALIZED CTE is not supported by ${this.dbType}`),
      );
    }

    const subQuery = new QueryBuilder<T>(this.model, this.sqlDataSource);
    const result = cb(subQuery);
    const resolved: SubQueryable =
      result != null && "extractQueryNodes" in result ? result : subQuery;
    this.withNodes.push(
      new WithNode("materialized", alias, resolved.extractQueryNodes()),
    );
    return this;
  }

  /**
   * @description Adds a non-materialized CTE to the query using a callback to build the subquery.
   * @postgres/cockroachdb only
   * @throws HysteriaError if the dialect has no `as not materialized`
   */
  withNotMaterialized(
    alias: string,
    cb: (qb: QueryBuilder<T>) => void | SubQueryable,
  ): this {
    if (this.dbType !== "postgres" && this.dbType !== "cockroachdb") {
      throw new HysteriaError(
        "QueryBuilder::withNotMaterialized",
        "NOT_MATERIALIZED_CTE_NOT_SUPPORTED",
        new Error(`NOT MATERIALIZED CTE is not supported by ${this.dbType}`),
      );
    }

    const subQuery = new QueryBuilder<T>(this.model, this.sqlDataSource);
    const result = cb(subQuery);
    const resolved: SubQueryable =
      result != null && "extractQueryNodes" in result ? result : subQuery;
    this.withNodes.push(
      new WithNode("not materialized", alias, resolved.extractQueryNodes()),
    );
    return this;
  }

  /**
   * @description Insert record into a table, you can use raw statements in the data object for literal references to other columns
   * @param returning - The columns to return from the query, only supported by postgres and cockroachdb - default is "*"
   * @returns WriteOperation that executes when awaited
   */
  insert(
    data: Record<string, WriteQueryParam>,
    returning: string[],
  ): InsertWriteOperation<T>;
  insert(data: Record<string, WriteQueryParam>): InsertWriteOperation<void>;
  insert(
    data: Record<string, WriteQueryParam>,
    returning?: string[],
  ): InsertWriteOperation<T | void> {
    this.assertWriteClausesSupported("QueryBuilder::insert");

    const insertObject = Object.fromEntries(
      Object.keys(data).map((column) => [column, data[column]]),
    );

    const shouldDisableReturning = !returning || returning.length === 0;

    this.insertNodeSource = undefined;
    this.insertConflictConfig = null;
    this.onDuplicateNode = null;
    this.insertNode = new InsertNode(
      this.fromNode,
      [this.interpreterUtils.stripComputedFromData(insertObject)],
      returning as string[] | undefined,
      shouldDisableReturning,
    );

    return new InsertWriteOperation<T | void>(
      () => this.unWrap(),
      () => this.toSql(),
      () => this.toQuery(),
      async () => {
        const { columns: preparedColumns, values: preparedValues } =
          this.interpreterUtils.prepareColumns(
            Object.keys(data),
            Object.values(data),
            "insert",
            this.dbType,
          );

        const preparedInsertObject = Object.fromEntries(
          preparedColumns.map((column, index) => [
            column,
            preparedValues[index],
          ]),
        );

        const conflict = this.insertConflictConfig;

        this.insertNode = new InsertNode(
          this.fromNode,
          [preparedInsertObject],
          conflict ? undefined : (returning as string[] | undefined),
          conflict ? true : shouldDisableReturning,
        );

        if (conflict && this.dbType === "mssql") {
          const mergedRows = await this.executeMssqlMergeRaw(
            [preparedInsertObject],
            conflict.conflictColumns,
            conflict.columnsToUpdate,
            { updateOnConflict: conflict.mode === "update", returning },
            [data],
          );

          return shouldDisableReturning ? undefined : mergedRows[0];
        }

        const { sql, bindings } = this.astParser.parse(
          this.extractWriteNodes(),
        );

        const dataSource = await this.getSqlDataSource("write");
        const rows = await execSql(
          sql,
          bindings,
          dataSource,
          this.dbType,
          "rows",
          {
            timeout: this.queryTimeout,
            queryContext: this.queryContextOptions,
            shouldLog: this.shouldLogQuery,
            sqlLiteOptions: {
              typeofModel: this.model,
              mode: conflict ? "raw" : "insertOne",
              models: [data as unknown as T],
            },
          },
        );

        if (shouldDisableReturning) {
          return undefined;
        }

        return Array.isArray(rows) && rows.length ? rows[0] : rows;
      },
      this.buildInsertConflictCommit(returning as string[] | undefined),
      this.interpreterUtils.filterComputedColumns(Object.keys(data)),
      "QueryBuilder::insert",
    );
  }

  /**
   * @description Insert multiple records into a table
   * @param returning - The columns to return from the query, only supported by postgres and cockroachdb - default is "*"
   * @returns WriteOperation that executes when awaited
   */
  insertMany(
    data: Record<string, WriteQueryParam>[],
    returning: string[],
  ): InsertWriteOperation<T[]>;
  insertMany(
    data: Record<string, WriteQueryParam>[],
  ): InsertWriteOperation<void>;
  insertMany(
    data: Record<string, WriteQueryParam>[],
    returning?: string[],
  ): InsertWriteOperation<T[] | void> {
    this.assertWriteClausesSupported("QueryBuilder::insertMany");

    const rawModels = data.map((model) =>
      this.interpreterUtils.stripComputedFromData(
        Object.fromEntries(
          Object.keys(model).map((column) => [column, model[column]]),
        ),
      ),
    );

    const shouldDisableReturning = !returning || returning.length === 0;

    this.insertNodeSource = undefined;
    this.insertConflictConfig = null;
    this.onDuplicateNode = null;
    this.insertNode = new InsertNode(
      this.fromNode,
      rawModels,
      returning as string[] | undefined,
      shouldDisableReturning,
    );

    return new InsertWriteOperation<T[] | void>(
      () => this.unWrap(),
      () => this.toSql(),
      () => this.toQuery(),
      async () => {
        if (!data.length) {
          return shouldDisableReturning ? undefined : [];
        }

        const models = await Promise.all(
          data.map(async (model) => {
            const { columns: preparedColumns, values: preparedValues } =
              this.interpreterUtils.prepareColumns(
                Object.keys(model),
                Object.values(model),
                "insert",
                this.dbType,
              );

            return Object.fromEntries(
              preparedColumns.map((column, index) => [
                column,
                preparedValues[index],
              ]),
            );
          }),
        );

        const conflict = this.insertConflictConfig;

        this.insertNode = new InsertNode(
          this.fromNode,
          models,
          conflict ? undefined : (returning as string[] | undefined),
          conflict ? true : shouldDisableReturning,
        );

        if (conflict && this.dbType === "mssql") {
          return this.executeMssqlMergeRaw(
            models,
            conflict.conflictColumns,
            conflict.columnsToUpdate,
            { updateOnConflict: conflict.mode === "update", returning },
            data,
          );
        }

        const { sql, bindings } = this.astParser.parse(
          this.extractWriteNodes(),
        );

        const dataSource = await this.getSqlDataSource("write");
        const rows = await execSql(
          sql,
          bindings,
          dataSource,
          this.dbType,
          "rows",
          {
            timeout: this.queryTimeout,
            queryContext: this.queryContextOptions,
            shouldLog: this.shouldLogQuery,
            sqlLiteOptions: {
              typeofModel: this.model,
              mode: conflict ? "raw" : "insertMany",
              models: models as T[],
            },
          },
        );

        if (shouldDisableReturning) {
          return undefined;
        }

        return rows;
      },
      this.buildInsertConflictCommit(returning as string[] | undefined),
      data.length
        ? this.interpreterUtils.filterComputedColumns(Object.keys(data[0]))
        : [],
      "QueryBuilder::insertMany",
    );
  }

  /**
   * @description Inserts rows in chunks of `chunkSize`, one statement per chunk, for
   * when a single `insertMany` would exceed the driver's parameter limit
   * @description The chunks are not wrapped in a transaction; wrap the call in
   * `sql.transaction(...)` when the whole batch has to be atomic
   * @returns The rows read back per chunk, empty without `returning`
   */
  async batchInsert(
    data: Record<string, WriteQueryParam>[],
    options: { chunkSize?: number; returning?: string[] } = {},
  ): Promise<T[]> {
    const chunkSize = this.resolveBatchSize(options.chunkSize);
    const inserted: T[] = [];

    for (let index = 0; index < data.length; index += chunkSize) {
      const chunk = data.slice(index, index + chunkSize);
      const rows = options.returning?.length
        ? await this.insertMany(chunk, options.returning)
        : await this.insertMany(chunk);

      if (rows) {
        inserted.push(...(rows as T[]));
      }
    }

    return inserted;
  }

  protected resolveBatchSize(chunkSize?: number): number {
    const size = chunkSize ?? 500;
    if (!Number.isInteger(size) || size < 1) {
      throw new HysteriaError(
        "QueryBuilder::batchInsert",
        "INVALID_BATCH_SIZE",
      );
    }

    return size;
  }

  /**
   * @description Updates or creates a new record using upsert functionality
   * @param data The data to insert or update
   * @param searchCriteria The criteria to search for existing records
   * @param options Upsert options including updateOnConflict and returning columns
   * @returns WriteOperation that executes when awaited
   */
  upsert<O extends Record<string, any>>(
    data: O,
    searchCriteria: Partial<O>,
    options: UpsertOptionsRawBuilder = {
      updateOnConflict: true,
    },
  ): WriteOperation<T[]> {
    return this.buildRawUpsert(
      [
        {
          ...searchCriteria,
          ...data,
        } as Record<string, WriteQueryParam>,
      ],
      Object.keys(searchCriteria),
      this.interpreterUtils.filterComputedColumns(Object.keys(data)),
      options,
    );
  }

  /**
   * @description Updates or creates multiple records using upsert functionality
   * @param conflictColumns The columns to check for conflicts
   * @param columnsToUpdate The columns to update on conflict
   * @param data Array of data objects to insert or update
   * @param options Upsert options including updateOnConflict and returning columns
   * @returns WriteOperation that executes when awaited
   */
  upsertMany<O extends Record<string, any>>(
    conflictColumns: string[],
    columnsToUpdate: string[],
    data: O[],
    options: UpsertOptionsRawBuilder = {
      updateOnConflict: true,
    },
  ): WriteOperation<T[]> {
    return this.buildRawUpsert(
      data as unknown as Record<string, WriteQueryParam>[],
      conflictColumns,
      this.interpreterUtils.filterComputedColumns(columnsToUpdate),
      options,
    );
  }

  private buildRawUpsert(
    data: Record<string, WriteQueryParam>[],
    conflictColumns: string[],
    columnsToUpdate: string[],
    options: UpsertOptionsRawBuilder,
  ): WriteOperation<T[]> {
    const returning = options.returning?.length
      ? [...options.returning]
      : undefined;

    const operation = (returning
      ? this.insertMany(data, returning)
      : this.insertMany(data)) as unknown as InsertWriteOperation<T[]>;

    const committed =
      (options.updateOnConflict ?? true)
        ? operation.onConflict(conflictColumns).merge(columnsToUpdate)
        : operation.onConflict(conflictColumns).ignore();

    // MySQL, MariaDB and SQLite resolve an insert to the driver's result object
    // rather than a row list, so upsert keeps wrapping it in an array
    return new WriteOperation<T[]>(
      () => committed.unWrap(),
      () => committed.toSql(),
      () => committed.toQuery(),
      async () => {
        const result = await committed;
        return (Array.isArray(result) ? result : [result]) as T[];
      },
    );
  }

  private buildInsertConflictCommit(
    returning?: string[],
  ): (config: InsertConflictConfig) => void {
    return (config) => {
      this.insertConflictConfig = config;

      const targetless =
        config.conflictColumns.length === 0 &&
        !config.conflictTargetRaw &&
        !config.conflictConstraint;

      const isMysqlFamily =
        this.dbType === "mysql" || this.dbType === "mariadb";

      if (
        config.conflictTargetRaw &&
        (isMysqlFamily || this.dbType === "mssql")
      ) {
        throw new HysteriaError(
          "QueryBuilder::onConflict",
          `NOT_SUPPORTED_IN_${this.dbType.toUpperCase()}`,
          new Error(
            `${this.dbType} cannot express a raw ON CONFLICT target; pass the conflict columns`,
          ),
        );
      }

      if (
        config.conflictConstraint &&
        this.dbType !== "postgres" &&
        this.dbType !== "cockroachdb"
      ) {
        throw new HysteriaError(
          "QueryBuilder::onConflict",
          `NOT_SUPPORTED_IN_${this.dbType.toUpperCase()}`,
          new Error(
            `${this.dbType} cannot name a constraint in ON CONFLICT; only PostgreSQL and CockroachDB can`,
          ),
        );
      }

      if (targetless && this.dbType === "mssql") {
        throw new HysteriaError(
          "QueryBuilder::onConflict",
          "NOT_SUPPORTED_IN_MSSQL",
          new Error(
            "MSSQL cannot express a target-less ON CONFLICT; provide the conflict columns",
          ),
        );
      }

      // MySQL/MariaDB resolve a target-less ignore through INSERT IGNORE, not ON DUPLICATE KEY
      const useInsertIgnore = targetless && isMysqlFamily;

      // RETURNING must follow the conflict clause, so it moves off the insert node
      this.insertNode = new InsertNode(
        this.fromNode,
        this.insertNode?.records ?? [],
        undefined,
        true,
        false,
        {
          source: this.insertNode?.source,
          targetColumns: this.insertNode?.targetColumns,
        },
      );

      // MSSQL cannot express a conflict clause and uses a hand-built MERGE instead
      this.onDuplicateNode =
        this.dbType === "mssql" || useInsertIgnore
          ? null
          : new OnDuplicateNode(
              this.model.table,
              config.conflictColumns,
              config.columnsToUpdate,
              config.mode,
              returning?.length ? returning : undefined,
            );

      if (!this.onDuplicateNode) {
        return;
      }

      this.onDuplicateNode.conflictTargetRaw = config.conflictTargetRaw;
      this.onDuplicateNode.conflictConstraint = config.conflictConstraint;

      if (config.mergeWhere) {
        if (isMysqlFamily || this.dbType === "mssql") {
          throw new HysteriaError(
            "QueryBuilder::merge",
            "MERGE_WHERE_NOT_SUPPORTED",
            new Error(
              `${this.dbType} has no WHERE clause on its conflict update`,
            ),
          );
        }

        const nestedBuilder = new QueryBuilder(this.model, this.sqlDataSource);
        (nestedBuilder as any).isNestedCondition = true;
        config.mergeWhere(
          nestedBuilder as unknown as WhereOnlyQueryBuilder<any>,
        );
        this.onDuplicateNode.whereNodes = (nestedBuilder as any).whereNodes;
      }
    };
  }

  /**
   * @description Inserts the rows produced by a SELECT (or a CTE feeding one) into the table.
   * @param targetColumns - Optional destination column list; positional when omitted
   * @param source - A builder (or callback) whose SELECT becomes the insert source
   * @returns InsertWriteOperation, so `onConflict(...).merge()/.ignore()` chains onto it
   * @warning Rows come from the database, so no validation, hooks or autoCreate columns run
   */
  insertFrom(
    source:
      | QueryBuilder<any>
      | ((qb: QueryBuilder<any>) => QueryBuilder<any> | void),
  ): InsertWriteOperation<T[]>;
  insertFrom<C extends string>(
    targetColumns: C[],
    source:
      | QueryBuilder<any>
      | ((qb: QueryBuilder<any>) => QueryBuilder<any> | void),
  ): InsertWriteOperation<T[]>;
  insertFrom<C extends string>(
    targetColumnsOrSource:
      | C[]
      | QueryBuilder<any>
      | ((qb: QueryBuilder<any>) => QueryBuilder<any> | void),
    maybeSource?:
      | QueryBuilder<any>
      | ((qb: QueryBuilder<any>) => QueryBuilder<any> | void),
  ): InsertWriteOperation<T[]> {
    this.assertWriteClausesSupported("QueryBuilder::insertFrom");

    const hasTargets = Array.isArray(targetColumnsOrSource);
    const targetColumns = hasTargets
      ? (targetColumnsOrSource as string[])
      : undefined;
    const sourceArg = hasTargets ? maybeSource! : targetColumnsOrSource;

    const sourceBuilder =
      typeof sourceArg === "function"
        ? sourceArg(new QueryBuilder<any>(this.model, this.sqlDataSource))
        : sourceArg;

    const resolved: SubQueryable =
      sourceBuilder != null && "extractQueryNodes" in sourceBuilder
        ? sourceBuilder
        : (sourceArg as QueryBuilder<any>);

    return this.buildInsertFrom(resolved.extractQueryNodes(), targetColumns);
  }

  protected buildInsertFrom(
    sourceNodes: QueryNode[],
    targetColumns?: string[],
  ): InsertWriteOperation<T[]> {
    this.insertNodeSource = sourceNodes;
    this.insertConflictConfig = null;
    this.onDuplicateNode = null;
    this.insertNode = new InsertNode(
      this.fromNode,
      [],
      undefined,
      true,
      false,
      {
        source: sourceNodes,
        targetColumns,
      },
    );

    return new InsertWriteOperation<T[]>(
      () => this.unWrap(),
      () => this.toSql(),
      () => this.toQuery(),
      async () => {
        const { sql, bindings } = this.astParser.parse(
          this.extractWriteNodes(),
        );

        const dataSource = await this.getSqlDataSource("write");
        const rows = await execSql(
          sql,
          bindings,
          dataSource,
          this.dbType,
          "rows",
          {
            timeout: this.queryTimeout,
            queryContext: this.queryContextOptions,
            shouldLog: this.shouldLogQuery,
          },
        );

        return (Array.isArray(rows) ? rows : [rows]) as T[];
      },
      this.buildInsertConflictCommit(),
      targetColumns
        ? this.interpreterUtils.filterComputedColumns(targetColumns)
        : [],
      "QueryBuilder::insertFrom",
    );
  }

  /**
   * @description Executes a MERGE statement for MSSQL upsert operations (raw query builder)
   */
  private async executeMssqlMergeRaw<O extends Record<string, any>>(
    insertObjects: Record<string, any>[],
    conflictColumns: string[],
    columnsToUpdate: string[],
    options: UpsertOptionsRawBuilder,
    data: O[],
  ): Promise<T[]> {
    if (!insertObjects.length) {
      return [];
    }

    const columns = Object.keys(insertObjects[0]);
    const formattedTable = this.interpreterUtils.formatStringColumn(
      "mssql",
      this.model.table,
    );

    const formatCol = (col: string) =>
      this.interpreterUtils.formatStringColumn("mssql", col);

    // Build source values for MERGE
    const bindings: any[] = [];
    const sourceRows = insertObjects.map((obj) => {
      const rowValues = columns.map((col) => {
        bindings.push(obj[col]);
        return `@${bindings.length}`;
      });
      return `select ${rowValues.join(", ")}`;
    });

    const sourceColumns = columns.map(formatCol).join(", ");
    const sourceQuery = sourceRows.join(" union all ");

    // Build ON condition for conflict columns
    const onCondition = conflictColumns
      .map((col) => `target.${formatCol(col)} = source.${formatCol(col)}`)
      .join(" and ");

    // Build UPDATE SET clause
    const updateSet = columnsToUpdate
      .filter((col) => !conflictColumns.includes(col))
      .map((col) => `target.${formatCol(col)} = source.${formatCol(col)}`)
      .join(", ");

    // Build INSERT columns and values
    const insertCols = columns.map(formatCol).join(", ");
    const insertVals = columns
      .map((col) => `source.${formatCol(col)}`)
      .join(", ");

    // Build OUTPUT clause
    const outputCols =
      options.returning && options.returning.length
        ? options.returning
            .map((col) => `inserted.${formatCol(col)}`)
            .join(", ")
        : columns.map((col) => `inserted.${formatCol(col)}`).join(", ");

    // Construct MERGE statement
    const updateOnConflict = options.updateOnConflict ?? true;
    const whenMatchedClause =
      updateOnConflict && updateSet
        ? `when matched then update set ${updateSet}`
        : "";

    const sql =
      `merge into ${formattedTable} as target ` +
      `using (${sourceQuery}) as source (${sourceColumns}) ` +
      `on ${onCondition} ` +
      `${whenMatchedClause} ` +
      `when not matched then insert (${insertCols}) values (${insertVals}) ` +
      `output ${outputCols};`;

    const dataSource = await this.getSqlDataSource("write");
    const rawResult = await execSql(
      sql,
      bindings,
      dataSource,
      this.dbType,
      "rows",
      {
        timeout: this.queryTimeout,
        queryContext: this.queryContextOptions,
        shouldLog: this.shouldLogQuery,
        sqlLiteOptions: {
          typeofModel: this.model,
          mode: "raw",
          models: data as unknown as T[],
        },
      },
    );

    return (Array.isArray(rawResult)
      ? rawResult
      : [rawResult]) as unknown as T[];
  }

  /**
   * @description Sets the source of an `update ... from <table>` statement, so the
   * update can read from another table. Pass a table name, or a callback to build a
   * subquery with its alias.
   * @postgres/cockroachdb/mssql only
   */
  updateFrom<X extends string>(
    table: TableFormat<X>,
    maybeAlias?: string,
  ): this;
  updateFrom(
    cb: (qb: QueryBuilder<T>) => void | SubQueryable,
    alias: string,
  ): this;
  updateFrom(
    tableOrCb:
      | TableFormat<string>
      | ((qb: QueryBuilder<T>) => void | SubQueryable),
    maybeAlias?: string,
  ): this {
    if (
      this.dbType !== "postgres" &&
      this.dbType !== "cockroachdb" &&
      this.dbType !== "mssql"
    ) {
      throw new HysteriaError(
        "QueryBuilder::updateFrom",
        "UPDATE_FROM_NOT_SUPPORTED",
      );
    }

    this.updateFromNode = this.buildFromSource(
      "QueryBuilder::updateFrom",
      tableOrCb,
      maybeAlias,
    );
    return this;
  }

  /**
   * @description Sets the source of a `delete ... using <table>` statement, so the
   * delete can match rows against another table.
   * @postgres/cockroachdb only
   */
  deleteUsing<X extends string>(
    table: TableFormat<X>,
    maybeAlias?: string,
  ): this;
  deleteUsing(
    cb: (qb: QueryBuilder<T>) => void | SubQueryable,
    alias: string,
  ): this;
  deleteUsing(
    tableOrCb:
      | TableFormat<string>
      | ((qb: QueryBuilder<T>) => void | SubQueryable),
    maybeAlias?: string,
  ): this {
    if (this.dbType !== "postgres" && this.dbType !== "cockroachdb") {
      throw new HysteriaError(
        "QueryBuilder::deleteUsing",
        "DELETE_USING_NOT_SUPPORTED",
      );
    }

    this.deleteUsingNode = this.buildFromSource(
      "QueryBuilder::deleteUsing",
      tableOrCb,
      maybeAlias,
    );
    return this;
  }

  /**
   * @description Builds a from node outside of the main FROM slot, for the auxiliary
   * sources a write statement can take (`update ... from`, `delete ... using`).
   */
  private buildFromSource(
    method: string,
    tableOrCb:
      | TableFormat<string>
      | ((qb: QueryBuilder<T>) => void | SubQueryable),
    alias?: string,
  ): FromNode {
    if (typeof tableOrCb !== "function") {
      return new FromNode(tableOrCb, alias);
    }

    if (!alias) {
      throw new HysteriaError(method, "MISSING_ALIAS_FOR_SUBQUERY");
    }

    const subQueryBuilder = new QueryBuilder<T>(this.model, this.sqlDataSource);
    const cbResult = tableOrCb(subQueryBuilder);
    const resolved: SubQueryable =
      cbResult != null && "extractQueryNodes" in cbResult
        ? cbResult
        : subQueryBuilder;

    return new FromNode(resolved.extractQueryNodes(), alias);
  }

  /**
   * @description Updates records from a table, you can use raw statements in the data object for literal references to other columns
   * @param data - Object with column-value pairs to update, or a single column name
   * @param value - The value when updating a single column
   * @param returning - Optional array of column names to return from the updated rows.
   *   **Note:** The `returning` parameter is only supported on PostgreSQL, CockroachDB, SQLite, and MSSQL.
   *   For MySQL and MariaDB, do not pass `returning` — the method will return the number of affected rows instead.
   * @returns WriteOperation that resolves to the number of affected rows, or the specified columns if `returning` is provided
   */
  update(
    column: string,
    value: WriteQueryParam,
    returning?: string[],
  ): WriteOperation<any>;
  update(
    data: Record<string, WriteQueryParam>,
    returning?: string[],
  ): WriteOperation<any>;
  update(
    dataOrColumn: Record<string, WriteQueryParam> | string,
    valueOrReturning?: WriteQueryParam | string[],
    maybeReturning?: string[],
  ): WriteOperation<any> {
    const data =
      typeof dataOrColumn === "string"
        ? { [dataOrColumn]: valueOrReturning }
        : dataOrColumn;
    const returning = (
      typeof dataOrColumn === "string" ? maybeReturning : valueOrReturning
    ) as string[] | undefined;

    this.assertWriteClausesSupported("QueryBuilder::update", {
      allowCte: false,
    });

    const strippedData = this.interpreterUtils.stripComputedFromData(data);
    const rawColumns = Object.keys(strippedData);
    const rawValues = Object.values(strippedData);

    if (!rawColumns.length) {
      throw new HysteriaError(
        "QueryBuilder::update",
        "UPDATE_REQUIRES_COLUMNS",
      );
    }

    this.updateNode = new UpdateNode(this.fromNode, rawColumns, rawValues);
    this.returningNode = this.buildReturningNode("update", returning);

    const hasReturning = this.returningNode !== null;

    return new WriteOperation(
      () => this.unWrap(),
      () => this.toSql(),
      () => this.toQuery(),
      async () => {
        const { columns, values } = this.interpreterUtils.prepareColumns(
          rawColumns,
          rawValues,
          "update",
          this.dbType,
        );

        this.updateNode = new UpdateNode(this.fromNode, columns, values);
        const { sql, bindings } = this.astParser.parse(
          this.extractWriteNodes(),
        );

        const dataSource = await this.getSqlDataSource("write");
        return execSql(
          sql,
          bindings,
          dataSource,
          this.dbType,
          hasReturning ? "rows" : "affectedRows",
          {
            timeout: this.queryTimeout,
            queryContext: this.queryContextOptions,
            shouldLog: this.shouldLogQuery,
            sqlLiteOptions: {
              typeofModel: this.model,
              mode: hasReturning ? "fetch" : "affectedRows",
            },
          },
        );
      },
    );
  }

  /**
   * @description Builds a returning clause for update/delete where the dialect has one.
   * SQLite and PostgreSQL accept it only as a trailing clause; MSSQL's `output` must sit
   * between `set` and `where`, so it goes straight after the write node.
   */
  protected buildReturningNode(
    op: "update" | "delete",
    returning?: string[],
  ): ReturningNode | null {
    if (
      !returning?.length ||
      !this.interpreterUtils.dialectEmitsReturning(this.dbType)
    ) {
      return null;
    }

    return new ReturningNode(
      returning,
      op === "delete" ? "deleted" : "inserted",
    );
  }

  protected withReturningNode<N>(nodes: N[]): (N | ReturningNode)[] {
    if (!this.returningNode) {
      return nodes;
    }

    if (this.dbType === "mssql") {
      const [writeNode, ...rest] = nodes;
      return [writeNode, this.returningNode, ...rest];
    }

    return [...nodes, this.returningNode];
  }

  /**
   * @description Deletes all records from a table
   * @param options - `RESTART IDENTITY` / `CONTINUE IDENTITY` / `CASCADE` (PostgreSQL and CockroachDB only)
   * @warning This operation does not trigger any hook
   * @returns WriteOperation that executes when awaited
   */
  truncate(options: TruncateOptions = {}): WriteOperation<void> {
    this.assertWriteClausesSupported("QueryBuilder::truncate");

    if (this.withNodes.length) {
      throw new HysteriaError(
        "QueryBuilder::truncate",
        "CTE_NOT_SUPPORTED_ON_TRUNCATE",
      );
    }

    this.truncateNode = new TruncateNode(this.fromNode, false, options);

    return new WriteOperation(
      () => this.unWrap(),
      () => this.toSql(),
      () => this.toQuery(),
      async () => {
        const { sql, bindings } = this.astParser.parse(
          this.extractWriteNodes(),
        );
        const dataSource = await this.getSqlDataSource("write");
        await execSql(sql, bindings, dataSource, this.dbType, "rows", {
          timeout: this.queryTimeout,
          queryContext: this.queryContextOptions,
          shouldLog: this.shouldLogQuery,
        });
      },
    );
  }

  /**
   * @description Deletes records from a table
   * @param returning - Optional array of column names to return from the deleted rows.
   *   **Note:** The `returning` parameter is only supported on PostgreSQL, CockroachDB, SQLite, and MSSQL.
   *   For MySQL and MariaDB, do not pass `returning` — the method will return the number of affected rows instead.
   * @returns WriteOperation that resolves to the number of affected rows, or the specified columns if `returning` is provided
   */
  delete(returning?: string[]): WriteOperation<any> {
    this.assertWriteClausesSupported("QueryBuilder::delete", {
      allowCte: false,
    });

    this.deleteNode = new DeleteNode(this.fromNode);
    this.returningNode = this.buildReturningNode("delete", returning);

    const hasReturning = this.returningNode !== null;

    return new WriteOperation(
      () => this.unWrap(),
      () => this.toSql(),
      () => this.toQuery(),
      async () => {
        const { sql, bindings } = this.astParser.parse(
          this.extractWriteNodes(),
        );

        const dataSource = await this.getSqlDataSource("write");
        return execSql(
          sql,
          bindings,
          dataSource,
          this.dbType,
          hasReturning ? "rows" : "affectedRows",
          {
            timeout: this.queryTimeout,
            queryContext: this.queryContextOptions,
            shouldLog: this.shouldLogQuery,
            sqlLiteOptions: {
              typeofModel: this.model,
              mode: hasReturning ? "fetch" : "affectedRows",
            },
          },
        );
      },
    );
  }

  /**
   * @description Soft deletes records from a table
   * @default column - 'deletedAt'
   * @default value - The current date and time in UTC timezone in the format "YYYY-MM-DD HH:mm:ss"
   * @returns WriteOperation that resolves to the number of affected rows
   */
  softDelete(options: SoftDeleteOptions<T> = {}): WriteOperation<number> {
    this.assertWriteClausesSupported("QueryBuilder::softDelete", {
      allowCte: false,
    });

    const { column = "deletedAt", value = baseSoftDeleteDate() } =
      options || {};

    this.updateNode = new UpdateNode(
      this.fromNode,
      [column as string],
      [value],
    );

    return new WriteOperation(
      () => this.unWrap(),
      () => this.toSql(),
      () => this.toQuery(),
      async () => {
        const { columns, values } = this.interpreterUtils.prepareColumns(
          [column as string],
          [value],
          "update",
          this.dbType,
        );

        this.updateNode = new UpdateNode(this.fromNode, columns, values);
        const { sql, bindings } = this.astParser.parse(
          this.extractWriteNodes(),
        );

        const dataSource = await this.getSqlDataSource("write");
        return execSql(sql, bindings, dataSource, this.dbType, "affectedRows", {
          timeout: this.queryTimeout,
          queryContext: this.queryContextOptions,
          shouldLog: this.shouldLogQuery,
          sqlLiteOptions: {
            typeofModel: this.model,
            mode: "affectedRows",
          },
        });
      },
    );
  }

  /**
   * @description Returns the query with the parameters bound to the query, mainly to use for debugging purposes
   * @warning Does not apply any hook from the model
   * @warning Does not show any `load` operations in the query, it only shows the operations that directly belong to the query builder instance
   */
  toQuery(): string {
    const { sql, bindings } = this.toSql();
    return bindParamsIntoQuery(sql, bindings);
  }

  /**
   * @description Returns the formatted query with database driver placeholders and the params
   * @description Use this for debugging purposes to see the formatted SQL
   * @warning Does not apply any hook from the model
   * @warning Does not show any `load` operations in the query, it only shows the operations that directly belong to the query builder instance
   */
  toSql(): ReturnType<typeof AstParser.prototype.parse> {
    const { sql, bindings } = this.unWrap();
    const formattedQuery = formatQuery(this.sqlDataSource, sql);
    const finalQuery = this.withQuery
      ? `${this.withQuery} ${formattedQuery}`
      : formattedQuery;
    return {
      sql: finalQuery,
      bindings: [...(bindings || [])],
    };
  }

  /**
   * @description Returns the raw query with database driver placeholders and the params
   * @description To be used for executing the query with the database driver
   * @warning Does not apply any hook from the model
   * @warning Does not show any `load` operations in the query, it only shows the operations that directly belong to the query builder instance
   */
  unWrap(): ReturnType<typeof AstParser.prototype.parse> {
    if (!this.selectNodes.length) {
      this.selectNodes = [new SelectNode(`*`)];
    }

    const { sql, bindings } = this.astParser.parse(this.extractQueryNodes());

    const finalQuery = this.withQuery ? `${this.withQuery} ${sql}` : sql;

    return {
      sql: finalQuery,
      bindings: [...(bindings || [])],
    };
  }

  /**
   * @description Returns a deep clone of the query builder instance.
   */
  clone(): QueryBuilder<T, S, D> {
    const qb = new QueryBuilder<T, S, D>(this.model, this.sqlDataSource) as any;

    // select / from / distinct (from SelectQueryBuilder)
    qb.dbType = this.dbType;
    qb.modelSelectedColumns = deepCloneNode(this.modelSelectedColumns);
    qb.distinctNode = deepCloneNode(this.distinctNode);
    qb.distinctOnNode = deepCloneNode(this.distinctOnNode);
    qb.selectNodes = deepCloneNode(this.selectNodes);
    qb.withQuery = deepCloneNode(this.withQuery);

    // join / where / group / having / order
    qb.joinNodes = deepCloneNode(this.joinNodes);
    qb.whereNodes = deepCloneNode(this.whereNodes);
    qb.groupByNodes = deepCloneNode(this.groupByNodes);
    qb.havingNodes = deepCloneNode(this.havingNodes);
    qb.orderByNodes = deepCloneNode(this.orderByNodes);

    // locks / unions / with / comments
    qb.lockQueryNodes = deepCloneNode(this.lockQueryNodes);
    qb.unionNodes = deepCloneNode(this.unionNodes);
    qb.withNodes = deepCloneNode(this.withNodes);
    qb.comments = [...this.comments];
    qb.hints = [...this.hints];
    qb.schemaName = this.schemaName;

    // from / limit / offset / flags
    qb.fromNode = deepCloneNode(this.fromNode);
    qb.limitNode = deepCloneNode(this.limitNode);
    qb.offsetNode = deepCloneNode(this.offsetNode);

    // write
    qb.returningNode = deepCloneNode(this.returningNode);

    // flags
    qb.isNestedCondition = this.isNestedCondition;

    return qb as QueryBuilder<T, S, D>;
  }

  /**
   * @description Gives a fresh instance of the query builder
   */
  clear(): QueryBuilder<T, Record<string, any>, D> {
    const qb = new QueryBuilder(this.model, this.sqlDataSource);
    if (this.fromNode.alias) {
      qb.table(qb.model.table, this.fromNode.alias);
    }

    return qb as QueryBuilder<T, Record<string, any>, D>;
  }

  /**
   * @description Removes the lock query
   */
  clearLockQuery(): this {
    this.lockQueryNodes = [];
    return this;
  }

  /**
   * @description Removes any union query
   */
  clearUnionQuery(): this {
    this.unionNodes = [];
    return this;
  }

  /**
   * @description Removes any with query
   */
  clearWithQuery(): this {
    this.withNodes = [];
    return this;
  }

  /**
   * @description Rejects clause state that would otherwise be silently dropped on a
   * write. Thrown at call time so the failure points at the builder call.
   */
  protected assertWriteClausesSupported(
    method: string,
    { allowCte = true }: WriteClauseAllowances = {},
  ): void {
    // MySQL/MariaDB are the only dialects that carry joins, ORDER BY or LIMIT on a write
    const isMysqlFamily = this.dbType === "mysql" || this.dbType === "mariadb";

    // MariaDB only accepts a CTE in front of a SELECT, unlike MySQL 8 and the rest
    if (!allowCte && this.withNodes.length && this.dbType === "mariadb") {
      throw new HysteriaError(
        method,
        "CTE_NOT_SUPPORTED_ON_WRITE",
        new Error("MariaDB does not support a CTE on UPDATE or DELETE"),
      );
    }

    const hasSelectOnlyState =
      this.selectNodes.length > 0 ||
      !!this.distinctNode ||
      !!this.distinctOnNode ||
      this.groupByNodes.length > 0 ||
      this.havingNodes.length > 0 ||
      this.unionNodes.length > 0 ||
      this.lockQueryNodes.length > 0 ||
      this.comments.length > 0 ||
      this.hints.length > 0;

    if (hasSelectOnlyState) {
      throw new HysteriaError(method, "SELECT_ONLY_CLAUSE_ON_WRITE");
    }

    if (!isMysqlFamily && this.joinNodes.length > 0) {
      throw new HysteriaError(method, "JOIN_NOT_SUPPORTED_ON_WRITE");
    }

    const hasOrderOrLimit =
      this.orderByNodes.length > 0 || this.limitNode !== null;
    if (this.offsetNode || (!isMysqlFamily && hasOrderOrLimit)) {
      throw new HysteriaError(method, "ORDER_BY_LIMIT_NOT_SUPPORTED_ON_WRITE");
    }
  }

  /**
   * @description Single source of truth for a write statement's node list. Preview
   * (`extractQueryNodes`) and execution both go through it so they cannot diverge.
   */
  protected extractWriteNodes(): QueryNode[] {
    if (this.insertNode) {
      const isMysqlFamily =
        this.dbType === "mysql" || this.dbType === "mariadb";

      // MySQL/MariaDB reject `WITH ... INSERT`, so the CTE is rendered inline by the
      // insert interpreter; every other dialect takes it as the leading node.
      this.insertNode.withNodes =
        isMysqlFamily && this.withNodes.length ? this.withNodes : undefined;
      this.insertNode.source = this.insertNodeSource;

      // MySQL/MariaDB have no target-less ON CONFLICT; INSERT IGNORE is the equivalent.
      const ignoreInto =
        (this.dbType === "mysql" || this.dbType === "mariadb") &&
        !!this.insertConflictConfig &&
        this.insertConflictConfig.conflictColumns.length === 0 &&
        this.insertConflictConfig.mode === "ignore";
      this.insertNode.ignoreInto = ignoreInto;
      this.insertNode.keyword = ignoreInto
        ? "insert ignore into"
        : "insert into";

      // SQLite reads `on conflict` after an INSERT ... SELECT as a join constraint.
      this.insertNode.disambiguateSource =
        this.dbType === "sqlite" &&
        !!this.insertNodeSource &&
        !!this.onDuplicateNode;

      return [
        ...(isMysqlFamily ? [] : this.withNodes),
        this.insertNode,
        this.onDuplicateNode,
      ].filter(Boolean) as QueryNode[];
    }

    if (this.updateNode) {
      this.updateNode.joinNodes = this.joinNodes;
      this.updateNode.fromSourceNode = this.updateFromNode ?? undefined;

      return [
        ...this.withNodes,
        ...this.withReturningNode(
          [
            this.updateNode,
            ...this.whereNodes,
            ...this.orderByNodes,
            this.limitNode,
          ].filter(Boolean) as QueryNode[],
        ),
      ] as QueryNode[];
    }

    if (this.deleteNode) {
      this.deleteNode.joinNodes = this.joinNodes;
      this.deleteNode.usingNode = this.deleteUsingNode ?? undefined;
      // Multi-table DELETE needs the `delete <target> from <table>` form
      this.deleteNode.keyword = this.joinNodes.length
        ? "delete"
        : "delete from";

      return [
        ...this.withNodes,
        ...this.withReturningNode(
          [
            this.deleteNode,
            ...this.whereNodes,
            ...this.orderByNodes,
            this.limitNode,
          ].filter(Boolean) as QueryNode[],
        ),
      ] as QueryNode[];
    }

    if (this.truncateNode) {
      return [this.truncateNode];
    }

    return [];
  }

  extractQueryNodes(): QueryNode[] {
    if (this.schemaName) {
      if (this.fromNode && typeof this.fromNode.table === "string") {
        this.fromNode.schema = this.schemaName;
      }
      for (const joinNode of this.joinNodes) {
        joinNode.schema = this.schemaName;
      }
    }

    if (
      this.insertNode ||
      this.updateNode ||
      this.deleteNode ||
      this.truncateNode
    ) {
      return this.extractWriteNodes();
    }

    if (!this.selectNodes.length) {
      this.selectNodes = [new SelectNode(`*`)];
    }

    // Read case
    const commentNodes = this.comments.map((value) => new CommentNode(value));
    const hintNodes = this.hints.length
      ? [new CommentNode(this.hints.join(" "), true)]
      : [];

    return [
      ...this.withNodes,
      ...commentNodes,
      this.distinctNode,
      this.distinctOnNode,
      ...this.selectNodes,
      ...hintNodes,
      this.fromNode,
      ...this.joinNodes,
      ...this.whereNodes,
      ...this.groupByNodes,
      ...this.havingNodes,
      ...this.orderByNodes,
      this.limitNode,
      this.offsetNode,
      ...this.lockQueryNodes,
      ...this.unionNodes,
    ].filter(Boolean) as QueryNode[];
  }

  protected clearForFunctions(): this {
    this.clearSelect();
    this.clearGroupBy();
    this.clearOrderBy();
    this.clearLimit();
    this.clearOffset();
    return this;
  }

  /**
   * @description Checks if the current context is an MSSQL transaction
   * @description MSSQL transactions can only handle one request at a time
   */
  protected isMssqlTransaction(): boolean {
    return (
      this.sqlDataSource.type === "mssql" && !!this.sqlDataSource.sqlConnection
    );
  }

  /**
   * @description Executes pagination queries, serializing them for MSSQL transactions
   */
  protected async executePaginateQueries<M, C>(
    modelsQuery: () => Promise<M>,
    countQuery: () => Promise<C>,
  ): Promise<[M, C]> {
    if (this.isMssqlTransaction()) {
      const models = await modelsQuery();
      const count = await countQuery();
      return [models, count];
    }

    return Promise.all([modelsQuery(), countQuery()]);
  }

  protected async getSqlDataSource(
    mode: "read" | "write",
  ): Promise<SqlDataSource> {
    if (!this.replicationMode) {
      if (mode === "read") {
        const slave = this.sqlDataSource.getSlave();
        return slave || this.sqlDataSource;
      }

      return this.sqlDataSource;
    }

    if (this.replicationMode === "master") {
      return this.sqlDataSource;
    }

    if (mode === "write") {
      return this.sqlDataSource;
    }

    const slave = this.sqlDataSource.getSlave();
    return slave || this.sqlDataSource;
  }

  /**
   * @description Executes SQL with slave failure handling
   * @param mode The operation mode (read or write)
   * @param operation The execSql operation to perform
   * @returns The result of the operation
   */
  protected async execSqlWithSlaveHandling<R>(
    mode: "read" | "write",
    operation: (dataSource: SqlDataSource) => Promise<R>,
  ): Promise<R> {
    const dataSource = await this.getSqlDataSource(mode);
    const isSlave = dataSource !== this.sqlDataSource;

    if (!isSlave) {
      return operation(dataSource);
    }

    try {
      return await operation(dataSource);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const onSlaveFailure = this.sqlDataSource.getOnSlaveServerFailure();

      if (onSlaveFailure) {
        await onSlaveFailure(err, {
          host: dataSource.host,
          port: dataSource.port,
          username: dataSource.username,
          password: dataSource.password,
          database: dataSource.database,
          type: dataSource.getDbType(),
        });
        return await operation(this.sqlDataSource);
      }

      throw err;
    }
  }
}
