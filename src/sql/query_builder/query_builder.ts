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
import { WhereGroupNode } from "../ast/query/node/where/where_group";
import {
  SubqueryOperatorType,
  WhereSubqueryNode,
} from "../ast/query/node/where/where_subquery";
import { QueryNode } from "../ast/query/query";
import { InterpreterUtils } from "../interpreter/interpreter_utils";
import type { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import type { NumberModelKey } from "../models/model_types";
import { getPaginationMetadata, PaginatedData } from "../pagination";
import { SqlDataSource } from "../sql_data_source";
import type { SqlDataSourceType } from "../sql_data_source_types";
import { execSql, getSqlDialect } from "../sql_runner/sql_runner";
import { CteBuilder } from "./cte/cte_builder";
import { SoftDeleteOptions } from "./delete_query_builder_type";
import { JsonQueryBuilder } from "./json_query_builder";
import {
  PluckReturnType,
  QueryBuilderWithOnlyWhereConditions,
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
   * @description Makes a many query and returns the time that took to execute that query
   */
  async manyWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: T[];
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
  async oneWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: T | null;
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
  async firstWithPerformance(returnType: "millis" | "seconds" = "millis") {
    return this.oneWithPerformance(returnType);
  }

  /**
   * @alias oneOrFailWithPerformance
   */
  async firstOrFailWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ) {
    return this.oneOrFailWithPerformance(returnType);
  }

  async paginateWithPerformance(
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

  /**
   * @description Makes a one or fail query and returns the time that took to execute that query
   */
  async oneOrFailWithPerformance(returnType: "millis" | "seconds" = "millis") {
    const [time, data] = await withPerformance(
      this.oneOrFail.bind(this),
      returnType,
    );
    return {
      data,
      time: Number(time),
    };
  }

  /**
   * @description Executes the query and retrieves multiple results.
   */
  async many(): Promise<T[]> {
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
    const result = await this.many();
    return result.map((item) => item[key]) as PluckReturnType<T, K>;
  }

  /**
   * @description Executes the query and retrieves a single result.
   */
  async one(): Promise<T | null> {
    const result = await this.limit(1).many();
    if (!result || !result.length) {
      return null;
    }

    return result[0];
  }

  /**
   * @alias one
   */
  async first(): Promise<T | null> {
    return this.one();
  }

  /**
   * @description Executes the query and retrieves the first result. Fail if no result is found.
   */
  async oneOrFail(): Promise<T> {
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
  async firstOrFail(): Promise<T> {
    return this.oneOrFail();
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
    this.annotate("count", column, "total");
    const result = await this.one();
    return result ? +result["total" as keyof typeof result] : 0;
  }

  /**
   * @description Executes the query and retrieves the maximum value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getMax(column: string): Promise<number> {
    this.annotate("max", column, "total");
    const result = await this.one();
    return result ? +result["total" as keyof typeof result] : 0;
  }

  /**
   * @description Executes the query and retrieves the minimum value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getMin(column: string): Promise<number> {
    this.annotate("min", column, "total");
    const result = await this.one();
    return result ? +result["total" as keyof typeof result] : 0;
  }

  /**
   * @description Executes the query and retrieves the average value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getAvg(column: string): Promise<number> {
    this.annotate("avg", column, "total");
    const result = await this.one();
    return result ? +result["total" as keyof typeof result] : 0;
  }

  /**
   * @description Executes the query and retrieves the sum of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getSum(column: string): Promise<number> {
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

    // Only filters are applied for the count query
    const countQueryBuilder = new QueryBuilder<T>(
      this.model,
      this.sqlDataSource,
    );
    countQueryBuilder.fromNode = this.fromNode;
    countQueryBuilder.joinNodes = [...this.joinNodes];
    countQueryBuilder.whereNodes = [...this.whereNodes];
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
   * @description Creates a CTE with the provided type that has the query builder as the query
   * @description For the moment, with is only taken into account when making a select query
   * @returns The CTE query builder, you can chain other methods after calling this method in order to interact with the CTE
   */
  with(
    type: string,
    cb: (cteBuilder: CteBuilder<T>) => CteBuilder<T>,
  ): Omit<this, "with">;
  with(cb: (cteBuilder: CteBuilder<T>) => CteBuilder<T>): Omit<this, "with">;
  with(
    typeOrCb: string | ((cteBuilder: CteBuilder<T>) => CteBuilder<T>),
    maybeCb?: (cteBuilder: CteBuilder<T>) => CteBuilder<T>,
  ): Omit<this, "with"> {
    let type = "";
    if (typeof typeOrCb === "function") {
      maybeCb = typeOrCb;
    } else {
      type = typeOrCb;
    }

    const cteBuilder = new CteBuilder<T>(type, this.model, this.sqlDataSource);
    maybeCb?.(cteBuilder);
    cteBuilder.cteMap.forEach((queryBuilder, alias) => {
      this.withNodes.push(
        new WithNode(type, alias, queryBuilder.extractQueryNodes()),
      );
    });

    return this;
  }

  withRecursive(
    cb: (cteBuilder: CteBuilder<T>) => CteBuilder<T>,
  ): Omit<this, "withRecursive"> {
    const cteBuilder = new CteBuilder<T>(
      "recursive",
      this.model,
      this.sqlDataSource,
    );

    cb(cteBuilder);
    return this;
  }

  withAggregate(
    cb: (cteBuilder: CteBuilder<T>) => CteBuilder<T>,
  ): Omit<this, "withAggregate"> {
    const cteBuilder = new CteBuilder<T>(
      "aggregate",
      this.model,
      this.sqlDataSource,
    );

    cb(cteBuilder);
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
   * @description Can be used to build a more complex where condition with parenthesis that wraps the where condition defined in the callback
   * @alias andWhereSubQuery
   */
  whereSubQuery(column: string, subQuery: QueryBuilder<T>): this;
  whereSubQuery(column: string, cb: (subQuery: QueryBuilder<T>) => void): this;
  whereSubQuery(
    column: string,
    operator: SubqueryOperatorType,
    subQuery: QueryBuilder<T>,
  ): this;
  whereSubQuery(
    column: string,
    operator: SubqueryOperatorType,
    cb: (subQuery: QueryBuilder<T>) => void,
  ): this;
  whereSubQuery(
    column: string,
    subQueryOrCbOrOperator:
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void)
      | SubqueryOperatorType,
    subQueryOrCb?: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    return this.andWhereSubQuery(
      column,
      subQueryOrCbOrOperator as SubqueryOperatorType,
      subQueryOrCb as QueryBuilder<T>,
    );
  }

  /**
   * @description Can be used to build a more complex where condition with parenthesis that wraps the where condition defined in the callback
   */
  andWhereSubQuery(column: string, subQuery: QueryBuilder<T>): this;
  andWhereSubQuery(
    column: string,
    cb: (subQuery: QueryBuilder<T>) => void,
  ): this;
  andWhereSubQuery(
    column: string,
    operator: SubqueryOperatorType,
    subQuery: QueryBuilder<T>,
  ): this;
  andWhereSubQuery(
    column: string,
    operator: SubqueryOperatorType,
    cb: (subQuery: QueryBuilder<T>) => void,
  ): this;
  andWhereSubQuery(
    column: string,
    subQueryOrCbOrOperator:
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void)
      | SubqueryOperatorType,
    subQueryOrCb?: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    let operator: SubqueryOperatorType = "in";
    let subQuery: QueryBuilder<T>;

    if (typeof subQueryOrCbOrOperator === "string") {
      operator = subQueryOrCbOrOperator as SubqueryOperatorType;
      if (typeof subQueryOrCb === "function") {
        subQuery = new QueryBuilder(this.model, this.sqlDataSource);
        subQueryOrCb(subQuery);
        this.whereNodes.push(
          new WhereSubqueryNode(
            column,
            operator,
            subQuery.extractQueryNodes(),
            "and",
          ),
        );
        return this;
      }

      if (subQueryOrCb instanceof QueryBuilder) {
        subQuery = subQueryOrCb;
        this.whereNodes.push(
          new WhereSubqueryNode(
            column,
            operator,
            subQuery.extractQueryNodes(),
            "and",
          ),
        );
        return this;
      }
      return this;
    }

    if (typeof subQueryOrCbOrOperator === "function") {
      subQuery = new QueryBuilder(this.model, this.sqlDataSource);
      subQueryOrCbOrOperator(subQuery);
      this.whereNodes.push(
        new WhereSubqueryNode(
          column,
          operator,
          subQuery.extractQueryNodes(),
          "and",
        ),
      );
      return this;
    }

    if (subQueryOrCbOrOperator instanceof QueryBuilder) {
      subQuery = subQueryOrCbOrOperator;
      this.whereNodes.push(
        new WhereSubqueryNode(
          column,
          operator,
          subQuery.extractQueryNodes(),
          "and",
        ),
      );
      return this;
    }

    return this;
  }

  /**
   * @description Can be used to build a more complex where condition with parenthesis that wraps the where condition defined in the callback
   */
  orWhereSubQuery(column: string, subQuery: QueryBuilder<T>): this;
  orWhereSubQuery(
    column: string,
    cb: (subQuery: QueryBuilder<T>) => void,
  ): this;
  orWhereSubQuery(
    column: string,
    operator: SubqueryOperatorType,
    subQuery: QueryBuilder<T>,
  ): this;
  orWhereSubQuery(
    column: string,
    operator: SubqueryOperatorType,
    cb: (subQuery: QueryBuilder<T>) => void,
  ): this;
  orWhereSubQuery(
    column: string,
    subQueryOrCbOrOperator:
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void)
      | SubqueryOperatorType,
    subQueryOrCb?: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    let operator: SubqueryOperatorType = "in";
    let subQuery: QueryBuilder<T>;

    if (typeof subQueryOrCbOrOperator === "string") {
      operator = subQueryOrCbOrOperator as SubqueryOperatorType;
      if (typeof subQueryOrCb === "function") {
        subQuery = new QueryBuilder(this.model, this.sqlDataSource);
        subQueryOrCb(subQuery);
        this.whereNodes.push(
          new WhereSubqueryNode(
            column,
            operator,
            subQuery.extractQueryNodes(),
            "or",
          ),
        );
        return this;
      }
      if (subQueryOrCb instanceof QueryBuilder) {
        subQuery = subQueryOrCb;
        this.whereNodes.push(
          new WhereSubqueryNode(
            column,
            operator,
            subQuery.extractQueryNodes(),
            "or",
          ),
        );
        return this;
      }
      return this;
    }

    if (typeof subQueryOrCbOrOperator === "function") {
      subQuery = new QueryBuilder(this.model, this.sqlDataSource);
      subQueryOrCbOrOperator(subQuery);
      this.whereNodes.push(
        new WhereSubqueryNode(
          column,
          operator,
          subQuery.extractQueryNodes(),
          "or",
        ),
      );
      return this;
    }

    if (subQueryOrCbOrOperator instanceof QueryBuilder) {
      subQuery = subQueryOrCbOrOperator;
      this.whereNodes.push(
        new WhereSubqueryNode(
          column,
          operator,
          subQuery.extractQueryNodes(),
          "or",
        ),
      );
      return this;
    }

    return this;
  }

  /**
   * @description Can be used to build a more complex where condition with parenthesis that wraps the where condition defined in the callback
   * @alias andWhereBuilder
   */
  whereBuilder(
    cb: (queryBuilder: QueryBuilderWithOnlyWhereConditions<T>) => void,
  ): this {
    return this.andWhereBuilder(
      cb as (queryBuilder: QueryBuilderWithOnlyWhereConditions<T>) => void,
    );
  }

  /**
   * @description Can be used to build a more complex where condition with parenthesis that wraps the where condition defined in the callback
   */
  andWhereBuilder(cb: (queryBuilder: QueryBuilder<T>) => void): this {
    const nestedBuilder = new QueryBuilder(this.model, this.sqlDataSource);
    nestedBuilder.isNestedCondition = true;
    cb(nestedBuilder as QueryBuilder<T>);

    const whereGroupNode = new WhereGroupNode(nestedBuilder.whereNodes, "and");
    this.whereNodes.push(whereGroupNode);

    return this;
  }

  /**
   * @description Can be used to build a more complex where condition with parenthesis that wraps the where condition defined in the callback
   */
  orWhereBuilder(cb: (queryBuilder: QueryBuilder<T>) => void): this {
    const nestedBuilder = new QueryBuilder(this.model, this.sqlDataSource);
    nestedBuilder.isNestedCondition = true;
    cb(nestedBuilder as QueryBuilder<T>);

    const whereGroupNode = new WhereGroupNode(nestedBuilder.whereNodes, "or");
    this.whereNodes.push(whereGroupNode);

    return this;
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

    const formattedQuery = format(sql, {
      ...this.sqlDataSource.queryFormatOptions,
      language: getSqlDialect(dbType as SqlDataSourceType),
    });

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
    const clone = Object.create(Object.getPrototypeOf(this));
    Object.assign(clone, structuredClone(this));
    return clone as this;
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

  protected extractQueryNodes(): QueryNode[] {
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
}
