import selectTemplate from "../Resources/Query/SELECT";
import { Model } from "../Models/Model";
import whereTemplate, {
  BaseValues,
  WhereOperatorType,
} from "../Resources/Query/WHERE.TS";
import { MysqlQueryBuilder } from "../Mysql/MysqlQueryBuilder";
import { PostgresQueryBuilder } from "../Postgres/PostgresQueryBuilder";
import { PaginatedData } from "../pagination";
import {
  RelationType,
  SelectableType,
} from "../Models/ModelManager/ModelManagerTypes";
import { MysqlUpdateQueryBuilder } from "../Mysql/MysqlUpdateQueryBuilder";
import { PostgresUpdateQueryBuilder } from "../Postgres/PostgresUpdateQueryBuilder";
import { MysqlDeleteQueryBuilder } from "../Mysql/MysqlDeleteQueryBuilder";
import { PostgresDeleteQueryBuilder } from "../Postgres/PostgresDeleteQueryBuilder";
import { SqlDataSource } from "../SqlDatasource";

export type QueryBuilders<T extends Model> =
  | MysqlQueryBuilder<T>
  | PostgresQueryBuilder<T>;

export type UpdateQueryBuilders<T extends Model> =
  | MysqlUpdateQueryBuilder<T>
  | PostgresUpdateQueryBuilder<T>;

export type DeleteQueryBuilders<T extends Model> =
  | MysqlDeleteQueryBuilder<T>
  | PostgresDeleteQueryBuilder<T>;

export type OneOptions = {
  throwErrorOnNull: boolean;
};

export abstract class QueryBuilder<T extends Model> {
  protected sqlDataSource: SqlDataSource;
  protected selectQuery: string = "";
  protected joinQuery: string = "";
  protected relations: string[] = [];
  protected whereQuery: string = "";
  protected groupByQuery: string = "";
  protected orderByQuery: string = "";
  protected limitQuery: string = "";
  protected offsetQuery: string = "";
  protected params: BaseValues[] = [];

  protected model: typeof Model;
  protected tableName: string;
  protected logs: boolean;

  protected selectTemplate: ReturnType<typeof selectTemplate>;
  protected whereTemplate: ReturnType<typeof whereTemplate>;

  /**
   * @description Constructs a MysqlQueryBuilder instance.
   * @param model - The model class associated with the table.
   * @param tableName - The name of the table.
   * @param logs - A boolean indicating whether to log queries.
   */
  protected constructor(
    model: typeof Model,
    tableName: string,
    logs: boolean,
    sqlDataSource: SqlDataSource,
  ) {
    this.sqlDataSource = sqlDataSource;
    this.model = model;
    this.logs = logs;
    this.tableName = tableName;
    this.selectQuery = selectTemplate(
      this.tableName,
      this.sqlDataSource.getDbType(),
    ).selectAll;
    this.selectTemplate = selectTemplate(
      this.tableName,
      this.sqlDataSource.getDbType(),
    );
    this.whereTemplate = whereTemplate(
      this.tableName,
      this.sqlDataSource.getDbType(),
    );
    this.params = [];
  }

  /**
   * @description Executes the query and retrieves the first result.
   * @returns A Promise resolving to the first result or null.
   */
  public abstract one(options: OneOptions): Promise<T | null>;

  /**
   * @description Executes the query and retrieves multiple results.
   * @returns A Promise resolving to an array of results.
   */
  public abstract many(): Promise<T[]>;

  /**
   * @description Executes the query and retrieves multiple results.
   * @returns A Promise resolving to an array of results.
   */
  public abstract paginate(
    page: number,
    limit: number,
  ): Promise<PaginatedData<T>>;

  /**
   * @description Adds a SELECT condition to the query.
   * @param columns - The columns to select.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract select(...columns: string[]): QueryBuilders<T>;
  public abstract select(
    ...columns: (SelectableType<T> | "*")[]
  ): QueryBuilders<T>;
  public abstract select(
    ...columns: (SelectableType<T> | "*" | string)[]
  ): QueryBuilders<T>;

  /**
   * @description Executes the query and retrieves the results.
   * @returns
   */
  public abstract raw(query: string): Promise<T | T[] | any>;

  /**
   *
   * @param table
   * @param primaryColumn
   * @param foreignColumn
   */
  public abstract join(
    table: string,
    primaryColumn: string,
    foreignColumn: string,
  ): QueryBuilders<T>;

  /**
   *
   * @param table
   * @param primaryColumn
   * @param foreignColumn
   */
  public abstract leftJoin(
    table: string,
    primaryColumn: string,
    foreignColumn: string,
  ): QueryBuilders<T>;

  /**
   * @description Adds a relation to the query.
   * @param relations - The relations to add.
   */
  public abstract addRelations(relations: RelationType<T>[]): QueryBuilders<T>;

  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  public abstract whereBuilder(
    cb: (queryBuilder: QueryBuilders<T>) => void,
  ): QueryBuilders<T>;

  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  public abstract andWhereBuilder(
    cb: (queryBuilder: QueryBuilders<T>) => void,
  ): QueryBuilders<T>;

  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  public abstract orWhereBuilder(
    cb: (queryBuilder: QueryBuilders<T>) => void,
  ): QueryBuilders<T>;

  /**
   * @description Adds a WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract where(
    column: SelectableType<T>,
    operator: WhereOperatorType,
    value: BaseValues,
  ): QueryBuilders<T>;
  public abstract where(
    column: string,
    operator: WhereOperatorType,
    value: BaseValues,
  ): QueryBuilders<T>;
  public abstract where(
    column: SelectableType<T> | string,
    value: BaseValues,
  ): QueryBuilders<T>;
  public abstract where(
    column: SelectableType<T> | string,
    operator: WhereOperatorType,
    value: BaseValues,
  ): QueryBuilders<T>;

  /**
   * @description Adds an AND WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract andWhere(
    column: SelectableType<T>,
    operator: WhereOperatorType,
    value: BaseValues,
  ): QueryBuilders<T>;
  public abstract andWhere(
    column: string,
    operator: WhereOperatorType,
    value: BaseValues,
  ): QueryBuilders<T>;
  public abstract andWhere(
    column: SelectableType<T> | string,
    value: BaseValues,
  ): QueryBuilders<T>;
  public abstract andWhere(
    column: SelectableType<T> | string,
    operator: WhereOperatorType,
    value: BaseValues,
  ): QueryBuilders<T>;

  /**
   * @description Adds an OR WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract orWhere(
    column: SelectableType<T>,
    operator: WhereOperatorType,
    value: BaseValues,
  ): QueryBuilders<T>;
  public abstract orWhere(
    column: string,
    operator: WhereOperatorType,
    value: BaseValues,
  ): QueryBuilders<T>;
  public abstract orWhere(
    column: SelectableType<T> | string,
    value: BaseValues,
  ): QueryBuilders<T>;
  public abstract orWhere(
    column: SelectableType<T> | string,
    operator: WhereOperatorType,
    value: BaseValues,
  ): QueryBuilders<T>;

  /**
   * @description Adds a WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract whereBetween(
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;
  public abstract whereBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;
  public abstract whereBetween(
    column: SelectableType<T> | string,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;

  /**
   * @description Adds an AND WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract andWhereBetween(
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;
  public abstract andWhereBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;
  public abstract andWhereBetween(
    column: SelectableType<T> | string,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;

  /**
   * @description Adds an OR WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract orWhereBetween(
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;
  public abstract orWhereBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;
  public abstract orWhereBetween(
    column: SelectableType<T> | string,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;

  /**
   * @description Adds a WHERE NOT BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract whereNotBetween(
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;
  public abstract whereNotBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;
  public abstract whereNotBetween(
    column: SelectableType<T> | string,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;

  /**
   * @description Adds an OR WHERE NOT BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract orWhereNotBetween(
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;
  public abstract orWhereNotBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;
  public abstract orWhereNotBetween(
    column: SelectableType<T> | string,
    min: BaseValues,
    max: BaseValues,
  ): QueryBuilders<T>;

  /**
   * @description Adds a WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract whereIn(
    column: SelectableType<T>,
    values: BaseValues[],
  ): QueryBuilders<T>;
  public abstract whereIn(
    column: string,
    values: BaseValues[],
  ): QueryBuilders<T>;
  public abstract whereIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): QueryBuilders<T>;

  /**
   * @description Adds an AND WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract andWhereIn(
    column: SelectableType<T>,
    values: BaseValues[],
  ): QueryBuilders<T>;
  public abstract andWhereIn(
    column: string,
    values: BaseValues[],
  ): QueryBuilders<T>;
  public abstract andWhereIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): QueryBuilders<T>;

  /**
   * @description Adds an OR WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract orWhereIn(
    column: string,
    values: BaseValues[],
  ): QueryBuilders<T>;
  public abstract orWhereIn(
    column: SelectableType<T>,
    values: BaseValues[],
  ): QueryBuilders<T>;
  public abstract orWhereIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): QueryBuilders<T>;

  /**
   * @description Adds a WHERE NOT IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract whereNotIn(
    column: SelectableType<T>,
    values: BaseValues[],
  ): QueryBuilders<T>;
  public abstract whereNotIn(
    column: string,
    values: BaseValues[],
  ): QueryBuilders<T>;
  public abstract whereNotIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): QueryBuilders<T>;

  /**
   * @description Adds an OR WHERE NOT IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract orWhereNotIn(
    column: SelectableType<T>,
    values: BaseValues[],
  ): QueryBuilders<T>;
  public abstract orWhereNotIn(
    column: string,
    values: BaseValues[],
  ): QueryBuilders<T>;
  public abstract orWhereNotIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): QueryBuilders<T>;

  /**
   * @description Adds a WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract whereNull(column: SelectableType<T>): QueryBuilders<T>;
  public abstract whereNull(column: string): QueryBuilders<T>;
  public abstract whereNull(
    column: SelectableType<T> | string,
  ): QueryBuilders<T>;

  /**
   * @description Adds an AND WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract andWhereNull(column: SelectableType<T>): QueryBuilders<T>;
  public abstract andWhereNull(column: string): QueryBuilders<T>;
  public abstract andWhereNull(
    column: SelectableType<T> | string,
  ): QueryBuilders<T>;

  /**
   * @description Adds an OR WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract orWhereNull(column: SelectableType<T>): QueryBuilders<T>;
  public abstract orWhereNull(column: string): QueryBuilders<T>;
  public abstract orWhereNull(
    column: SelectableType<T> | string,
  ): QueryBuilders<T>;

  /**
   * @description Adds a WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract whereNotNull(column: SelectableType<T>): QueryBuilders<T>;
  public abstract whereNotNull(column: string): QueryBuilders<T>;
  public abstract whereNotNull(
    column: SelectableType<T> | string,
  ): QueryBuilders<T>;

  /**
   * @description Adds an AND WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract andWhereNotNull(column: SelectableType<T>): QueryBuilders<T>;
  public abstract andWhereNotNull(column: string): QueryBuilders<T>;
  public abstract andWhereNotNull(
    column: SelectableType<T> | string,
  ): QueryBuilders<T>;

  /**
   * @description Adds an OR WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract orWhereNotNull(column: SelectableType<T>): QueryBuilders<T>;
  public abstract orWhereNotNull(column: string): QueryBuilders<T>;
  public abstract orWhereNotNull(
    column: SelectableType<T> | string,
  ): QueryBuilders<T>;

  /**
   * @description Adds a raw WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract rawWhere(query: string): QueryBuilders<T>;

  /**
   * @description Adds a raw AND WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract rawAndWhere(query: string): QueryBuilders<T>;

  /**
   * @description Adds a raw OR WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract rawOrWhere(query: string): QueryBuilders<T>;

  /**
   * @description Adds GROUP BY conditions to the query.
   * @param columns - The columns to group by.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract groupBy(...columns: SelectableType<T>[]): QueryBuilders<T>;
  public abstract groupBy(...columns: string[]): QueryBuilders<T>;
  public abstract groupBy(
    ...columns: (SelectableType<T> | string)[]
  ): QueryBuilders<T>;

  /**
   * @description Adds ORDER BY conditions to the query.
   * @param column - The column to order by.
   * @param order - The order direction, either "ASC" or "DESC".
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract orderBy(
    columns: SelectableType<T>[],
    order: "ASC" | "DESC",
  ): QueryBuilders<T>;
  public abstract orderBy(
    columns: string[],
    order: "ASC" | "DESC",
  ): QueryBuilders<T>;
  public abstract orderBy(
    columns: (SelectableType<T> | string)[],
    order: "ASC" | "DESC",
  ): QueryBuilders<T>;

  /**
   * @description Adds a LIMIT condition to the query.
   * @param limit - The maximum number of rows to return.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract limit(limit: number): QueryBuilders<T>;

  /**
   * @description Adds an OFFSET condition to the query.
   * @param offset - The number of rows to skip.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract offset(offset: number): QueryBuilders<T>;

  /**
   * @description Returns a copy of the query builder instance.
   * @returns A copy of the query builder instance.
   */
  public abstract copy(): QueryBuilders<T>;

  protected groupFooterQuery(): string {
    return (
      this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery
    );
  }
}
