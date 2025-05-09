import { format } from "sql-formatter";
import { HysteriaError } from "../../errors/hysteria_error";
import { baseSoftDeleteDate } from "../../utils/date_utils";
import { convertPlaceHolderToValue } from "../../utils/placeholder";
import { bindParamsIntoQuery } from "../../utils/query";
import type { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import SqlModelManagerUtils from "../models/model_manager/model_manager_utils";
import deleteTemplate from "../resources/query/DELETE";
import { UnionCallBack } from "../resources/query/SELECT";
import updateTemplate from "../resources/query/UPDATE";
import { BinaryOperatorType } from "../resources/query/WHERE";
import { SqlDataSource } from "../sql_data_source";
import type { SqlDataSourceType } from "../sql_data_source_types";
import { execSql, getSqlDialect } from "../sql_runner/sql_runner";
import { CteBuilder } from "./cte/cte_builder";
import { WithClauseType } from "./cte/cte_types";
import { SoftDeleteOptions } from "./delete_query_builder_type";
import {
  PluckReturnType,
  QueryBuilderWithOnlyWhereConditions,
} from "./query_builder_types";
import { WhereQueryBuilder } from "./where_query_builder";
import type { NumberModelKey } from "../models/model_types";

export class QueryBuilder<T extends Model = any> extends WhereQueryBuilder<T> {
  model: typeof Model;
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;
  protected unionQuery: string;
  protected updateTemplate: ReturnType<typeof updateTemplate>;
  protected deleteTemplate: ReturnType<typeof deleteTemplate>;
  protected isNestedCondition = false;
  protected lockForUpdateQuery: string;

  constructor(
    model: typeof Model,
    sqlDataSource: SqlDataSource = SqlDataSource.getInstance(),
  ) {
    super(model, sqlDataSource, false);
    this.lockForUpdateQuery = "";
    this.dbType = sqlDataSource.getDbType();
    this.isNestedCondition = false;
    this.sqlModelManagerUtils = new SqlModelManagerUtils<T>(
      this.dbType,
      this.sqlDataSource,
    );
    this.model = model;
    this.updateTemplate = updateTemplate(this.dbType, this.model);
    this.deleteTemplate = deleteTemplate(this.dbType);
    this.unionQuery = "";
    this.params = [];
  }

  /**
   * @description Executes the query and retrieves multiple results.
   */
  async many(): Promise<T[]> {
    let query: string = "";
    if (this.withQuery) {
      query += `${this.withQuery}\n`;
    }

    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(this.fromTable, [
        `*`,
      ]);
    }

    query += this.selectQuery + this.joinQuery;
    if (this.whereQuery) {
      query += this.whereQuery;
    }

    query += this.groupFooterQuery();
    if (this.unionQuery) {
      query = `${query} ${this.unionQuery}`;
    }

    if (this.lockForUpdateQuery) {
      query += this.lockForUpdateQuery;
    }

    return execSql(query, this.params, this.sqlDataSource, "raw", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "fetch",
      },
    });
  }

  /**
   * @description Executes the query and retrieves a single column from the results.
   * @param key - The column to retrieve from the results, must be a Model Column
   * @param options - The options to pass to the method
   * @param options.removeFalsy - If true, the method will remove falsy values filtering the array for truthy values - Applies Boolean constructor to each value
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
   * @description Locks the table for update
   * @param skipLocked - If true, the query will skip locked rows
   * @throws {HysteriaError} - If the database type does not support skipping locked rows (es. sqlite)
   */
  lockForUpdate(skipLocked: boolean = false): this {
    this.lockForUpdateQuery = this.selectTemplate.lockForUpdate();
    if (skipLocked) {
      this.lockForUpdateQuery += this.selectTemplate.skipLocked();
    }

    return this;
  }

  /**
   * @description Locks the table for share
   * @param skipLocked - If true, the query will skip locked rows
   * @throws {HysteriaError} - If the database type does not support skipping locked rows on forShare (es. sqlite, mysql, mariadb)
   */
  forShare(skipLocked: boolean = false): this {
    this.lockForUpdateQuery = this.selectTemplate.forShare();
    if (skipLocked) {
      this.lockForUpdateQuery += this.selectTemplate.skipLocked();
    }
    return this;
  }

  /**
   * @description Adds a UNION to the query.
   */
  union(cb: UnionCallBack<T>): this;
  union(queryBuilder: QueryBuilder<any>): this;
  union(queryBuilderOrCb: UnionCallBack<T> | QueryBuilder<any>): this {
    const queryBuilder =
      queryBuilderOrCb instanceof QueryBuilder
        ? queryBuilderOrCb
        : queryBuilderOrCb(new QueryBuilder(this.model, this.sqlDataSource));

    const { query, params } = queryBuilder.unWrap();
    this.unionQuery = `${this.unionQuery} UNION ${query}`;
    this.params = [...this.params, ...params];
    return this;
  }

  /**
   * @description Adds a UNION ALL to the query.
   */
  unionAll(cb: UnionCallBack<T>): this;
  unionAll(queryBuilder: QueryBuilder<any>): this;
  unionAll(queryBuilderOrCb: UnionCallBack<T> | QueryBuilder<any>): this {
    const queryBuilder =
      queryBuilderOrCb instanceof QueryBuilder
        ? queryBuilderOrCb
        : queryBuilderOrCb(new QueryBuilder(this.model, this.sqlDataSource));

    const { query, params } = queryBuilder.unWrap();
    this.unionQuery = `${this.unionQuery} UNION ALL ${query}`;
    this.params = [...this.params, ...params];
    return this;
  }

  /**
   * @description Increments the value of a column by a given amount, column must be of a numeric type in order to be incremented
   * @typeSafe - In typescript, only numeric columns of the model will be accepted if using a Model
   * @default value + 1
   */
  async increment(
    column: NumberModelKey<T>,
    value: number = 1,
  ): Promise<number> {
    const { query } = this.updateTemplate.increment(
      column as string,
      value,
      this.whereQuery,
      this.joinQuery,
    );

    return execSql(query, this.params, this.sqlDataSource, "affectedRows", {
      sqlLiteOptions: { typeofModel: this.model, mode: "affectedRows" },
    });
  }

  /**
   * @description Decrements the value of a column by a given amount, column must be of a numeric type in order to be decremented
   * @typeSafe - In typescript, only numeric columns of the model will be accepted if using a Model
   * @default value - 1
   */
  async decrement(
    column: NumberModelKey<T>,
    value: number = 1,
  ): Promise<number> {
    const { query } = this.updateTemplate.decrement(
      column as string,
      value,
      this.whereQuery,
      this.joinQuery,
    );

    return execSql(query, this.params, this.sqlDataSource, "affectedRows", {
      sqlLiteOptions: { typeofModel: this.model, mode: "affectedRows" },
    });
  }

  /**
   * @description Creates a CTE with the provided type that has the query builder as the query
   * @description For the moment, with is only taken into account when making a select query
   * @returns The CTE query builder, you can chain other methods after calling this method in order to interact with the CTE
   */
  with(
    type: WithClauseType,
    cb: (cteBuilder: CteBuilder<T>) => CteBuilder<T>,
  ): Omit<this, "with">;
  with(
    type: string,
    cb: (cteBuilder: CteBuilder<T>) => CteBuilder<T>,
  ): Omit<this, "with">;
  with(
    type: WithClauseType | string,
    cb: (cteBuilder: CteBuilder<T>) => CteBuilder<T>,
  ): Omit<this, "with"> {
    const cteBuilder = new CteBuilder<T>(type, this.model, this.sqlDataSource);
    cb(cteBuilder);
    const { query, params } = cteBuilder.unWrap();
    this.withQuery = query;
    this.params = [...this.params, ...params];
    return this;
  }

  /**
   * @description Insert record into a table
   * @param returning - The columns to return from the query, only supported by postgres and cockroachdb - default is "*"
   * @returns raw driver response
   */
  async insert<T = any>(
    data: Record<string, any>,
    returning?: string[],
  ): Promise<T> {
    const model = data as any;
    const { query, params } = this.sqlModelManagerUtils.parseInsert(
      model,
      { ...this.model, table: this.fromTable } as typeof Model,
      this.dbType,
      returning,
    );

    const rows = await execSql(query, params, this.sqlDataSource, "raw", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "insertOne",
        models: [model],
      },
    });

    return Array.isArray(rows) && rows.length ? rows[0] : rows;
  }

  /**
   * @description Insert multiple records into a table
   * @param returning - The columns to return from the query, only supported by postgres and cockroachdb - default is "*"
   * @returns raw driver response
   */
  async insertMany<T = any>(
    data: Record<string, any>[],
    returning?: string[],
  ): Promise<T[]> {
    const models = data as any[];
    const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
      models,
      { ...this.model, table: this.fromTable } as typeof Model,
      this.dbType,
      returning,
    );

    return execSql(query, params, this.sqlDataSource, "raw", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "insertMany",
        models: models,
      },
    });
  }

  /**
   * @description Updates records from a table
   * @returns the number of affected rows
   */
  async update(data: Record<string, any>): Promise<number> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    this.whereQuery = convertPlaceHolderToValue(
      this.dbType,
      this.whereQuery,
      values.length + 1,
    );

    const { query, params } = this.updateTemplate.massiveUpdate(
      columns,
      values,
      this.whereQuery,
      this.joinQuery,
    );

    params.push(...this.params);

    return execSql(query, params, this.sqlDataSource, "affectedRows", {
      sqlLiteOptions: { typeofModel: this.model, mode: "affectedRows" },
    });
  }

  /**
   * @description Truncates the table
   * @param options
   * @param force - forces the truncate ignoring checks
   * @restartAutoIncrement restarts from zero auto increment tables
   */
  async truncate(options?: { force?: boolean }): Promise<void> {
    const truncateQueries = deleteTemplate(this.dbType).truncate(
      this.fromTable,
      options?.force || false,
    );

    for (const truncateQuery of truncateQueries) {
      await execSql(truncateQuery, [], this.sqlDataSource);
    }
  }

  /**
   * @description Deletes records from a table
   * @returns the number of affected rows
   */
  async delete(): Promise<number> {
    const query = this.deleteTemplate.massiveDelete(
      this.fromTable,
      this.whereQuery,
      this.joinQuery,
    );

    return execSql(query, this.params, this.sqlDataSource, "affectedRows", {
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

    let { query, params } = this.updateTemplate.massiveUpdate(
      [column as string],
      [value],
      this.whereQuery,
      this.joinQuery,
    );

    params = [...params, ...this.params];
    return execSql(query, params, this.sqlDataSource, "affectedRows", {
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
    operator: BinaryOperatorType,
    subQuery: QueryBuilder<T>,
  ): this;
  whereSubQuery(
    column: string,
    operator: BinaryOperatorType,
    cb: (subQuery: QueryBuilder<T>) => void,
  ): this;
  whereSubQuery(
    column: string,
    subQueryOrCbOrOperator:
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void)
      | BinaryOperatorType,
    subQueryOrCb?: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    return this.andWhereSubQuery(
      column,
      subQueryOrCbOrOperator as BinaryOperatorType,
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
    operator: BinaryOperatorType,
    subQuery: QueryBuilder<T>,
  ): this;
  andWhereSubQuery(
    column: string,
    operator: BinaryOperatorType,
    cb: (subQuery: QueryBuilder<T>) => void,
  ): this;
  andWhereSubQuery(
    column: string,
    subQueryOrCbOrOperator:
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void)
      | BinaryOperatorType,
    subQueryOrCb?: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    let operator: BinaryOperatorType = "=";
    let subQuery: QueryBuilder<T>;

    if (typeof subQueryOrCbOrOperator === "string") {
      operator = subQueryOrCbOrOperator as BinaryOperatorType;
      if (typeof subQueryOrCb === "function") {
        subQuery = new QueryBuilder(this.model, this.sqlDataSource);
        subQueryOrCb(subQuery);
        return this.processSubQuery(column, subQuery, operator, "and");
      }
      if (subQueryOrCb instanceof QueryBuilder) {
        subQuery = subQueryOrCb;
        return this.processSubQuery(column, subQuery, operator, "and");
      }
      return this;
    }

    if (typeof subQueryOrCbOrOperator === "function") {
      subQuery = new QueryBuilder(this.model, this.sqlDataSource);
      subQueryOrCbOrOperator(subQuery);
      return this.processSubQuery(column, subQuery, operator, "and");
    }

    if (subQueryOrCbOrOperator instanceof QueryBuilder) {
      subQuery = subQueryOrCbOrOperator;
      return this.processSubQuery(column, subQuery, operator, "and");
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
    operator: BinaryOperatorType,
    subQuery: QueryBuilder<T>,
  ): this;
  orWhereSubQuery(
    column: string,
    operator: BinaryOperatorType,
    cb: (subQuery: QueryBuilder<T>) => void,
  ): this;
  orWhereSubQuery(
    column: string,
    subQueryOrCbOrOperator:
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void)
      | BinaryOperatorType,
    subQueryOrCb?: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    let operator: BinaryOperatorType = "=";
    let subQuery: QueryBuilder<T>;

    if (typeof subQueryOrCbOrOperator === "string") {
      operator = subQueryOrCbOrOperator as BinaryOperatorType;
      if (typeof subQueryOrCb === "function") {
        subQuery = new QueryBuilder(this.model, this.sqlDataSource);
        subQueryOrCb(subQuery);
        return this.processSubQuery(column, subQuery, operator, "or");
      }
      if (subQueryOrCb instanceof QueryBuilder) {
        subQuery = subQueryOrCb;
        return this.processSubQuery(column, subQuery, operator, "or");
      }
      return this;
    }

    if (typeof subQueryOrCbOrOperator === "function") {
      subQuery = new QueryBuilder(this.model, this.sqlDataSource);
      subQueryOrCbOrOperator(subQuery);
      return this.processSubQuery(column, subQuery, operator, "or");
    }

    if (subQueryOrCbOrOperator instanceof QueryBuilder) {
      subQuery = subQueryOrCbOrOperator;
      return this.processSubQuery(column, subQuery, operator, "or");
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

    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }

    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition
        ? nestedCondition
        : `WHERE ${nestedCondition}`;

      this.params.push(...nestedBuilder.params);
      return this;
    }

    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);

    return this;
  }

  /**
   * @description Can be used to build a more complex where condition with parenthesis that wraps the where condition defined in the callback
   */
  orWhereBuilder(cb: (queryBuilder: QueryBuilder<T>) => void): this {
    const nestedBuilder = new QueryBuilder(this.model, this.sqlDataSource);
    nestedBuilder.isNestedCondition = true;
    cb(nestedBuilder as QueryBuilder<T>);

    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }

    nestedCondition = `(${nestedCondition})`;
    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition
        ? nestedCondition
        : `WHERE ${nestedCondition}`;

      this.params.push(...nestedBuilder.params);
      return this;
    }

    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);

    return this;
  }

  /**
   * @description Returns the query with the parameters bound to the query, mainly used for debugging
   */
  toQuery(dbType?: SqlDataSourceType): string {
    // Already formatted
    const { query, params } = this.unWrap(dbType);
    return bindParamsIntoQuery(query, params);
  }

  /**
   * @description Returns the query and the params
   */
  unWrap(dbType: SqlDataSourceType = this.dbType): {
    query: string;
    params: any[];
  } {
    const query =
      this.selectQuery +
      this.joinQuery +
      this.whereQuery +
      this.groupFooterQuery();

    function parsePlaceHolders(
      dbType: SqlDataSourceType,
      query: string,
      startIndex: number = 1,
    ): string {
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          return query.replace(/\$PLACEHOLDER/g, () => "?");
        case "postgres":
        case "cockroachdb":
          let index = startIndex;
          return query.replace(/\$PLACEHOLDER/g, () => `$${index++}`);
        default:
          throw new HysteriaError(
            "StandaloneSqlQueryBuilder::unWrap",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    }

    const parsedQuery = parsePlaceHolders(dbType, query);
    return {
      query: format(parsedQuery, {
        language: getSqlDialect(this.dbType),
      }),
      params: this.params,
    };
  }

  /**
   * @description Returns a copy of the query builder instance.
   */
  copy(): this {
    const queryBuilder = new QueryBuilder<T>(this.model, this.sqlDataSource);
    queryBuilder.selectQuery = this.selectQuery;
    queryBuilder.modelSelectedColumns = [...this.modelSelectedColumns];
    queryBuilder.unionQuery = this.unionQuery;
    queryBuilder.fromTable = this.fromTable;
    queryBuilder.whereQuery = this.whereQuery;
    queryBuilder.joinQuery = this.joinQuery;
    queryBuilder.groupByQuery = this.groupByQuery;
    queryBuilder.orderByQuery = this.orderByQuery;
    queryBuilder.limitQuery = this.limitQuery;
    queryBuilder.offsetQuery = this.offsetQuery;
    queryBuilder.params = [...this.params];
    queryBuilder.havingQuery = this.havingQuery;
    return queryBuilder as this;
  }

  protected convertPlaceHolderToValue(query: string) {
    let index = 0;
    return query.replace(/\$PLACEHOLDER/g, () => {
      const indexParam = this.parseValueForDatabase(this.params[index]);
      index++;
      return indexParam;
    });
  }

  protected parseValueForDatabase(value: any): string {
    if (typeof value === "string") {
      switch (this.dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          return `'${value}'`;
        case "postgres":
        case "cockroachdb":
          return `'${value}'`;
        default:
          throw new HysteriaError(
            "StandaloneSqlQueryBuilder::parseValueForDatabase",
            `UNSUPPORTED_DATABASE_TYPE_${this.dbType}`,
          );
      }
    }

    if (typeof value === "number") {
      return value.toString();
    }

    if (value === null) {
      return "NULL";
    }

    if (typeof value === "boolean") {
      switch (this.dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          return value ? "1" : "0";
        case "postgres":
        case "cockroachdb":
          return value ? "TRUE" : "FALSE";
        default:
          throw new HysteriaError(
            "StandaloneSqlQueryBuilder::parseValueForDatabase",
            `UNSUPPORTED_DATABASE_TYPE_${this.dbType}`,
          );
      }
    }

    if (value instanceof Date) {
      switch (this.dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          return `'${value.toISOString().slice(0, 19).replace("T", " ")}'`;
        case "postgres":
        case "cockroachdb":
          return `'${value.toISOString().slice(0, 19).replace("T", " ")}'`;
        default:
          throw new HysteriaError(
            "StandaloneSqlQueryBuilder::parseValueForDatabase",
            `UNSUPPORTED_DATABASE_TYPE_${this.dbType}`,
          );
      }
    }

    return value;
  }

  protected groupFooterQuery(): string {
    return (
      this.groupByQuery +
      this.havingQuery +
      this.orderByQuery +
      this.limitQuery +
      this.offsetQuery
    );
  }

  protected getDatabaseTableName(tableName: string): string {
    switch (this.dbType) {
      case "mysql":
      case "sqlite":
      case "mariadb":
        return tableName;
      case "postgres":
      case "cockroachdb":
        return `"${tableName}"`;
      default:
        throw new HysteriaError(
          "StandaloneSqlQueryBuilder::getDatabaseTableName",
          `UNSUPPORTED_DATABASE_TYPE_${this.dbType}`,
        );
    }
  }

  private processSubQuery(
    column: string,
    subQuery: QueryBuilder<T>,
    operator: BinaryOperatorType,
    type: "and" | "or",
  ): this {
    const { query, params } = subQuery.unWrapRaw();
    if (this.whereQuery || this.isNestedCondition) {
      const whereQuery = this.whereTemplate[`${type}WhereSubQuery`](
        column,
        query,
        params,
        operator,
      );
      this.whereQuery += whereQuery.query;
      this.params.push(...whereQuery.params);
      return this;
    }

    const whereQuery = this.whereTemplate.whereSubQuery(
      column,
      query,
      params,
      operator,
    );
    this.whereQuery = whereQuery.query;
    this.params.push(...whereQuery.params);
    return this;
  }

  /**
   * @description Returns the query and the params without replacing the $PLACEHOLDER with the specific database driver placeholder
   */
  private unWrapRaw(): {
    query: string;
    params: any[];
  } {
    return {
      query: format(
        this.selectQuery +
          this.joinQuery +
          this.whereQuery +
          this.groupFooterQuery(),
        { language: getSqlDialect(this.dbType) },
      ),
      params: this.params,
    };
  }
}
