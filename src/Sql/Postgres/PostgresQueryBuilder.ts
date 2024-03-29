import { Model } from "../Models/Model";
import { QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Pool } from "pg";
import whereTemplate, {
  BaseValues,
  WhereOperatorType,
} from "../Templates/Query/WHERE.TS";
import selectTemplate from "../Templates/Query/SELECT";
import { log } from "../../Logger";
import {
  PaginatedData,
  parseDatabaseDataIntoModelResponse,
} from "../../CaseUtils";
import PostgresModelManagerUtils from "./PostgresModelManagerUtils";
import joinTemplate from "../Templates/Query/JOIN";

export class PostgresQueryBuilder<T extends Model> extends QueryBuilder<T> {
  protected pgPool: Pool;
  protected isNestedCondition: boolean;

  public constructor(
    model: new () => T,
    tableName: string,
    pgPool: Pool,
    logs: boolean,
    isNestedCondition = false,
  ) {
    super(model, tableName, logs);
    this.pgPool = pgPool;
    this.isNestedCondition = isNestedCondition;
  }

  private mergeRetrievedDataIntoModel(model: T, row: any) {
    Object.entries(row).forEach(([key, value]) => {
      if (Object.hasOwnProperty.call(model, key)) {
        Object.assign(model, { [key]: value });
      } else {
        model.aliasColumns[key] = value as string | number | boolean;
      }
    });
  }

  public async one(): Promise<T | null> {
    let query: string = "";
    if (this.joinQuery && !this.selectQuery) {
      const select = selectTemplate(this.tableName);
      this.selectQuery = select.selectColumns(`${this.tableName}.*`);
    }
    query = this.selectQuery + this.joinQuery;

    if (this.whereQuery) {
      query += this.whereQuery;
    }

    log(query, this.logs);
    const model = new this.model() as T;
    try {
      const result = await this.pgPool.query(query);
      const modelData = result.rows[0];

      if (modelData) {
        this.mergeRetrievedDataIntoModel(model, modelData);

        await PostgresModelManagerUtils.parseQueryBuilderRelations(
          model,
          this.relations,
          this.pgPool,
          this.logs,
        );

        return parseDatabaseDataIntoModelResponse([model]) as T;
      }

      return null;
    } catch (error) {
      throw new Error("Query failed " + error);
    }
  }

  public async many(): Promise<T[]> {
    let query: string = "";
    if (this.joinQuery && !this.selectQuery) {
      const select = selectTemplate(this.tableName);
      this.selectQuery = select.selectColumns(`${this.tableName}.*`);
    }
    query = this.selectQuery + this.joinQuery;

    if (this.whereQuery) {
      query += this.whereQuery;
    }

    query += this.groupFooterQuery();

    log(query, this.logs);
    const modelInstance = new this.model() as T;
    try {
      const result = await this.pgPool.query(query);
      const rows = result.rows;

      return Promise.all(
        rows.map(async (row) => {
          const modelData = row as T;

          const rowModel = new this.model() as T;
          this.mergeRetrievedDataIntoModel(rowModel, modelData);

          await PostgresModelManagerUtils.parseQueryBuilderRelations(
            rowModel,
            this.relations,
            this.pgPool,
            this.logs,
          );

          return parseDatabaseDataIntoModelResponse([rowModel]) as T;
        }),
      );
    } catch (error: any) {
      throw new Error("Query failed: " + error.message);
    }
  }

  /**
   * @description Paginates the query results with the given page and limit.
   * @param page
   * @param limit
   */
  public async paginate(
    page: number,
    limit: number,
  ): Promise<PaginatedData<T>> {
    const models = await this.many();
    return parseDatabaseDataIntoModelResponse(models, {
      page,
      limit,
    }) as PaginatedData<T>;
  }

  public select(...columns: string[]): PostgresQueryBuilder<T> {
    const select = selectTemplate(this.tableName);
    this.selectQuery = select.selectColumns(...columns);
    return this;
  }

  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  public join(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): PostgresQueryBuilder<T> {
    const join = joinTemplate(
      this.tableName,
      relationTable,
      primaryColumn,
      foreignColumn,
    );
    this.joinQuery += join.innerJoin();
    return this;
  }

  /**
   *
   * @param relationTable - The name of the related table.
   * @param primaryColumn - The name of the primary column in the caller table.
   * @param foreignColumn - The name of the foreign column in the related table.
   */
  public leftJoin(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): PostgresQueryBuilder<T> {
    const join = joinTemplate(
      this.tableName,
      relationTable,
      primaryColumn,
      foreignColumn,
    );
    this.joinQuery += join.innerJoin();
    return this;
  }

  public addRelations(relations: string[]): PostgresQueryBuilder<T> {
    this.relations = relations;
    return this;
  }

  /**
   * @description Adds a WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public where(
    column: string,
    value: BaseValues,
    operator: WhereOperatorType = "=",
  ): this {
    if (this.whereQuery || this.isNestedCondition) {
      this.whereQuery += this.whereTemplate.andWhere(column, value, operator);
      return this;
    }
    this.whereQuery = this.whereTemplate.where(column, value, operator);
    return this;
  }

  /**
   * @description Build more complex where conditions.
   * @param cb
   */
  public whereBuilder(
    cb: (queryBuilder: PostgresQueryBuilder<T>) => void,
  ): this {
    const queryBuilder = new PostgresQueryBuilder(
      this.model as new () => T,
      this.tableName,
      this.pgPool,
      this.logs,
      true,
    );
    cb(queryBuilder);

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

    return this;
  }

  /**
   * @description Build complex OR-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  public orWhereBuilder(
    cb: (queryBuilder: PostgresQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new PostgresQueryBuilder(
      this.model as new () => T,
      this.tableName,
      this.pgPool,
      this.logs,
      true,
    );
    cb(nestedBuilder);

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
    } else {
      this.whereQuery += ` OR ${nestedCondition}`;
    }

    return this;
  }

  /**
   * @description Build complex AND-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  public andWhereBuilder(
    cb: (queryBuilder: PostgresQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new PostgresQueryBuilder(
      this.model as new () => T,
      this.tableName,
      this.pgPool,
      this.logs,
      true,
    );
    cb(nestedBuilder);

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
    } else {
      this.whereQuery += ` AND ${nestedCondition}`;
    }

    return this;
  }

  /**
   * @description Adds an AND WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public andWhere(
    column: string,
    value: BaseValues,
    operator: WhereOperatorType = "=",
  ): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.where(column, value, operator);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).andWhere(
      column,
      value,
      operator,
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public orWhere(
    column: string,
    value: BaseValues,
    operator: WhereOperatorType = "=",
  ): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.where(column, value, operator);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).orWhere(
      column,
      value,
      operator,
    );
    return this;
  }

  /**
   * @description Adds a WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public whereBetween(column: string, min: BaseValues, max: BaseValues): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).andWhereBetween(
      column,
      min,
      max,
    );
    return this;
  }

  /**
   * @description Adds an AND WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public andWhereBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).andWhereBetween(
      column,
      min,
      max,
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public orWhereBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereBetween(column, min, max);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).orWhereBetween(
      column,
      min,
      max,
    );
    return this;
  }

  /**
   * @description Adds a WHERE NOT BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public whereNotBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereNotBetween(column, min, max);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).andWhereNotBetween(
      column,
      min,
      max,
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public orWhereNotBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereNotBetween(column, min, max);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).orWhereNotBetween(
      column,
      min,
      max,
    );
    return this;
  }

  /**
   * @description Adds a WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public whereIn(column: string, values: BaseValues[]): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).andWhereIn(column, values);
    return this;
  }

  /**
   * @description Adds an AND WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public andWhereIn(column: string, values: BaseValues[]): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).andWhereIn(column, values);
    return this;
  }

  /**
   * @description Adds an OR WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public orWhereIn(column: string, values: BaseValues[]): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereIn(column, values);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).orWhereIn(column, values);
    return this;
  }

  /**
   * @description Adds a WHERE NOT IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public whereNotIn(column: string, values: BaseValues[]): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereNotIn(column, values);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).andWhereNotIn(
      column,
      values,
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public orWhereNotIn(column: string, values: BaseValues[]): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereNotIn(column, values);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).orWhereNotIn(
      column,
      values,
    );
    return this;
  }

  /**
   * @description Adds a WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public whereNull(column: string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereNull(column);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).andWhereNull(column);
    return this;
  }

  /**
   * @description Adds an AND WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public andWhereNull(column: string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereNull(column);
      return this;
    }
    this.whereQuery += whereTemplate(this.tableName).andWhereNull(column);
    return this;
  }

  /**
   * @description Adds an OR WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public orWhereNull(column: string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereNull(column);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).orWhereNull(column);
    return this;
  }

  /**
   * @description Adds a WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public whereNotNull(column: string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereNotNull(column);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).andWhereNotNull(column);
    return this;
  }

  /**
   * @description Adds an AND WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public andWhereNotNull(column: string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereNotNull(column);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).andWhereNotNull(column);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public orWhereNotNull(column: string) {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.whereNotNull(column);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).orWhereNotNull(column);
    return this;
  }

  /**
   * @description Adds a raw WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public rawWhere(query: string) {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.rawWhere(query);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).rawAndWhere(query);
    return this;
  }

  /**
   * @description Adds a raw AND WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public rawAndWhere(query: string) {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.rawWhere(query);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).rawAndWhere(query);
    return this;
  }

  /**
   * @description Adds a raw OR WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public rawOrWhere(query: string) {
    if (!this.whereQuery || !this.isNestedCondition) {
      this.whereQuery = this.whereTemplate.rawWhere(query);
      return this;
    }

    this.whereQuery += whereTemplate(this.tableName).rawOrWhere(query);
    return this;
  }

  /**
   * @description Adds GROUP BY conditions to the query.
   * @param columns - The columns to group by.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public groupBy(...columns: string[]) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }

  /**
   * @description Adds ORDER BY conditions to the query.
   * @param column - The column to order by.
   * @param order - The order direction, either "ASC" or "DESC".
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public orderBy(column: string[], order: "ASC" | "DESC") {
    this.orderByQuery = this.selectTemplate.orderBy(column, order);
    return this;
  }

  /**
   * @description Adds a LIMIT condition to the query.
   * @param limit - The maximum number of rows to return.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public limit(limit: number) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }

  /**
   * @description Adds an OFFSET condition to the query.
   * @param offset - The number of rows to skip.
   * @returns The MysqlQueryBuilder instance for chaining.
   */
  public offset(offset: number) {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }

  protected groupFooterQuery(): string {
    return (
      this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery
    );
  }
}
