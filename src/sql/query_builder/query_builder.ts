import { PassThrough } from "node:stream";
import { format } from "sql-formatter";
import { HysteriaError } from "../../errors/hysteria_error";
import { baseSoftDeleteDate } from "../../utils/date_utils";
import { withPerformance } from "../../utils/performance";
import { bindParamsIntoQuery } from "../../utils/query";
import { AstParser } from "../ast/parser";
import { UnionNode, WithNode } from "../ast/query/node";
import { DeleteNode } from "../ast/query/node/delete";
import { FromNode } from "../ast/query/node/from";
import { InsertNode } from "../ast/query/node/insert";
import { LockNode } from "../ast/query/node/lock/lock";
import { SelectNode } from "../ast/query/node/select/basic_select";
import { UnionCallBack } from "../ast/query/node/select/select_types";
import { TruncateNode } from "../ast/query/node/truncate";
import { UpdateNode } from "../ast/query/node/update";
import { QueryNode } from "../ast/query/query";
import { InterpreterUtils } from "../interpreter/interpreter_utils";
import type { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import { AnnotatedModel } from "../models/model_query_builder/model_query_builder_types";
import type { NumberModelKey } from "../models/model_types";
import {
  CursorPaginatedData,
  getCursorPaginationMetadata,
  getPaginationMetadata,
  PaginatedData,
} from "../pagination";
import { deepCloneNode } from "../resources/utils";
import { SqlDataSource } from "../sql_data_source";
import type { SqlDataSourceType } from "../sql_data_source_types";
import {
  execSql,
  execSqlStreaming,
  getSqlDialect,
} from "../sql_runner/sql_runner";
import { SoftDeleteOptions } from "./delete_query_builder_type";
import { JsonQueryBuilder } from "./json_query_builder";
import {
  Cursor,
  PaginateWithCursorOptions,
  PluckReturnType,
  StreamOptions,
} from "./query_builder_types";

export class QueryBuilder<T extends Model = any> extends JsonQueryBuilder<T> {
  model: typeof Model;
  protected astParser: AstParser;
  protected unionNodes: UnionNode[];
  protected withNodes: WithNode[];
  protected lockQueryNodes: LockNode[];
  protected isNestedCondition = false;
  protected mustRemoveAnnotations: boolean = false;
  protected interpreterUtils: InterpreterUtils;

  /* Performance methods that return the time that took to execute the query with the result */
  performance = {
    many: this.manyWithPerformance.bind(this),
    one: this.oneWithPerformance.bind(this),
    oneOrFail: this.oneOrFailWithPerformance.bind(this),
    first: this.firstWithPerformance.bind(this),
    firstOrFail: this.firstOrFailWithPerformance.bind(this),
    paginate: this.paginateWithPerformance.bind(this),
    paginateWithCursor: this.paginateWithCursorWithPerformance.bind(this),
    exists: this.existsWithPerformance.bind(this),
  };

  constructor(
    model: typeof Model,
    sqlDataSource: SqlDataSource = SqlDataSource.getInstance(),
  ) {
    super(model, sqlDataSource);
    this.dbType = sqlDataSource.getDbType();
    this.isNestedCondition = false;
    this.model = model;
    this.unionNodes = [];
    this.lockQueryNodes = [];
    this.withNodes = [];
    this.astParser = new AstParser(this.model, this.dbType);
    this.interpreterUtils = new InterpreterUtils(this.model);
  }

  protected get fromTable(): string {
    this.fromNode ||= new FromNode(this.model.table);
    const { sql: table } = this.astParser.parse([this.fromNode]);
    return table.replace(/^FROM /i, "");
  }

  /**
   * @description Executes the query and returns true if the query returns at least one result, false otherwise.
   */
  async exists(): Promise<boolean> {
    return !!(await this.one());
  }

  /**
   * @description Executes the query and returns true if the query returns at least one result, false otherwise.
   * @description Returns the time that took to execute the query
   */
  async existsWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: boolean;
    time: number;
  }> {
    const [time, data] = await withPerformance(
      this.exists.bind(this),
      returnType,
    );
    return { data, time: Number(time) };
  }

  /**
   * @description Executes the query and retrieves multiple results.
   */
  async many(): Promise<AnnotatedModel<T, any, any>[]> {
    const { sql, bindings } = this.unWrap();
    return execSql(sql, bindings, this.sqlDataSource, "raw", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "fetch",
      },
    });
  }

  /**
   * @description Executes the query and retrieves a single column from the results.
   * @param key - The column to retrieve from the results, must be a Model Column
   */
  async pluck<K extends ModelKey<T>>(key: K): Promise<PluckReturnType<T, K>> {
    const result = (await this.many()) as T[];
    return result.map(
      (item) => item[key as keyof typeof item],
    ) as PluckReturnType<T, K>;
  }

  /**
   * @description Executes the query and retrieves a single result.
   */
  async one(): Promise<AnnotatedModel<T, any, any> | null> {
    const result = (await this.limit(1).many()) as AnnotatedModel<T, {}>[];
    if (!result || !result.length) {
      return null;
    }

    return result[0];
  }

  /**
   * @alias one
   */
  async first(): Promise<AnnotatedModel<T, any, any> | null> {
    return this.one();
  }

  /**
   * @description Executes the query and retrieves the first result. Fail if no result is found.
   */
  async oneOrFail(): Promise<AnnotatedModel<T, any, any>> {
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
   * @alias oneOrFail
   */
  async firstOrFail(): Promise<AnnotatedModel<T, any, any>> {
    return this.oneOrFail();
  }

  /**
   * @description Executes the query and returns a node readable stream.
   * @description If used by a model query builder, it will serialize the models and apply the hooks and relations.
   * @postgres needs the pg-query-stream package in order to work
   * @warning Cannot and won't be used inside a transaction and will always pick a new connection from the pool, using it in a transaction is technically possible but not recommended since the transaction can probably starve since it'll be waiting for the stream to finish
   * @throws If using postgres and the `pg-query-stream` package is not installed
   */
  async stream<M extends Model = T>(
    options: StreamOptions = {},
    cb?: (
      stream: PassThrough & AsyncGenerator<AnnotatedModel<M, any, any>>,
    ) => void | Promise<void>,
  ): Promise<PassThrough & AsyncGenerator<AnnotatedModel<M, {}, {}>>> {
    const { sql, bindings } = this.unWrap();
    const stream = await execSqlStreaming(
      sql,
      bindings,
      this.sqlDataSource,
      options,
      {
        onData: (passThrough, row) => {
          passThrough.write(row);
        },
      },
    );

    await cb?.(
      stream as PassThrough & AsyncGenerator<AnnotatedModel<M, {}, {}>>,
    );
    return stream as PassThrough & AsyncGenerator<AnnotatedModel<M, {}, {}>>;
  }

  /**
   * @description Chunks the query into smaller queries, it returns a generator of the chunks
   * @description It will continue to yield chunks until the query returns no results
   * @description Useful for large queries that need to be processed in chunks
   * @warning overrides limit and offset set before in the query builder
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
   * const query = sql.query("users").orderBy("name", "asc");
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
   * @description Allows to avoid offset clause that can be inefficient for large datasets
   * @description If using a model query builder, primary key is used as discriminator by default
   * @param options - The options for the paginate with cursor
   * @param options.discriminator - The discriminator to use for the paginate with Cursor pagination
   * @param options.operator - The operator to use for the paginate with Cursor pagination
   * @param options.orderBy - The order by to use for the paginate with Cursor pagination
   * @param cursor - The cursor to use for the paginate with Cursor pagination
   * @warning If no order by clause is present in the query, the query will add an order by clause to the query `orderBy(discriminator, "asc")`
   * @returns the pagination metadata and the cursor for the next page
   */
  async paginateWithCursor<K extends ModelKey<T>>(
    limit: number,
    options: PaginateWithCursorOptions<T, K>,
    cursor?: Cursor<T, K>,
  ): Promise<[CursorPaginatedData<T>, Cursor<T, K>]> {
    const countQueryBuilder = this.copy();

    if (!this.orderByNodes.length) {
      this.orderBy(options.discriminator, options.orderBy || "asc");
    }

    if (cursor) {
      this.where(cursor.key, options.operator || ">", cursor.value);
    }

    this.limit(limit);

    const data = await this.many();
    const count = await countQueryBuilder.getCount();

    const lastItem = data[data.length - 1];
    const lastItemValue = lastItem ? lastItem[options.discriminator] : null;
    const paginationMetadata = getCursorPaginationMetadata(limit, count);

    return [
      {
        paginationMetadata: paginationMetadata,
        data,
      },
      {
        key: options.discriminator,
        value: lastItemValue,
      },
    ];
  }

  /**
   * @description Selects a subquery, subquery must return a single column
   */
  selectSubQuery(
    cbOrQueryBuilder: ((subQuery: QueryBuilder<T>) => void) | QueryBuilder<any>,
    alias: string,
  ): this {
    if (typeof cbOrQueryBuilder === "function") {
      const subQuery = new QueryBuilder<T>(this.model, this.sqlDataSource);
      cbOrQueryBuilder(subQuery);
      this.selectNodes.push(
        new SelectNode(subQuery.extractQueryNodes(), alias),
      );
      return this;
    }

    this.selectNodes.push(
      new SelectNode(cbOrQueryBuilder.extractQueryNodes(), alias),
    );
    return this;
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
   * @description Adds a UNION to the query.
   */
  union(query: string, bindings?: any[]): this;
  union(cb: UnionCallBack<T>): this;
  union(queryBuilderOrCb: UnionCallBack<any> | string): this {
    if (typeof queryBuilderOrCb === "string") {
      this.unionNodes.push(new UnionNode(queryBuilderOrCb));
      return this;
    }

    const queryBuilder =
      queryBuilderOrCb instanceof QueryBuilder
        ? queryBuilderOrCb
        : queryBuilderOrCb(new QueryBuilder(this.model, this.sqlDataSource));

    const nodes = queryBuilder.extractQueryNodes();
    this.unionNodes.push(new UnionNode(nodes));
    return this;
  }

  /**
   * @description Adds a UNION ALL to the query.
   */
  unionAll(query: string, bindings?: any[]): this;
  unionAll(cb: UnionCallBack<T>): this;
  unionAll(queryBuilder: QueryBuilder<any>): this;
  unionAll(
    queryBuilderOrCb: UnionCallBack<any> | QueryBuilder<any> | string,
  ): this {
    if (typeof queryBuilderOrCb === "string") {
      this.unionNodes.push(new UnionNode(queryBuilderOrCb, true));
      return this;
    }

    const queryBuilder =
      queryBuilderOrCb instanceof QueryBuilder
        ? queryBuilderOrCb
        : queryBuilderOrCb(new QueryBuilder(this.model, this.sqlDataSource));

    const nodes = queryBuilder.extractQueryNodes();
    this.unionNodes.push(new UnionNode(nodes, true));
    return this;
  }

  /**
   * @description Increments the value of a column by a given amount, column must be of a numeric type in order to be incremented
   * @typeSafe - In typescript, only numeric columns of the model will be accepted if using a Model
   * @default value + 1
   * @returns the number of affected rows
   */
  async increment(
    column: NumberModelKey<T>,
    value: number = 1,
  ): Promise<number> {
    const { sql, bindings } = this.astParser.parse([
      new UpdateNode(
        `${this.fromTable} set ${column as string} = ${column as string} + ${value}`,
        [],
        [],
        true,
      ),
      ...this.whereNodes,
      ...this.joinNodes,
    ]);

    return execSql(sql, bindings, this.sqlDataSource, "affectedRows", {
      sqlLiteOptions: { typeofModel: this.model, mode: "affectedRows" },
    });
  }

  /**
   * @description Decrements the value of a column by a given amount, column must be of a numeric type in order to be decremented
   * @typeSafe - In typescript, only numeric columns of the model will be accepted if using a Model
   * @default value - 1
   * @returns the number of affected rows
   */
  async decrement(
    column: NumberModelKey<T>,
    value: number = 1,
  ): Promise<number> {
    const { sql, bindings } = this.astParser.parse([
      new UpdateNode(
        `${this.fromTable} set ${column as string} = ${column as string} - ${value}`,
        [],
        [],
        true,
      ),
      ...this.whereNodes,
      ...this.joinNodes,
    ]);

    return execSql(sql, bindings, this.sqlDataSource, "affectedRows", {
      sqlLiteOptions: { typeofModel: this.model, mode: "affectedRows" },
    });
  }

  /**
   * @description Executes the query and retrieves the count of results, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getCount(column: string = "*"): Promise<number> {
    this.clearForFunctions();
    this.annotate("count", column, "total");
    const result = await this.one();
    return result ? +result["total" as keyof typeof result] : 0;
  }

  /**
   * @description Executes the query and retrieves the maximum value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getMax(column: string): Promise<number> {
    this.clearForFunctions();
    this.annotate("max", column, "total");
    const result = await this.one();
    return result ? +result["total" as keyof typeof result] : 0;
  }

  /**
   * @description Executes the query and retrieves the minimum value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getMin(column: string): Promise<number> {
    this.clearForFunctions();
    this.annotate("min", column, "total");
    const result = await this.one();
    return result ? +result["total" as keyof typeof result] : 0;
  }

  /**
   * @description Executes the query and retrieves the average value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getAvg(column: string): Promise<number> {
    this.clearForFunctions();
    this.annotate("avg", column, "total");
    const result = await this.one();
    return result ? +result["total" as keyof typeof result] : 0;
  }

  /**
   * @description Executes the query and retrieves the sum of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getSum(column: string): Promise<number> {
    this.clearForFunctions();
    this.annotate("sum", column, "total");
    const result = await this.one();
    return result ? +result["total" as keyof typeof result] : 0;
  }

  /**
   * @description Executes the query and retrieves multiple paginated results.
   * @description Overrides the limit and offset clauses in order to paginate the results.
   */
  async paginate(page: number, perPage: number): Promise<PaginatedData<T>> {
    if (typeof page !== "number" || typeof perPage !== "number") {
      throw new HysteriaError(
        "QueryBuilder::paginate",
        "INVALID_PAGINATION_PARAMETERS",
      );
    }

    const countQueryBuilder = this.copy();
    const total = await countQueryBuilder.getCount("*");

    // Original query is used to get the models with pagination data
    const models = await this.limit(perPage)
      .offset((page - 1) * perPage)
      .many();

    const paginationMetadata = getPaginationMetadata(page, perPage, total);

    return {
      paginationMetadata,
      data: models,
    } as PaginatedData<T>;
  }

  from(table: string, alias?: string): this;
  from(cb: (qb: QueryBuilder<T>) => void, alias: string): this;
  from(
    tableOrCb: string | ((qb: QueryBuilder<T>) => void),
    maybeAlias?: string,
  ): this {
    if (typeof tableOrCb === "function") {
      if (!maybeAlias) {
        throw new HysteriaError(
          "QueryBuilder::from",
          "MISSING_ALIAS_FOR_SUBQUERY",
        );
      }

      const subQueryBuilder = new QueryBuilder<T>(
        this.model,
        this.sqlDataSource,
      );

      tableOrCb(subQueryBuilder);
      const subQueryNodes = subQueryBuilder.extractQueryNodes();
      this.fromNode = new FromNode(subQueryNodes, maybeAlias);
      return this;
    }

    this.fromNode = new FromNode(tableOrCb, maybeAlias);
    return this;
  }

  /**
   * @description Adds a CTE to the query using a callback to build the subquery.
   */
  with(alias: string, cb: (qb: QueryBuilder<T>) => void): this {
    const subQuery = new QueryBuilder<T>(this.model, this.sqlDataSource);
    cb(subQuery);
    const nodes = subQuery.extractQueryNodes();
    this.withNodes.push(new WithNode("normal", alias, nodes));
    return this;
  }

  /**
   * @description Adds a recursive CTE to the query using a callback to build the subquery.
   */
  withRecursive(alias: string, cb: (qb: QueryBuilder<T>) => void): this {
    const subQuery = new QueryBuilder<T>(this.model, this.sqlDataSource);
    cb(subQuery);
    const nodes = subQuery.extractQueryNodes();
    this.withNodes.push(new WithNode("recursive", alias, nodes));
    return this;
  }

  /**
   * @description Adds a materialized CTE to the query using a callback to build the subquery.
   * @postgres only
   * @throws HysteriaError if the database type is not postgres
   */
  withMaterialized(alias: string, cb: (qb: QueryBuilder<T>) => void): this {
    if (this.dbType !== "postgres" && this.dbType !== "cockroachdb") {
      throw new HysteriaError(
        "QueryBuilder::withMaterialized",
        "MATERIALIZED_CTE_NOT_SUPPORTED",
        new Error("MATERIALIZED CTE is only supported by postgres"),
      );
    }

    const subQuery = new QueryBuilder<T>(this.model, this.sqlDataSource);
    cb(subQuery);
    const nodes = subQuery.extractQueryNodes();
    this.withNodes.push(new WithNode("materialized", alias, nodes));
    return this;
  }

  /**
   * @description Insert record into a table
   * @param returning - The columns to return from the query, only supported by postgres and cockroachdb - default is "*"
   * @returns raw driver response
   */
  async insert(data: Record<string, any>, returning?: string[]): Promise<T> {
    const { columns: preparedColumns, values: preparedValues } =
      this.interpreterUtils.prepareColumns(
        Object.keys(data),
        Object.values(data),
        "insert",
      );

    const insertObject = Object.fromEntries(
      preparedColumns.map((column, index) => [column, preparedValues[index]]),
    );

    const { sql, bindings } = this.astParser.parse([
      new InsertNode(this.fromTable, [insertObject], returning),
      ...this.joinNodes,
    ]);

    const rows = await execSql(sql, bindings, this.sqlDataSource, "raw", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "insertOne",
        models: [data as T],
      },
    });

    return Array.isArray(rows) && rows.length ? rows[0] : rows;
  }

  /**
   * @description Insert multiple records into a table
   * @param returning - The columns to return from the query, only supported by postgres and cockroachdb - default is "*"
   * @returns raw driver response
   */
  async insertMany(
    data: Record<string, any>[],
    returning?: string[],
  ): Promise<T[]> {
    if (!data.length) {
      return [];
    }

    const models = data.map((model) => {
      const { columns: preparedColumns, values: preparedValues } =
        this.interpreterUtils.prepareColumns(
          Object.keys(model),
          Object.values(model),
          "insert",
        );

      return Object.fromEntries(
        preparedColumns.map((column, index) => [column, preparedValues[index]]),
      );
    });

    const { sql, bindings } = this.astParser.parse([
      new InsertNode(this.fromTable, models, returning),
      ...this.joinNodes,
    ]);

    return execSql(sql, bindings, this.sqlDataSource, "raw", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "insertMany",
        models: models as T[],
      },
    });
  }

  /**
   * @description Updates records from a table
   * @returns the number of affected rows
   */
  async update(data: Record<string, any>): Promise<number> {
    const rawColumns = Object.keys(data);
    const rawValues = Object.values(data);

    const { columns, values } = this.interpreterUtils.prepareColumns(
      rawColumns,
      rawValues,
      "update",
    );

    const { sql, bindings } = this.astParser.parse([
      new UpdateNode(this.fromTable, columns, values),
      ...this.whereNodes,
      ...this.joinNodes,
    ]);

    return execSql(sql, bindings, this.sqlDataSource, "affectedRows", {
      sqlLiteOptions: { typeofModel: this.model, mode: "affectedRows" },
    });
  }

  /**
   * @description Deletes all records from a table
   */
  async truncate(): Promise<void> {
    const truncateNode = new TruncateNode(this.fromTable);
    const { sql, bindings } = this.astParser.parse([truncateNode]);
    await execSql(sql, bindings, this.sqlDataSource);
  }

  /**
   * @description Deletes records from a table
   * @returns the number of affected rows
   */
  async delete(): Promise<number> {
    const deleteNode = new DeleteNode(this.fromTable);
    const { sql, bindings } = this.astParser.parse([
      deleteNode,
      ...this.whereNodes,
      ...this.joinNodes,
    ]);

    return execSql(sql, bindings, this.sqlDataSource, "affectedRows", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "affectedRows",
      },
    });
  }

  /**
   * @description Soft deletes records from a table
   * @default column - 'deletedAt'
   * @default value - The current date and time in UTC timezone in the format "YYYY-MM-DD HH:mm:ss"
   * @returns the number of affected rows
   */
  async softDelete(options: SoftDeleteOptions<T> = {}): Promise<number> {
    const { column = "deletedAt", value = baseSoftDeleteDate() } =
      options || {};

    const { sql, bindings } = this.astParser.parse([
      new UpdateNode(this.fromTable, [column as string], [value]),
      ...this.whereNodes,
      ...this.joinNodes,
    ]);

    this.interpreterUtils.prepareColumns([column as string], [value], "update");

    return execSql(sql, bindings, this.sqlDataSource, "affectedRows", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "affectedRows",
      },
    });
  }

  /**
   * @description Returns the query with the parameters bound to the query
   */
  toQuery(dbType: SqlDataSourceType = this.dbType || "mysql"): string {
    const { sql, bindings } = this.unWrap(dbType);
    return bindParamsIntoQuery(sql, bindings);
  }

  /**
   * @description Returns the query with database driver placeholders and the params
   */
  unWrap(
    dbType: SqlDataSourceType = this.dbType,
  ): ReturnType<typeof AstParser.prototype.parse> {
    if (!this.selectNodes.length) {
      this.selectNodes = [new SelectNode(`*`)];
    }

    const { sql, bindings } = this.astParser.parse(this.extractQueryNodes());

    let formattedQuery: string;
    try {
      formattedQuery = format(sql, {
        ...this.sqlDataSource.inputDetails.queryFormatOptions,
        language: getSqlDialect(dbType as SqlDataSourceType),
      });
    } catch (_) {
      // Retry without language
      try {
        formattedQuery = format(sql, {
          ...this.sqlDataSource.inputDetails.queryFormatOptions,
        });
      } catch (_) {
        // Ultimate fallback
        formattedQuery = sql;
      }
    }

    const finalQuery = this.withQuery
      ? `${this.withQuery} ${formattedQuery}`
      : formattedQuery;

    return {
      sql: finalQuery,
      bindings: [...(bindings || [])],
    };
  }

  /**
   * @description Returns a deep copy of the query builder instance.
   */
  copy(): this {
    const qb = new QueryBuilder<T>(this.model, this.sqlDataSource) as any;

    // select / from / distinct (from SelectQueryBuilder)
    qb.dbType = this.dbType;
    qb.modelSelectedColumns = deepCloneNode((this as any).modelSelectedColumns);
    qb.modelAnnotatedColumns = deepCloneNode(
      (this as any).modelAnnotatedColumns,
    );
    qb.distinctNode = deepCloneNode((this as any).distinctNode);
    qb.distinctOnNodes = deepCloneNode((this as any).distinctOnNodes);
    qb.selectNodes = deepCloneNode(this.selectNodes);
    qb.withQuery = deepCloneNode((this as any).withQuery);

    // join / where / group / having / order
    qb.joinNodes = deepCloneNode(this.joinNodes);
    qb.whereNodes = deepCloneNode(this.whereNodes);
    qb.groupByNodes = deepCloneNode(this.groupByNodes);
    qb.havingNodes = deepCloneNode(this.havingNodes);
    qb.orderByNodes = deepCloneNode(this.orderByNodes);

    // locks / unions / withs
    qb.lockQueryNodes = deepCloneNode(this.lockQueryNodes);
    qb.unionNodes = deepCloneNode(this.unionNodes);
    qb.withNodes = deepCloneNode(this.withNodes);

    // from / limit / offset / flags
    qb.fromNode = deepCloneNode(this.fromNode);
    qb.limitNode = deepCloneNode(this.limitNode);
    qb.offsetNode = deepCloneNode(this.offsetNode);

    // flags
    qb.isNestedCondition = this.isNestedCondition;
    qb.mustRemoveAnnotations = this.mustRemoveAnnotations;

    return qb as this;
  }

  protected clearLockQuery(): this {
    this.lockQueryNodes = [];
    return this;
  }

  protected clearUnionQuery(): this {
    this.unionNodes = [];
    return this;
  }

  protected clearWithQuery(): this {
    this.withNodes = [];
    return this;
  }

  extractQueryNodes(): QueryNode[] {
    this.fromNode ||= new FromNode(this.fromTable);
    if (!this.selectNodes.length) {
      this.selectNodes = [new SelectNode(`*`)];
    }

    return [
      ...this.withNodes,
      ...this.selectNodes,
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
   * @description Makes a many query and returns the time that took to execute that query
   */
  private async manyWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: AnnotatedModel<T, any, any>[];
    time: number;
  }> {
    const [time, data] = await withPerformance(
      this.many.bind(this),
      returnType,
    );
    return {
      data,
      time: Number(time),
    };
  }

  /**
   * @description Makes a one query and returns the time that took to execute that query
   */
  private async oneWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: AnnotatedModel<T, any, any> | null;
    time: number;
  }> {
    const [time, data] = await withPerformance(this.one.bind(this), returnType);
    return {
      data,
      time: Number(time),
    };
  }

  /**
   * @alias oneWithPerformance
   */
  private async firstWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ) {
    return this.oneWithPerformance(returnType);
  }

  /**
   * @alias oneOrFailWithPerformance
   */
  private async firstOrFailWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ) {
    return this.oneOrFailWithPerformance(returnType);
  }

  private async paginateWithPerformance(
    page: number,
    perPage: number,
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, data] = await withPerformance(
      this.paginate.bind(this, page, perPage),
      returnType,
    );

    return {
      data,
      time: Number(time),
    };
  }

  private async paginateWithCursorWithPerformance(
    page: number,
    options: PaginateWithCursorOptions<T, ModelKey<T>>,
    cursor?: Cursor<T, ModelKey<T>>,
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, data] = await withPerformance(
      this.paginateWithCursor.bind(this, page, options, cursor),
      returnType,
    );

    return {
      data,
      time: Number(time),
    };
  }

  /**
   * @description Makes a one or fail query and returns the time that took to execute that query
   */
  private async oneOrFailWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, data] = await withPerformance(
      this.oneOrFail.bind(this),
      returnType,
    );
    return {
      data,
      time: Number(time),
    };
  }
}
