import { format } from "sql-formatter";
import { HysteriaError } from "../../errors/hysteria_error";
import { convertCase } from "../../utils/case_utils";
import { convertPlaceHolderToValue } from "../../utils/placeholder";
import { SoftDeleteOptions } from "../model_query_builder/delete_query_builder_type";
import {
  WhereQueryBuilder,
  WhereQueryBuilderWithOnlyWhereConditions,
} from "../model_query_builder/where_query_builder";
import type { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import SqlModelManagerUtils from "../models/model_manager/model_manager_utils";
import deleteTemplate from "../resources/query/DELETE";
import selectTemplate from "../resources/query/SELECT";
import updateTemplate from "../resources/query/UPDATE";
import { SqlDataSource } from "../sql_data_source";
import type { SqlDataSourceType } from "../sql_data_source_types";
import { execSql, getSqlDialect } from "../sql_runner/sql_runner";
import { BinaryOperatorType, BaseValues } from "../resources/query/WHERE";

export class QueryBuilder<T extends Model = any> extends WhereQueryBuilder<T> {
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;
  protected modelSelectedColumns: string[] = [];
  protected dbType: SqlDataSourceType;
  protected selectQuery: string;
  protected selectTemplate: ReturnType<typeof selectTemplate>;
  protected updateTemplate: ReturnType<typeof updateTemplate>;
  protected deleteTemplate: ReturnType<typeof deleteTemplate>;
  protected isNestedCondition = false;

  constructor(
    model: typeof Model,
    sqlDataSource: SqlDataSource = SqlDataSource.getInstance(),
  ) {
    super(model, sqlDataSource, false);
    this.dbType = sqlDataSource.getDbType();
    this.isNestedCondition = false;
    this.sqlModelManagerUtils = new SqlModelManagerUtils<T>(
      this.dbType,
      this.sqlDataSource,
    );
    this.table = model.table || "";
    this.selectTemplate = selectTemplate(this.dbType, this.model);
    this.updateTemplate = updateTemplate(this.dbType, this.model);
    this.deleteTemplate = deleteTemplate(this.dbType);
    this.selectQuery = this.selectTemplate.selectAll;
    this.params = [];
  }

  /**
   * @description Executes the query and retrieves multiple results.
   */
  async many(): Promise<T[]> {
    let query: string = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;

    if (this.whereQuery) {
      query += this.whereQuery;
    }

    query += this.groupFooterQuery();
    return execSql(query, this.params, this.sqlDataSource, "raw", {
      sqlLiteOptions: {
        typeofModel: this.model,
      },
    });
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
   * @description Selects columns from a table, all columns are selected by default
   */
  /**
   * @description Adds a SELECT condition to the query.
   */
  select(...columns: string[]): this;
  select(...columns: (ModelKey<T> | "*")[]): this;
  select(...columns: (ModelKey<T> | "*" | string)[]): this {
    this.selectQuery = this.selectTemplate.selectColumns(
      ...(columns as string[]),
    );

    this.modelSelectedColumns = columns.map((column) =>
      convertCase(column as string, this.model.databaseCaseConvention),
    ) as string[];

    return this;
  }

  clearSelect(): this {
    this.selectQuery = this.selectTemplate.selectAll;
    return this;
  }

  distinct(): this {
    const distinct = this.selectTemplate.distinct;
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinct}`,
    );

    return this;
  }

  distinctOn(...columns: ModelKey<T>[]): this;
  distinctOn(...columns: string[]): this;
  distinctOn(...columns: (string | ModelKey<T>)[]): this {
    const distinctOn = this.selectTemplate.distinctOn(...(columns as string[]));

    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinctOn}`,
    );

    return this;
  }

  /**
   * @description Insert record into a table
   * @returns raw driver response
   */
  async insert<T = any>(data: Record<string, any>): Promise<T> {
    const model = data as any;
    const { query, params } = this.sqlModelManagerUtils.parseInsert(
      model,
      { ...this.model, table: this.table } as typeof Model,
      this.dbType,
    );

    const rows = await execSql(query, params, this.sqlDataSource, "raw", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "insertOne",
        models: [model],
      },
    });

    return rows[0];
  }

  /**
   * @description Insert multiple records into a table
   * @returns raw driver response
   */
  async insertMany<T = any>(data: Record<string, any>[]): Promise<T[]> {
    const models = data as any[];
    const { query, params } = this.sqlModelManagerUtils.parseMassiveInsert(
      models,
      { ...this.model, table: this.table } as typeof Model,
      this.dbType,
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
   * @description Deletes records from a table
   * @returns the number of affected rows
   */
  async delete(): Promise<number> {
    const query = this.deleteTemplate.massiveDelete(
      this.table,
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
   * @default value - The current date and time.
   * @returns the number of affected rows
   */
  async softDelete(options: SoftDeleteOptions<T> = {}): Promise<number> {
    const {
      column = "deletedAt",
      value = new Date().toISOString().slice(0, 19).replace("T", " "),
    } = options || {};

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
   * @description Given a callback, it will execute the callback with a query builder instance.
   */
  whereBuilder(
    cb: (queryBuilder: WhereQueryBuilderWithOnlyWhereConditions<T>) => void,
  ): this {
    const queryBuilder = new QueryBuilder(this.model, this.sqlDataSource);
    cb(queryBuilder as WhereQueryBuilderWithOnlyWhereConditions<T>);
    queryBuilder.isNestedCondition = true;

    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4); // 'AND '.length === 4 has to be removed from the beginning of the where condition
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3); // 'OR '.length === 3 has to be removed from the beginning of the where condition
    }

    whereCondition = "(" + whereCondition + ")";

    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition
        ? whereCondition
        : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }

    this.params.push(...queryBuilder.params);
    return this;
  }

  /**
   * @description Given a callback, it will execute the callback with a query builder instance.
   */
  orWhereBuilder(
    cb: (queryBuilder: WhereQueryBuilderWithOnlyWhereConditions<T>) => void,
  ): this {
    const nestedBuilder = new QueryBuilder(this.model, this.sqlDataSource);
    cb(nestedBuilder as WhereQueryBuilderWithOnlyWhereConditions<T>);
    nestedBuilder.isNestedCondition = true;

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
   * @description Given a callback, it will execute the callback with a query builder instance.
   */
  andWhereBuilder(
    cb: (queryBuilder: WhereQueryBuilderWithOnlyWhereConditions<T>) => void,
  ): this {
    const nestedBuilder = new QueryBuilder(this.model, this.sqlDataSource);
    cb(nestedBuilder as WhereQueryBuilderWithOnlyWhereConditions<T>);
    nestedBuilder.isNestedCondition = true;

    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }

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

  toSql(dbType?: SqlDataSourceType): {
    query: string;
    params: any[];
  } {
    const query =
      this.selectQuery +
      this.joinQuery +
      this.whereQuery +
      this.groupByQuery +
      this.havingQuery +
      this.orderByQuery +
      this.limitQuery +
      this.offsetQuery;

    function parsePlaceHolders(
      dbType: SqlDataSourceType,
      query: string,
      startIndex: number = 1,
    ): string {
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          return query.replace(/PLACEHOLDER/g, () => "?");
        case "postgres":
        case "cockroachdb":
          let index = startIndex;
          return query.replace(/PLACEHOLDER/g, () => `$${index++}`);
        default:
          throw new HysteriaError(
            "StandaloneSqlQueryBuilder::toSql",
            `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
          );
      }
    }

    const parsedQuery = parsePlaceHolders(dbType || this.dbType, query);
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
    const queryBuilder = new QueryBuilder(this.model, this.sqlDataSource);
    queryBuilder.selectQuery = this.selectQuery;
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
    return query.replace(/PLACEHOLDER/g, () => {
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
}
