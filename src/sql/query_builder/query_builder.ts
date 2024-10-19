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
  throwErrorOnNull?: boolean;
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
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param logs - A boolean indicating whether to log queries.
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
    this.whereQuery = "";
    this.groupByQuery = "";
    this.orderByQuery = "";
    this.limitQuery = "";
    this.offsetQuery = "";
  }

  /**
   * @description Executes the query and retrieves the first result.
   * @returns A Promise resolving to the first result or null.
   */
  public abstract one(options: OneOptions): Promise<T | null>;

  /**
   * @description Executes the query and retrieves the first result. Fail if no result is found.
   */
  public abstract oneOrFail(options?: {
    ignoreHooks?: OneOptions["ignoreHooks"];
  }): Promise<T>;

  /**
   * @description Executes the query and retrieves multiple results.
   * @returns A Promise resolving to an array of results.
   */
  public abstract many(options: ManyOptions): Promise<T[]>;

  /**
   * @description Executes the query and retrieves the count of results, it ignores all select, group by, order by, limit and offset clauses if they are present.
   * @returns A Promise resolving to the count of results.
   */
  public abstract getCount(options: { ignoreHooks: boolean }): Promise<number>;

  /**
   * @description Executes the query and retrieves the sum of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   * @param column - The column to sum.
   * @returns A Promise resolving to the sum of the column.
   */
  public abstract getSum(
    column: string,
    options: { ignoreHooks: boolean },
  ): Promise<number>;

  /**
   * @description Executes the query and retrieves multiple results.
   * @returns A Promise resolving to an array of results.
   */
  public abstract paginate(
    page: number,
    limit: number,
    options?: ManyOptions,
  ): Promise<PaginatedData<T>>;

  /**
   * @description Adds a SELECT condition to the query.
   * @param columns - The columns to select.
   * @returns The Mysql_query_builder instance for chaining.
   */
  public abstract select(...columns: string[]): ModelQueryBuilder<T>;
  public abstract select(
    ...columns: (SelectableType<T> | "*")[]
  ): ModelQueryBuilder<T>;
  public abstract select(
    ...columns: (SelectableType<T> | "*" | string)[]
  ): ModelQueryBuilder<T>;

  /**
   * @description Adds a JOIN condition to the query.
   * @param table
   * @param primaryColumn
   * @param foreignColumn
   */
  public abstract join(
    table: string,
    primaryColumn: string,
    foreignColumn: string,
  ): ModelQueryBuilder<T>;

  /**
   * @description Adds a LEFT JOIN condition to the query.
   * @param table
   * @param primaryColumn
   * @param foreignColumn
   */
  public abstract leftJoin(
    table: string,
    primaryColumn: string,
    foreignColumn: string,
  ): ModelQueryBuilder<T>;

  /**
   * @description Adds a relation to the query.
   * @param relations - The relations to add.
   */
  public abstract addRelations(
    relations: RelationType<T>[],
  ): ModelQueryBuilder<T>;

  /**
   * @description Adds a the selected dynamic columns from the model into the final model
   * @param relations - The dynamic columns to add.
   */
  public abstract addDynamicColumns(
    dynamicColumns: DynamicColumnType<T>[],
  ): ModelQueryBuilder<T>;

  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  public abstract whereBuilder(
    cb: (queryBuilder: ModelQueryBuilder<T>) => void,
  ): ModelQueryBuilder<T>;

  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  public abstract andWhereBuilder(
    cb: (queryBuilder: ModelQueryBuilder<T>) => void,
  ): ModelQueryBuilder<T>;

  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  public abstract orWhereBuilder(
    cb: (queryBuilder: ModelQueryBuilder<T>) => void,
  ): ModelQueryBuilder<T>;

  /**
   * @description Adds GROUP BY conditions to the query.
   * @param columns - The columns to group by.
   * @returns The Mysql_query_builder instance for chaining.
   */
  public abstract groupBy(
    ...columns: SelectableType<T>[]
  ): ModelQueryBuilder<T>;
  public abstract groupBy(...columns: string[]): ModelQueryBuilder<T>;
  public abstract groupBy(
    ...columns: (SelectableType<T> | string)[]
  ): ModelQueryBuilder<T>;

  /**
   * @description Adds a raw GROUP BY condition to the query, only one raw GROUP BY condition is stackable, the last one will be used.
   * @param query - The raw SQL GROUP BY condition.
   * @returns The Mysql_query_builder instance for chaining.
   */
  public abstract groupByRaw(query: string): ModelQueryBuilder<T>;

  /**
   * @description Adds ORDER BY conditions to the query.
   * @param column - The column to order by.
   * @param order - The order direction, either "ASC" or "DESC".
   * @returns The Mysql_query_builder instance for chaining.
   */
  public abstract orderBy(
    columns: SelectableType<T>[],
    order: "ASC" | "DESC",
  ): ModelQueryBuilder<T>;
  public abstract orderBy(
    columns: string[],
    order: "ASC" | "DESC",
  ): ModelQueryBuilder<T>;
  public abstract orderBy(
    columns: (SelectableType<T> | string)[],
    order: "ASC" | "DESC",
  ): ModelQueryBuilder<T>;

  /**
   * @description Adds a raw ORDER BY condition to the query, only one raw ORDER BY condition is stackable, the last one will be used.
   * @param query - The raw SQL ORDER BY condition.
   * @returns The Mysql_query_builder instance for chaining.
   */
  public abstract orderByRaw(query: string): ModelQueryBuilder<T>;

  /**
   * @description Adds a LIMIT condition to the query.
   * @param limit - The maximum number of rows to return.
   * @returns The Mysql_query_builder instance for chaining.
   */
  public abstract limit(limit: number): ModelQueryBuilder<T>;

  /**
   * @description Adds an OFFSET condition to the query.
   * @param offset - The number of rows to skip.
   * @returns The Mysql_query_builder instance for chaining.
   */
  public abstract offset(offset: number): ModelQueryBuilder<T>;

  /**
   * @description Returns a copy of the query builder instance.
   * @returns A copy of the query builder instance.
   */
  public abstract copy(): ModelQueryBuilder<T>;

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
