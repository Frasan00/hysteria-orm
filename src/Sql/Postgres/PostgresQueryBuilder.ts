import { Model } from "../Models/Model";
import { OneOptions, QueryBuilder } from "../QueryBuilder/QueryBuilder";
import { Pool } from "pg";
import { BaseValues, WhereOperatorType } from "../Resources/Query/WHERE.TS";
import selectTemplate from "../Resources/Query/SELECT";
import { log } from "../../Logger";
import PostgresModelManagerUtils from "./PostgresModelManagerUtils";
import joinTemplate from "../Resources/Query/JOIN";
import { PaginatedData, getPaginationMetadata } from "../pagination";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import {
  RelationType,
  SelectableType,
} from "../Models/ModelManager/ModelManagerTypes";
import { fromSnakeToCamelCase } from "../../CaseUtils";

export class PostgresQueryBuilder<T extends Model> extends QueryBuilder<T> {
  protected pgPool: Pool;
  protected isNestedCondition: boolean;
  protected postgresModelManagerUtils: PostgresModelManagerUtils<T>;

  public constructor(
    model: typeof Model,
    tableName: string,
    pgPool: Pool,
    logs: boolean,
    isNestedCondition = false,
  ) {
    super(model, tableName, logs);
    this.pgPool = pgPool;
    this.isNestedCondition = isNestedCondition;
    this.postgresModelManagerUtils = new PostgresModelManagerUtils<T>();
  }

  public select(
    ...columns: (SelectableType<T> | "*")[]
  ): PostgresQueryBuilder<T> {
    const select = selectTemplate(
      this.tableName,
      this.model.sqlInstance.getDbType(),
    );

    this.selectQuery = select.selectColumns(...(columns as string[]));
    return this;
  }
  public selectRaw(...columns: string[]): PostgresQueryBuilder<T> {
    const select = selectTemplate(
      this.tableName,
      this.model.sqlInstance.getDbType(),
    );

    this.selectQuery = select.selectColumns(...(columns as string[]));
    return this;
  }

  public async raw(query: string, params: any[] = []) {
    return await this.pgPool.query(query, params);
  }

  public async one(
    options: OneOptions = { throwErrorOnNull: false },
  ): Promise<T | null> {
    let query: string = "";
    if (this.joinQuery && !this.selectQuery) {
      const select = selectTemplate(
        this.tableName,
        this.model.sqlInstance.getDbType(),
      );
      this.selectQuery = select.selectColumns(`${this.tableName}.*`);
    }
    query = this.selectQuery + this.joinQuery;

    if (this.whereQuery) {
      query += this.whereQuery;
    }

    try {
      query = this.whereTemplate.convertPlaceHolderToValue(query);
      query = query.trim();
      log(query, this.logs, this.params);
      const result = await this.pgPool.query(query, this.params);
      if (!result.rows[0]) {
        if (options.throwErrorOnNull) {
          throw new Error("ROW_NOT_FOUND");
        }

        return null;
      }

      const modelInstance = new this.model() as T;
      this.mergeRawPacketIntoModel(modelInstance, result.rows[0]);
      await this.postgresModelManagerUtils.parseQueryBuilderRelations(
        modelInstance,
        this.model,
        this.relations,
        this.pgPool,
        this.logs,
      );

      return parseDatabaseDataIntoModelResponse([modelInstance]) as T;
    } catch (error) {
      throw new Error("Query failed " + error);
    }
  }

  public async first(
    options: OneOptions = { throwErrorOnNull: false },
  ): Promise<T | null> {
    return await this.limit(1).one(options);
  }

  public async many(): Promise<T[]> {
    let query: string = "";
    if (this.joinQuery && !this.selectQuery) {
      const select = selectTemplate(
        this.tableName,
        this.model.sqlInstance.getDbType(),
      );
      this.selectQuery = select.selectColumns(`${this.tableName}.*`);
    }
    query = this.selectQuery + this.joinQuery;

    if (this.whereQuery) {
      query += this.whereQuery;
    }

    query += this.groupFooterQuery();
    query = this.whereTemplate.convertPlaceHolderToValue(query);
    query = query.trim();
    log(query, this.logs, this.params);
    try {
      const result = await this.pgPool.query(query, this.params);
      const rows = result.rows;

      return Promise.all(
        rows.map(async (row) => {
          const modelData = row as T;
          const modelInstance = new this.model() as T;
          this.mergeRawPacketIntoModel(modelInstance, modelData);

          await this.postgresModelManagerUtils.parseQueryBuilderRelations(
            modelInstance,
            this.model,
            this.relations,
            this.pgPool,
            this.logs,
          );

          return parseDatabaseDataIntoModelResponse([modelInstance]) as T;
        }),
      );
    } catch (error: any) {
      throw new Error("Query failed: " + error.message);
    }
  }

  /**
   * @description Paginates the query results with the given page and limit, it removes any previous limit - offset call
   * @param page
   * @param limit
   */
  public async paginate(
    page: number,
    limit: number,
  ): Promise<PaginatedData<T>> {
    this.limitQuery = this.selectTemplate.limit(limit);
    this.offsetQuery = this.selectTemplate.offset((page - 1) * limit);

    const originalSelectQuery = this.selectQuery;
    this.selectRaw("COUNT(*) as total");
    const total = await this.many();
    this.selectQuery = originalSelectQuery;

    const models = await this.many();
    const paginationMetadata = getPaginationMetadata(
      page,
      limit,
      +total[0].extraColumns["total"] as number,
    );
    let data = parseDatabaseDataIntoModelResponse(models) || [];
    if (Array.isArray(data)) {
      data = data.filter((model) => model !== null);
    }
    return {
      paginationMetadata,
      data: Array.isArray(data) ? data : [data],
    } as PaginatedData<T>;
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
      primaryColumn as string,
      foreignColumn as string,
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
      primaryColumn as string,
      foreignColumn as string,
    );
    this.joinQuery += join.innerJoin();
    return this;
  }

  public addRelations(relations: RelationType<T>[]): PostgresQueryBuilder<T> {
    this.relations = relations as string[];
    return this;
  }

  /**
   * @description Adds a WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public where(
    column: string,
    value: BaseValues,
    operator: WhereOperatorType = "=",
  ): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhere(
        column as string,
        value,
        operator,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.where(
      column as string,
      value,
      operator,
    );
    this.whereQuery = query;
    this.params.push(...params);
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
      this.model as typeof Model,
      this.tableName,
      this.pgPool,
      this.logs,
      true,
    );
    cb(queryBuilder as unknown as PostgresQueryBuilder<T>);

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
   * @description Build complex OR-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  public orWhereBuilder(
    cb: (queryBuilder: PostgresQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new PostgresQueryBuilder(
      this.model as typeof Model,
      this.tableName,
      this.pgPool,
      this.logs,
      true,
    );
    cb(nestedBuilder as unknown as PostgresQueryBuilder<T>);

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
   * @description Build complex AND-based where conditions.
   * @param cb Callback function that takes a query builder and adds conditions to it.
   */
  public andWhereBuilder(
    cb: (queryBuilder: PostgresQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new PostgresQueryBuilder(
      this.model as typeof Model,
      this.tableName,
      this.pgPool,
      this.logs,
      true,
    );
    cb(nestedBuilder as unknown as PostgresQueryBuilder<T>);

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

  /**
   * @description Adds an AND WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public andWhere(
    column: string,
    value: BaseValues,
    operator: WhereOperatorType = "=",
  ): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.where(
        column as string,
        value,
        operator,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhere(
      column as string,
      value,
      operator,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an OR WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public orWhere(
    column: string,
    value: BaseValues,
    operator: WhereOperatorType = "=",
  ): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.where(
        column as string,
        value,
        operator,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhere(
      column as string,
      value,
      operator,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public whereBetween(column: string, min: BaseValues, max: BaseValues): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereBetween(
      column as string,
      min,
      max,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an AND WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public andWhereBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereBetween(
      column as string,
      min,
      max,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an OR WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public orWhereBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhereBetween(
      column as string,
      min,
      max,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a WHERE NOT BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public whereNotBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereNotBetween(
      column as string,
      min,
      max,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public orWhereNotBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhereNotBetween(
      column as string,
      min,
      max,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public whereIn(column: string, values: BaseValues[]): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereIn(
        column as string,
        values,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an AND WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public andWhereIn(column: string, values: BaseValues[]): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereIn(
        column as string,
        values,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an OR WHERE IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public orWhereIn(column: string, values: BaseValues[]): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereIn(
        column as string,
        values,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhereIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a WHERE NOT IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public whereNotIn(column: string, values: BaseValues[]): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotIn(
        column as string,
        values,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereNotIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT IN condition to the query.
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public orWhereNotIn(column: string, values: BaseValues[]): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotIn(
        column as string,
        values,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhereNotIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public whereNull(column: string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNull(column as string);
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereNull(column as string);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an AND WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public andWhereNull(column: string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNull(column as string);
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereNull(column as string);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an OR WHERE NULL condition to the query.
   * @param column - The column to filter.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public orWhereNull(column: string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNull(column as string);
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhereNull(column as string);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public whereNotNull(column: string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotNull(
        column as string,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereNotNull(
      column as string,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an AND WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public andWhereNotNull(column: string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotNull(
        column as string,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereNotNull(
      column as string,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT NULL condition to the query.
   * @param column - The column to filter.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public orWhereNotNull(column: string) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotNull(
        column as string,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhereNotNull(
      column as string,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a raw WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public rawWhere(query: string) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: rawQuery, params } = this.whereTemplate.rawWhere(query);
      this.whereQuery = rawQuery;
      this.params.push(...params);
      return this;
    }

    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a raw AND WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public rawAndWhere(query: string) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: rawQuery, params } = this.whereTemplate.rawWhere(query);
      this.whereQuery = rawQuery;
      this.params.push(...params);
      return this;
    }

    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a raw OR WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public rawOrWhere(query: string) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: rawQuery, params } = this.whereTemplate.rawWhere(query);
      this.whereQuery = rawQuery;
      this.params.push(...params);
      return this;
    }

    const { query: rawQuery, params } = this.whereTemplate.rawOrWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds GROUP BY conditions to the query.
   * @param columns - The columns to group by.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public groupBy(...columns: string[]) {
    this.groupByQuery = this.selectTemplate.groupBy(...columns);
    return this;
  }

  /**
   * @description Adds ORDER BY conditions to the query.
   * @param column - The column to order by.
   * @param order - The order direction, either "ASC" or "DESC".
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public orderBy(column: string[], order: "ASC" | "DESC") {
    this.orderByQuery = this.selectTemplate.orderBy(column, order);
    return this;
  }

  /**
   * @description Adds a LIMIT condition to the query.
   * @param limit - The maximum number of rows to return.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public limit(limit: number) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }

  /**
   * @description Adds an OFFSET condition to the query.
   * @param offset - The number of rows to skip.
   * @returns The PostgresQueryBuilder instance for chaining.
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

  private mergeRawPacketIntoModel(model: T, row: any) {
    Object.entries(row).forEach(([key, value]) => {
      const camelCaseKey = fromSnakeToCamelCase(key) as string;
      if (Object.keys(model).includes(camelCaseKey)) {
        Object.assign(model, { [camelCaseKey]: value });
        return;
      }

      model.extraColumns[key] = value as string | number | boolean;
    });
  }
}
