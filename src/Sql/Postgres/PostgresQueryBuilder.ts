import { getBaseModelInstance, Model } from "../Models/Model";
import { getModelColumns } from "../Models/ModelDecorators";
import {
  OneOptions,
  QueryBuilder,
  QueryBuilders,
} from "../QueryBuilder/QueryBuilder";
import { Pool } from "pg";
import { BaseValues, WhereOperatorType } from "../Resources/Query/WHERE.TS";
import selectTemplate from "../Resources/Query/SELECT";
import { log, queryError } from "../../Logger";
import PostgresModelManagerUtils from "./PostgresModelManagerUtils";
import joinTemplate from "../Resources/Query/JOIN";
import { PaginatedData, getPaginationMetadata } from "../pagination";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import {
  RelationType,
  SelectableType,
} from "../Models/ModelManager/ModelManagerTypes";
import "reflect-metadata";
import { fromSnakeToCamelCase } from "../../CaseUtils";
import { SqlDataSource } from "../SqlDatasource";

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
    sqlDataSource: SqlDataSource,
  ) {
    super(model, tableName, logs, sqlDataSource);
    this.pgPool = pgPool;
    this.isNestedCondition = isNestedCondition;
    this.postgresModelManagerUtils = new PostgresModelManagerUtils<T>();
  }

  // SELECT
  public select(...columns: string[]): PostgresQueryBuilder<T>;
  public select(
    ...columns: (SelectableType<T> | "*")[]
  ): PostgresQueryBuilder<T>;
  public select(
    ...columns: (SelectableType<T> | "*" | string)[]
  ): PostgresQueryBuilder<T> {
    const select = selectTemplate(
      this.tableName,
      this.sqlDataSource.getDbType(),
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
    // hook query builder
    this.model.beforeFetch(this);

    let query: string = "";
    if (this.joinQuery && !this.selectQuery) {
      const select = selectTemplate(
        this.tableName,
        this.sqlDataSource.getDbType(),
      );
      this.selectQuery = select.selectColumns(`${this.tableName}.*`);
    }
    query = this.selectQuery + this.joinQuery;

    if (this.whereQuery) {
      query += this.whereQuery;
    }

    query = this.whereTemplate.convertPlaceHolderToValue(query);
    query = query.trim();

    log(query, this.logs, this.params);
    try {
      const result = await this.pgPool.query(query, this.params);
      if (!result.rows[0]) {
        if (options.throwErrorOnNull) {
          throw new Error("ROW_NOT_FOUND");
        }

        return null;
      }

      const modelInstance = getBaseModelInstance<T>();
      this.mergeRawPacketIntoModel(modelInstance, result.rows[0]);

      const relationModels =
        await this.postgresModelManagerUtils.parseQueryBuilderRelations(
          [modelInstance],
          this.model,
          this.relations,
          this.pgPool,
          this.logs,
        );

      const model = (await parseDatabaseDataIntoModelResponse(
        [modelInstance],
        this.model,
        relationModels,
      )) as T;
      return (await this.model.afterFetch([model]))[0] as T;
    } catch (error) {
      queryError(query);
      throw new Error("Query failed " + error);
    }
  }

  public async many(): Promise<T[]> {
    // hook query builder
    this.model.beforeFetch(this);

    let query: string = "";
    if (this.joinQuery && !this.selectQuery) {
      const select = selectTemplate(
        this.tableName,
        this.sqlDataSource.getDbType(),
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

      const modelPromises = rows.map(async (row) => {
        const modelInstance = getBaseModelInstance<T>();
        this.mergeRawPacketIntoModel(modelInstance, row);

        return modelInstance as T;
      });

      const models = await Promise.all(modelPromises);
      const relationModels =
        await this.postgresModelManagerUtils.parseQueryBuilderRelations(
          models,
          this.model,
          this.relations,
          this.pgPool,
          this.logs,
        );

      const serializedModels = await parseDatabaseDataIntoModelResponse(
        models,
        this.model,
        relationModels,
      );
      if (!serializedModels) {
        return [];
      }

      await this.model.afterFetch(serializedModels as T[]);
      return (
        Array.isArray(serializedModels) ? serializedModels : [serializedModels]
      ) as T[];
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
    this.select("COUNT(*) as total");
    const total = await this.many();
    this.selectQuery = originalSelectQuery;

    const models = await this.many();
    const paginationMetadata = getPaginationMetadata(
      page,
      limit,
      +total[0].extraColumns["total"] as number,
    );
    let data =
      (await parseDatabaseDataIntoModelResponse(models, this.model)) || [];
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
    column: SelectableType<T>,
    operator: WhereOperatorType,
    value: BaseValues,
  ): this;
  public where(
    column: string,
    operator: WhereOperatorType,
    value: BaseValues,
  ): this;
  public where(column: SelectableType<T> | string, value: BaseValues): this;
  public where(
    column: SelectableType<T> | string,
    operatorOrValue: WhereOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: WhereOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue as WhereOperatorType;
      actualValue = value;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhere(
        column as string,
        actualValue,
        operator,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.where(
      column as string,
      actualValue,
      operator,
    );
    this.whereQuery += query;
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
      this.sqlDataSource,
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
      this.sqlDataSource,
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
      this.sqlDataSource,
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
    column: SelectableType<T>,
    operator: WhereOperatorType,
    value: BaseValues,
  ): this;
  public andWhere(
    column: string,
    operator: WhereOperatorType,
    value: BaseValues,
  ): this;
  public andWhere(column: SelectableType<T> | string, value: BaseValues): this;
  public andWhere(
    column: SelectableType<T> | string,
    operatorOrValue: WhereOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: WhereOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue as WhereOperatorType;
      actualValue = value;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.where(
        column as string,
        actualValue,
        operator,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhere(
      column as string,
      actualValue,
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
    column: SelectableType<T>,
    operator: WhereOperatorType,
    value: BaseValues,
  ): this;
  public orWhere(
    column: string,
    operator: WhereOperatorType,
    value: BaseValues,
  ): this;
  public orWhere(column: SelectableType<T> | string, value: BaseValues): this;
  public orWhere(
    column: SelectableType<T> | string,
    operatorOrValue: WhereOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: WhereOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue as WhereOperatorType;
      actualValue = value;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.where(
        column as string,
        actualValue,
        operator,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhere(
      column as string,
      actualValue,
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
  public whereBetween(
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public whereBetween(column: string, min: BaseValues, max: BaseValues): this;
  public whereBetween(
    column: SelectableType<T> | string,
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
   * @description Adds an AND WHERE BETWEEN condition to the query.
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public andWhereBetween(
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public andWhereBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public andWhereBetween(
    column: SelectableType<T> | string,
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
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public orWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
  public orWhereBetween(
    column: SelectableType<T> | string,
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
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public whereNotBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public whereNotBetween(
    column: SelectableType<T> | string,
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
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public orWhereNotBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public orWhereNotBetween(
    column: SelectableType<T> | string,
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
  public whereIn(column: SelectableType<T>, values: BaseValues[]): this;
  public whereIn(column: string, values: BaseValues[]): this;
  public whereIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
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
  public andWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
  public andWhereIn(column: string, values: BaseValues[]): this;
  public andWhereIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
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
  public orWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
  public orWhereIn(column: string, values: BaseValues[]): this;
  public orWhereIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
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
  public whereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
  public whereNotIn(column: string, values: BaseValues[]): this;
  public whereNotIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
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
  public orWhereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
  public orWhereNotIn(column: string, values: BaseValues[]): this;
  public orWhereNotIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
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
  public whereNull(column: SelectableType<T>): this;
  public whereNull(column: string): this;
  public whereNull(column: SelectableType<T> | string): this {
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
  public andWhereNull(column: SelectableType<T>): this;
  public andWhereNull(column: string): this;
  public andWhereNull(column: SelectableType<T> | string): this {
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
  public orWhereNull(column: SelectableType<T>): this;
  public orWhereNull(column: string): this;
  public orWhereNull(column: SelectableType<T> | string): this {
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
  public whereNotNull(column: SelectableType<T>): this;
  public whereNotNull(column: string): this;
  public whereNotNull(column: SelectableType<T> | string): this {
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
  public andWhereNotNull(column: SelectableType<T>): this;
  public andWhereNotNull(column: string): this;
  public andWhereNotNull(column: SelectableType<T> | string): this {
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
  public orWhereNotNull(column: SelectableType<T>): this;
  public orWhereNotNull(column: string): this;
  public orWhereNotNull(column: SelectableType<T> | string): this {
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
  public groupBy(...columns: SelectableType<T>[]): this;
  public groupBy(...columns: string[]): this;
  public groupBy(...columns: (SelectableType<T> | string)[]): this {
    this.groupByQuery = this.selectTemplate.groupBy(...(columns as string[]));
    return this;
  }

  /**
   * @description Adds ORDER BY conditions to the query.
   * @param column - The column to order by.
   * @param order - The order direction, either "ASC" or "DESC".
   * @returns The PostgresQueryBuilder instance for chaining.
   */
  public orderBy(columns: SelectableType<T>[], order: "ASC" | "DESC"): this;
  public orderBy(columns: string[], order: "ASC" | "DESC"): this;
  public orderBy(
    columns: (SelectableType<T> | string)[],
    order: "ASC" | "DESC",
  ): this {
    this.orderByQuery = this.selectTemplate.orderBy(columns as string[], order);
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

  public copy(): QueryBuilders<T> {
    const queryBuilder = new PostgresQueryBuilder<T>(
      this.model as typeof Model,
      this.tableName,
      this.pgPool,
      this.logs,
      this.isNestedCondition,
      this.sqlDataSource,
    );
    queryBuilder.selectQuery = this.selectQuery;
    queryBuilder.whereQuery = this.whereQuery;
    queryBuilder.groupByQuery = this.groupByQuery;
    queryBuilder.orderByQuery = this.orderByQuery;
    queryBuilder.limitQuery = this.limitQuery;
    queryBuilder.offsetQuery = this.offsetQuery;
    queryBuilder.params = [...this.params];
    return queryBuilder;
  }

  protected groupFooterQuery(): string {
    return (
      this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery
    );
  }

  private mergeRawPacketIntoModel(model: T, row: any) {
    const columns = getModelColumns(this.model);
    Object.entries(row).forEach(([key, value]) => {
      const camelCaseKey = fromSnakeToCamelCase(key) as string;
      if (columns.includes(camelCaseKey)) {
        Object.assign(model, { [camelCaseKey]: value });
        return;
      }

      model.extraColumns[key] = value as string | number | boolean;
    });
  }
}
