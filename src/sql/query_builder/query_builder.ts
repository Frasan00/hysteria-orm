import { convertCase } from "../../utils/case_utils";
import { Model } from "../models/model";
import { getModelColumns } from "../models/model_decorators";
import {
  SelectableType,
  RelationType,
  DynamicColumnType,
} from "../models/model_manager/model_manager_types";
import { MysqlQueryBuilder } from "../mysql/mysql_query_builder";
import { PaginatedData } from "../pagination";
import { PostgresQueryBuilder } from "../postgres/postgres_query_builder";
import selectTemplate from "../resources/query/SELECT";
import { addDynamicColumnsToModel } from "../serializer";
import { SqlDataSource } from "../sql_data_source";
import { SqlLiteQueryBuilder } from "../sqlite/sql_lite_query_builder";
import { DeleteOptions, SoftDeleteOptions } from "./delete_query_builder_type";
import { UpdateOptions } from "./update_query_builder_types";
import { WhereQueryBuilder } from "./where_query_builder";

/**
 * @description The abstract class for query builders for selecting data.
 */
export type ModelQueryBuilder<T extends Model> =
  | MysqlQueryBuilder<T>
  | PostgresQueryBuilder<T>
  | SqlLiteQueryBuilder<T>;

export type FetchHooks = "beforeFetch" | "afterFetch";

export type OneOptions = {
  ignoreHooks?: FetchHooks[];
};

export type ManyOptions = {
  ignoreHooks?: FetchHooks[];
};

export abstract class QueryBuilder<
  T extends Model,
> extends WhereQueryBuilder<T> {
  protected selectQuery: string;
  protected joinQuery: string;
  protected relations: string[];
  protected dynamicColumns: string[];
  protected groupByQuery: string;
  protected orderByQuery: string;
  protected limitQuery: string;
  protected offsetQuery: string;
  protected selectTemplate: ReturnType<typeof selectTemplate>;

  /**
   * @description Constructs a Mysql_query_builder instance.
   */
  protected constructor(
    model: typeof Model,
    table: string,
    logs: boolean,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, table, logs, false, sqlDataSource);
    this.sqlDataSource = sqlDataSource;
    this.selectQuery = selectTemplate(
      this.sqlDataSource.getDbType(),
      this.model,
    ).selectAll;
    this.selectTemplate = selectTemplate(
      this.sqlDataSource.getDbType(),
      this.model,
    );
    this.joinQuery = "";
    this.relations = [];
    this.dynamicColumns = [];
    this.groupByQuery = "";
    this.orderByQuery = "";
    this.limitQuery = "";
    this.offsetQuery = "";
  }

  /**
   * @description Executes the query and retrieves the first result.
   * @returns A Promise resolving to the first result or null.
   */
  abstract one(options: OneOptions): Promise<T | null>;

  /**
   * @description Executes the query and retrieves the first result.
   * @alias one
   */
  async first(options: OneOptions): Promise<T | null> {
    return this.one(options);
  }

  /**
   * @description Executes the query and retrieves the first result. Fail if no result is found.
   */
  abstract oneOrFail(options?: {
    ignoreHooks?: OneOptions["ignoreHooks"] & { customError?: Error };
  }): Promise<T>;

  /**
   * @description Executes the query and retrieves the first result. Fail if no result is found.
   * @alias oneOrFail
   */
  async firstOrFail(options?: {
    ignoreHooks?: OneOptions["ignoreHooks"] & { customError?: Error };
  }): Promise<T> {
    return this.oneOrFail(options);
  }

  /**
   * @description Executes the query and retrieves multiple results.
   * @returns A Promise resolving to an array of results.
   */
  abstract many(options: ManyOptions): Promise<T[]>;

  /**
   * @description Updates records in the database.
   * @returns The number of affected rows.
   */
  abstract update(data: Partial<T>, options?: UpdateOptions): Promise<number>;

  /**
   * @description soft Deletes Records from the database.
   * @default column - 'deletedAt'
   * @default value - The current date and time.
   * @default ignoreBeforeDeleteHook - false
   * @default trx - undefined
   * @returns The number of affected rows.
   */
  abstract softDelete(options?: SoftDeleteOptions<T>): Promise<number>;

  /**
   * @description Deletes Records from the database for the current query.
   * @returns The number of affected rows.
   */
  abstract delete(options?: DeleteOptions): Promise<number>;

  /**
   * @description Executes the query and retrieves the count of results, it ignores all select, group by, order by, limit and offset clauses if they are present.
   * @returns A Promise resolving to the count of results.
   */
  abstract getCount(options: { ignoreHooks: boolean }): Promise<number>;

  /**
   * @description Executes the query and retrieves the sum of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   * @returns A Promise resolving to the sum of the column.
   */
  abstract getSum(
    column: string,
    options: { ignoreHooks: boolean },
  ): Promise<number>;

  /**
   * @description Executes the query and retrieves multiple results.
   * @returns A Promise resolving to an array of results.
   */
  abstract paginate(
    page: number,
    limit: number,
    options?: ManyOptions,
  ): Promise<PaginatedData<T>>;

  /**
   * @description Adds a SELECT condition to the query.
   * @returns The Mysql_query_builder instance for chaining.
   */
  abstract select(...columns: string[]): ModelQueryBuilder<T>;
  abstract select(
    ...columns: (SelectableType<T> | "*")[]
  ): ModelQueryBuilder<T>;
  abstract select(
    ...columns: (SelectableType<T> | "*" | string)[]
  ): ModelQueryBuilder<T>;

  /**
   * @description Adds a JOIN condition to the query.
   */
  abstract join(
    table: string,
    primaryColumn: string,
    foreignColumn: string,
  ): ModelQueryBuilder<T>;

  /**
   * @description Adds a LEFT JOIN condition to the query.
   */
  abstract leftJoin(
    table: string,
    primaryColumn: string,
    foreignColumn: string,
  ): ModelQueryBuilder<T>;

  /**
   * @description Adds a relation to the query.
   */
  abstract addRelations(relations: RelationType<T>[]): ModelQueryBuilder<T>;

  /**
   * @description Adds a the selected dynamic columns from the model into the final model
   */
  abstract addDynamicColumns(
    dynamicColumns: DynamicColumnType<T>[],
  ): ModelQueryBuilder<T>;

  /**
   * @description Build more complex where conditions.
   */
  abstract whereBuilder(
    cb: (queryBuilder: ModelQueryBuilder<T>) => void,
  ): ModelQueryBuilder<T>;

  /**
   * @description Build more complex where conditions.
   */
  abstract andWhereBuilder(
    cb: (queryBuilder: ModelQueryBuilder<T>) => void,
  ): ModelQueryBuilder<T>;

  /**
   * @description Build more complex where conditions.
   */
  abstract orWhereBuilder(
    cb: (queryBuilder: ModelQueryBuilder<T>) => void,
  ): ModelQueryBuilder<T>;

  /**
   * @description Adds GROUP BY conditions to the query.
   * @returns The Mysql_query_builder instance for chaining.
   */
  abstract groupBy(...columns: SelectableType<T>[]): ModelQueryBuilder<T>;
  abstract groupBy(...columns: string[]): ModelQueryBuilder<T>;
  abstract groupBy(
    ...columns: (SelectableType<T> | string)[]
  ): ModelQueryBuilder<T>;

  /**
   * @description Adds a raw GROUP BY condition to the query, only one raw GROUP BY condition is stackable, the last one will be used.
   * @returns The Mysql_query_builder instance for chaining.
   */
  abstract groupByRaw(query: string): ModelQueryBuilder<T>;

  /**
   * @description Adds ORDER BY conditions to the query.
   * @returns The Mysql_query_builder instance for chaining.
   */
  abstract orderBy(
    columns: SelectableType<T>[],
    order: "ASC" | "DESC",
  ): ModelQueryBuilder<T>;
  abstract orderBy(
    columns: string[],
    order: "ASC" | "DESC",
  ): ModelQueryBuilder<T>;
  abstract orderBy(
    columns: (SelectableType<T> | string)[],
    order: "ASC" | "DESC",
  ): ModelQueryBuilder<T>;

  /**
   * @description Adds a raw ORDER BY condition to the query, only one raw ORDER BY condition is stackable, the last one will be used.
   * @returns The Mysql_query_builder instance for chaining.
   */
  abstract orderByRaw(query: string): ModelQueryBuilder<T>;

  /**
   * @description Adds a LIMIT condition to the query.
   * @returns The Mysql_query_builder instance for chaining.
   */
  abstract limit(limit: number): ModelQueryBuilder<T>;

  /**
   * @description Adds an OFFSET condition to the query.
   * @returns The Mysql_query_builder instance for chaining.
   */
  abstract offset(offset: number): ModelQueryBuilder<T>;

  /**
   * @description Returns a copy of the query builder instance.
   * @returns A copy of the query builder instance.
   */
  abstract copy(): ModelQueryBuilder<T>;

  getCurrentQuery(): {
    query: string;
    params: any[];
  } {
    const query =
      this.selectQuery +
      this.joinQuery +
      this.whereQuery +
      this.groupByQuery +
      this.orderByQuery +
      this.limitQuery +
      this.offsetQuery;

    function parsePlaceHolders(
      dbType: string,
      query: string,
      startIndex: number = 1,
    ): string {
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          return query.replace(/PLACEHOLDER/g, () => "?");
        case "postgres":
          let index = startIndex;
          return query.replace(/PLACEHOLDER/g, () => `$${index++}`);
        default:
          throw new Error(
            "Unsupported database type, did you forget to set the dbType in the function params?",
          );
      }
    }

    const parsedQuery = parsePlaceHolders(
      this.sqlDataSource.getDbType(),
      query,
    );

    return { query: parsedQuery, params: this.params };
  }

  protected groupFooterQuery(): string {
    return (
      this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery
    );
  }

  protected async mergeRawPacketIntoModel(
    model: T,
    row: any,
    typeofModel: typeof Model,
  ) {
    const columns = getModelColumns(this.model);
    Object.entries(row).forEach(([key, value]) => {
      const casedKey = convertCase(
        key,
        typeofModel.modelCaseConvention,
      ) as string;
      if (columns.includes(casedKey)) {
        Object.assign(model, { [casedKey]: value });
        return;
      }

      model.extraColumns[key] = value as string | number | boolean;
    });

    if (!this.dynamicColumns.length) {
      return;
    }

    await addDynamicColumnsToModel(this.model, model, this.dynamicColumns);
  }
}
