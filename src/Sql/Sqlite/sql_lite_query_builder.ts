import { getBaseModelInstance, Model } from "../models/model";
import { log, queryError } from "../../logger";
import { BaseValues, WhereOperatorType } from "../resources/query/WHERE.TS";
import {
  OneOptions,
  Query_builder,
  ModelQueryBuilder,
  ManyOptions,
} from "../query_builder/query_builder";
import joinTemplate from "../resources/query/JOIN";
import { getPaginationMetadata, PaginatedData } from "../pagination";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import {
  DynamicColumnType,
  RelationType,
  SelectableType,
} from "../models/model_manager/model_manager_types";
import { SqlDataSource } from "../sql_data_source";
import { convertCase } from "../../case_utils";
import SqlModelManagerUtils from "../models/model_manager/model_manager_utils";
import sqlite3 from "sqlite3";

export class Sql_lite_query_builder<T extends Model> extends Query_builder<T> {
  protected sqLiteConnection: sqlite3.Database;
  protected isNestedCondition = false;
  protected sqliteModelManagerUtils: SqlModelManagerUtils<T>;

  /**
   * @param table - The name of the table.
   * @param sqLiteConnection - The MySQL connection pool.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  public constructor(
    model: typeof Model,
    table: string,
    sqLiteConnection: sqlite3.Database,
    logs: boolean,
    isNestedCondition = false,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, table, logs, sqlDataSource);
    this.sqLiteConnection = sqLiteConnection;
    this.isNestedCondition = isNestedCondition;
    this.sqliteModelManagerUtils = new SqlModelManagerUtils<T>(
      "sqlite",
      this.sqLiteConnection,
    );
  }

  public async one(
    options: OneOptions = { throwErrorOnNull: false },
  ): Promise<T | null> {
    // hook query builder
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }

    let query: string = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
    }
    query = this.selectQuery + this.joinQuery;

    if (this.whereQuery) {
      query += this.whereQuery;
    }

    query = this.whereTemplate.convertPlaceHolderToValue(query);

    // limit to 1
    this.limit(1);
    query += this.groupFooterQuery();

    query = query.trim();
    log(query, this.logs, this.params);
    try {
      const results = await this.promisifyQuery<T>(query, this.params);
      if (!results.length) {
        return null;
      }

      const result = results[0];
      if (options.throwErrorOnNull && !result) {
        throw new Error("ERR_NOT_FOUND");
      }

      const modelInstance = getBaseModelInstance<T>();
      await this.mergeRawPacketIntoModel(modelInstance, result, this.model);
      const relationModels =
        await this.sqliteModelManagerUtils.parseQueryBuilderRelations(
          [modelInstance],
          this.model,
          this.relations,
          this.logs,
        );

      const model = (await parseDatabaseDataIntoModelResponse(
        [modelInstance],
        this.model,
        relationModels,
      )) as T;

      return !options.ignoreHooks?.includes("afterFetch")
        ? ((await this.model.afterFetch([model]))[0] as T)
        : model;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }

  public async oneOrFail(options?: {
    ignoreHooks: OneOptions["ignoreHooks"];
  }): Promise<T> {
    const model = await this.one({
      throwErrorOnNull: true,
      ignoreHooks: options?.ignoreHooks,
    });
    return model as T;
  }

  public async many(options: ManyOptions = {}): Promise<T[]> {
    // hook query builder
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }

    let query: string = "";
    if (this.joinQuery && !this.selectQuery) {
      this.selectQuery = this.selectTemplate.selectColumns(`${this.table}.*`);
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
      const results = await this.promisifyQuery<T[]>(query, this.params);
      const modelPromises = results.map(async (result) => {
        const modelInstance = getBaseModelInstance<T>();
        await this.mergeRawPacketIntoModel(modelInstance, result, this.model);

        return modelInstance as T;
      });

      const models = await Promise.all(modelPromises);
      const relationModels =
        await this.sqliteModelManagerUtils.parseQueryBuilderRelations(
          models,
          this.model,
          this.relations,
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

      if (!options.ignoreHooks?.includes("afterFetch")) {
        await this.model.afterFetch(serializedModels as T[]);
      }

      return (
        Array.isArray(serializedModels) ? serializedModels : [serializedModels]
      ) as T[];
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }

  public async raw<T>(query: string, params: any[] = []) {
    return await this.promisifyQuery<T>(query, params);
  }

  public async getCount(
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    if (options.ignoreHooks) {
      const result = (await this.promisifyQuery<T>(
        "SELECT COUNT(*) as total FROM " + this.table,
        [],
      )) as any;
      return +result[0].total;
    }

    this.select("COUNT(*) as total");
    const result = await this.one();
    return result ? +result.extraColumns.total : 0;
  }

  public async getSum(column: SelectableType<T>): Promise<number>;
  public async getSum(column: string): Promise<number>;
  public async getSum(
    column: SelectableType<T> | string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    if (!options.ignoreHooks) {
      const result = (await this.promisifyQuery(
        `SELECT SUM("${column as string}) as total FROM ` + this.table,
        [],
      )) as any;
      return +result[0].total || 0;
    }

    column = convertCase(column as string, this.model.databaseCaseConvention);
    this.select(`SUM(${column as string}) as total`);
    const result = await this.one();
    return result ? +result.extraColumns.total : 0;
  }

  public async paginate(
    page: number,
    limit: number,
    options?: ManyOptions,
  ): Promise<PaginatedData<T>> {
    this.limitQuery = this.selectTemplate.limit(limit);
    this.offsetQuery = this.selectTemplate.offset((page - 1) * limit);

    const originalSelectQuery = this.selectQuery;
    this.select("COUNT(*) as total");
    const total = await this.many(options);

    this.selectQuery = originalSelectQuery;
    const models = await this.many(options);

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

  // SELECT
  public select(...columns: string[]): Sql_lite_query_builder<T>;
  public select(
    ...columns: (SelectableType<T> | "*")[]
  ): Sql_lite_query_builder<T>;
  public select(
    ...columns: (SelectableType<T> | "*" | string)[]
  ): Sql_lite_query_builder<T> {
    this.selectQuery = this.selectTemplate.selectColumns(
      ...(columns as string[]),
    );
    return this;
  }

  public join(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): Sql_lite_query_builder<T> {
    const join = joinTemplate(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn,
    );
    this.joinQuery += join.innerJoin();
    return this;
  }

  public leftJoin(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): Sql_lite_query_builder<T> {
    const join = joinTemplate(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn,
    );
    this.joinQuery += join.leftJoin();
    return this;
  }

  public addRelations(relations: RelationType<T>[]): Sql_lite_query_builder<T> {
    this.relations = relations as string[];
    return this;
  }

  public addDynamicColumns(
    dynamicColumns: DynamicColumnType<T>[],
  ): ModelQueryBuilder<T> {
    this.dynamicColumns = dynamicColumns as string[];
    return this;
  }

  public whereBuilder(
    cb: (queryBuilder: Sql_lite_query_builder<T>) => void,
  ): this {
    const queryBuilder = new Sql_lite_query_builder(
      this.model as typeof Model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(queryBuilder as unknown as Sql_lite_query_builder<T>);

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

  public orWhereBuilder(
    cb: (queryBuilder: Sql_lite_query_builder<T>) => void,
  ): this {
    const nestedBuilder = new Sql_lite_query_builder(
      this.model as typeof Model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(nestedBuilder as unknown as Sql_lite_query_builder<T>);

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

  public andWhereBuilder(
    cb: (queryBuilder: Sql_lite_query_builder<T>) => void,
  ): this {
    const nestedBuilder = new Sql_lite_query_builder(
      this.model as typeof Model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(nestedBuilder as unknown as Sql_lite_query_builder<T>);

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

  public when<O>(
    value: O,
    cb: (value: O, query: ModelQueryBuilder<T>) => void,
  ): this {
    if (value === undefined || value === null) {
      return this;
    }

    cb(value, this);
    return this;
  }

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

    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhere(
        column as string,
        actualValue,
        operator,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhere(
        column as string,
        actualValue,
        operator,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.orWhere(
        column as string,
        actualValue,
        operator,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhereBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhereBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.orWhereBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhereNotBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.orWhereNotBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

  public whereIn(column: SelectableType<T>, values: BaseValues[]): this;
  public whereIn(column: string, values: BaseValues[]): this;
  public whereIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhereIn(
        column as string,
        values,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

  public andWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
  public andWhereIn(column: string, values: BaseValues[]): this;
  public andWhereIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhereIn(
        column as string,
        values,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

  public orWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
  public orWhereIn(column: string, values: BaseValues[]): this;
  public orWhereIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.orWhereIn(
        column as string,
        values,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

  public whereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
  public whereNotIn(column: string, values: BaseValues[]): this;
  public whereNotIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhereNotIn(
        column as string,
        values,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

  public orWhereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
  public orWhereNotIn(column: string, values: BaseValues[]): this;
  public orWhereNotIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.orWhereNotIn(
        column as string,
        values,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

  public whereNull(column: SelectableType<T>): this;
  public whereNull(column: string): this;
  public whereNull(column: SelectableType<T> | string): this {
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhereNull(
        column as string,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

  public andWhereNull(column: SelectableType<T>): this;
  public andWhereNull(column: string): this;
  public andWhereNull(column: SelectableType<T> | string): this {
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhereNull(
        column as string,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

  public orWhereNull(column: SelectableType<T>): this;
  public orWhereNull(column: string): this;
  public orWhereNull(column: SelectableType<T> | string): this {
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.orWhereNull(
        column as string,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

  public whereNotNull(column: SelectableType<T>): this;
  public whereNotNull(column: string): this;
  public whereNotNull(column: SelectableType<T> | string): this {
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhereNotNull(
        column as string,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

  public andWhereNotNull(column: SelectableType<T>): this;
  public andWhereNotNull(column: string): this;
  public andWhereNotNull(column: SelectableType<T> | string): this {
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhereNotNull(
        column as string,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

  public orWhereNotNull(column: SelectableType<T>): this;
  public orWhereNotNull(column: string): this;
  public orWhereNotNull(column: SelectableType<T> | string): this {
    if (this.isNestedCondition) {
      const { query, params } = this.whereTemplate.orWhereNotNull(
        column as string,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
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

  public rawWhere(query: string) {
    if (this.isNestedCondition) {
      const { query: rawQuery, params } = this.whereTemplate.rawWhere(query);
      this.whereQuery += rawQuery;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
      const { query: rawQuery, params } = this.whereTemplate.rawWhere(query);
      this.whereQuery = rawQuery;
      this.params.push(...params);
      return this;
    }

    const { query: rawQuery, params } = this.whereTemplate.rawWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }

  public rawAndWhere(query: string) {
    if (this.isNestedCondition) {
      const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(query);
      this.whereQuery += rawQuery;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
      const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(query);
      this.whereQuery = rawQuery;
      this.params.push(...params);
      return this;
    }

    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }

  public rawOrWhere(query: string) {
    if (this.isNestedCondition) {
      const { query: rawQuery, params } = this.whereTemplate.rawOrWhere(query);
      this.whereQuery += rawQuery;
      this.params.push(...params);
      return this;
    }

    if (!this.whereQuery) {
      const { query: rawQuery, params } = this.whereTemplate.rawOrWhere(query);
      this.whereQuery = rawQuery;
      this.params.push(...params);
      return this;
    }

    const { query: rawQuery, params } = this.whereTemplate.rawOrWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }

  public groupBy(...columns: SelectableType<T>[]): this;
  public groupBy(...columns: string[]): this;
  public groupBy(...columns: (SelectableType<T> | string)[]): this {
    this.groupByQuery = this.selectTemplate.groupBy(...(columns as string[]));
    return this;
  }

  public orderBy(columns: SelectableType<T>[], order: "ASC" | "DESC"): this;
  public orderBy(columns: string[], order: "ASC" | "DESC"): this;
  public orderBy(
    columns: (SelectableType<T> | string)[],
    order: "ASC" | "DESC",
  ): this {
    this.orderByQuery = this.selectTemplate.orderBy(columns as string[], order);
    return this;
  }

  public limit(limit: number) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }

  public offset(offset: number) {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }

  public copy(): ModelQueryBuilder<T> {
    const queryBuilder = new Sql_lite_query_builder<T>(
      this.model as typeof Model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      this.isNestedCondition,
      this.sqlDataSource,
    );

    queryBuilder.selectQuery = this.selectQuery;
    queryBuilder.whereQuery = this.whereQuery;
    queryBuilder.joinQuery = this.joinQuery;
    queryBuilder.groupByQuery = this.groupByQuery;
    queryBuilder.orderByQuery = this.orderByQuery;
    queryBuilder.limitQuery = this.limitQuery;
    queryBuilder.offsetQuery = this.offsetQuery;
    queryBuilder.params = [...this.params];
    queryBuilder.relations = [...this.relations];
    return queryBuilder;
  }

  protected groupFooterQuery(): string {
    return (
      this.groupByQuery + this.orderByQuery + this.limitQuery + this.offsetQuery
    );
  }

  private promisifyQuery<T>(query: string, params: any): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      this.sqLiteConnection.all<T>(query, params, (err, result) => {
        if (err) {
          reject(err);
        }

        if (!result) {
          resolve([] as T[]);
        }

        if (!Array.isArray(result)) {
          resolve([result]);
        }

        resolve(result);
      });
    });
  }
}
