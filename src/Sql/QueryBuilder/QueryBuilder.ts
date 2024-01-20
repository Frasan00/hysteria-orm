import { Pool } from "mysql2/promise";
import selectTemplate, { SelectTemplateType } from "../Templates/Query/SELECT";
import { Model } from "../Models/Model";
import whereTemplate, {
  BaseValues,
  WhereOperatorType,
  WhereTemplateType,
} from "../Templates/Query/WHERE.TS";
import { MysqlQueryBuilder } from "../Mysql/MysqlQueryBuilder";
import { PostgresQueryBuilder } from "../Postgres/PostgresQueryBuilder";
import { PaginatedData, PaginationMetadata } from "../../CaseUtils";

type QueryBuilders<T extends Model> = MysqlQueryBuilder<T> | PostgresQueryBuilder<T>;

export abstract class QueryBuilder<T extends Model> {
  protected selectQuery: string = "";
  protected joinQuery: string = "";
  protected relations: string[] = [];
  protected whereQuery: string = "";
  protected groupByQuery: string = "";
  protected orderByQuery: string = "";
  protected limitQuery: string = "";
  protected offsetQuery: string = "";

  protected model: new () => Model;
  protected tableName: string;
  protected logs: boolean;

  protected selectTemplate: SelectTemplateType;
  protected whereTemplate: WhereTemplateType;

  /**
   * @description Constructs a MysqlQueryBuilder instance.
   * @param model - The model class associated with the table.
   * @param tableName - The name of the table.
   * @param logs - A boolean indicating whether to log queries.
   */
  protected constructor(
    model: new () => Model,
    tableName: string,
    logs: boolean,
  ) {
    this.model = model;
    this.logs = logs;
    this.tableName = tableName;
    this.selectQuery = selectTemplate(this.tableName).selectAll;
    this.selectTemplate = selectTemplate(this.tableName);
    this.whereTemplate = whereTemplate(this.tableName);
  }

  /**
   * @description Executes the query and retrieves the first result.
   * @returns A Promise resolving to the first result or null.
   */
  public abstract one(): Promise<T | null>;

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
   * @description Columns are customizable with aliases. By default, without this function, all columns are selected
   * @param columns
   */
  public abstract select(
    ...columns: string[]
  ): QueryBuilders<T>;

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
  ) : QueryBuilders<T>;

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
  ): QueryBuilders<T>


  /**
   * @description Adds a relation to the query.
   * @param relations - The relations to add.
   */
  public abstract addRelations(
    relations: string[],
  ): QueryBuilders<T>;

  /**
   * @description Adds a WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract where(
    column: string,
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
    column: string,
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
    column: string,
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
    column: string,
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
    column: string,
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
    column: string,
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
    column: string,
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
    column: string,
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
    column: string,
    values: BaseValues[],
  ): QueryBuilders<T>;

  /**
   * @description Adds an AND WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract andWhereIn(
    column: string,
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

  /**
   * @description Adds a WHERE NOT IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract whereNotIn(
    column: string,
    values: BaseValues[],
  ): QueryBuilders<T>;

  /**
   * @description Adds an OR WHERE NOT IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract orWhereNotIn(
    column: string,
    values: BaseValues[],
  ): QueryBuilders<T>;

  /**
   * @description Adds a WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract whereNull(
    column: string,
  ): QueryBuilders<T>;

  /**
   * @description Adds an AND WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract andWhereNull(
    column: string,
  ): QueryBuilders<T>;

  /**
   * @description Adds an OR WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract orWhereNull(
    column: string,
  ): QueryBuilders<T>;

  /**
   * @description Adds a WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract whereNotNull(
    column: string,
  ): QueryBuilders<T>;

  /**
   * @description Adds an AND WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract andWhereNotNull(
    column: string,
  ): QueryBuilders<T>;

  /**
   * @description Adds an OR WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract orWhereNotNull(
    column: string,
  ): QueryBuilders<T>;

  /**
   * @description Adds a raw WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract rawWhere(
    query: string,
  ): QueryBuilders<T>;

  /**
   * @description Adds a raw AND WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract rawAndWhere(
    query: string,
  ): QueryBuilders<T>;

  /**
   * @description Adds a raw OR WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract rawOrWhere(
    query: string,
  ): QueryBuilders<T>;

  /**
   * @description Adds GROUP BY conditions to the query.
   * @param columns - The columns to group by.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract groupBy(
    ...columns: BaseValues[]
  ): QueryBuilders<T>;

  /**
   * @description Adds ORDER BY conditions to the query.
   * @param column - The column to order by.
   * @param order - The order direction, either "ASC" or "DESC".
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract orderBy(
    column: BaseValues[],
    order: "ASC" | "DESC",
  ): QueryBuilders<T>;

  /**
   * @description Adds a LIMIT condition to the query.
   * @param limit - The maximum number of rows to return.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract limit(
    limit: number,
  ): QueryBuilders<T>;

  /**
   * @description Adds an OFFSET condition to the query.
   * @param offset - The number of rows to skip.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public abstract offset(
    offset: number,
  ): QueryBuilders<T>;

  protected groupFooterQuery(): string {
    return (
      this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery
    );
  }
}
