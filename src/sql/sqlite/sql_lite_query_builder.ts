import { getBaseModelInstance, Model } from "../models/model";
import { log } from "../../utils/logger";
import {
  OneOptions,
  QueryBuilder,
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
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { convertCase } from "../../utils/case_utils";
import SqlModelManagerUtils from "../models/model_manager/model_manager_utils";
import sqlite3 from "sqlite3";
import {
  DeleteOptions,
  SoftDeleteOptions,
} from "../query_builder/delete_query_builder_type";
import { DateTime } from "luxon";
import deleteTemplate from "../resources/query/DELETE";
import updateTemplate from "../resources/query/UPDATE";
import { UpdateOptions } from "../query_builder/update_query_builder_types";

export class SqlLiteQueryBuilder<T extends Model> extends QueryBuilder<T> {
  protected sqLiteConnection: sqlite3.Database;
  protected sqliteModelManagerUtils: SqlModelManagerUtils<T>;
  protected updateTemplate: ReturnType<typeof updateTemplate>;
  protected deleteTemplate: ReturnType<typeof deleteTemplate>;

  constructor(
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
    this.updateTemplate = updateTemplate(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = deleteTemplate(table, sqlDataSource.getDbType());
    this.sqliteModelManagerUtils = new SqlModelManagerUtils<T>(
      "sqlite",
      this.sqLiteConnection,
    );
  }

  async one(options: OneOptions = {}): Promise<T | null> {
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
    const results = await this.promisifyQuery<T>(query, this.params);
    if (!results.length) {
      return null;
    }

    const result = results[0];

    const modelInstance = getBaseModelInstance<T>();
    await this.mergeRawPacketIntoModel(modelInstance, result, this.model);
    const relationModels =
      await this.sqliteModelManagerUtils.parseQueryBuilderRelations(
        [modelInstance],
        this.model,
        this.relations,
        "sqlite",
        this.logs,
      );

    const model = (await parseDatabaseDataIntoModelResponse(
      [modelInstance],
      this.model,
      relationModels,
      this.modelSelectedColumns,
    )) as T;

    return !options.ignoreHooks?.includes("afterFetch")
      ? ((await this.model.afterFetch([model]))[0] as T)
      : model;
  }

  async oneOrFail(options?: OneOptions & { customError: Error }): Promise<T> {
    const model = await this.one({
      ignoreHooks: options?.ignoreHooks,
    });

    if (!model) {
      if (options?.customError) {
        throw options.customError;
      }

      throw new Error("ROW_NOT_FOUND");
    }

    return model as T;
  }

  async many(options: ManyOptions = {}): Promise<T[]> {
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
        "sqlite",
        this.logs,
      );

    const serializedModels = await parseDatabaseDataIntoModelResponse(
      models,
      this.model,
      relationModels,
      this.modelSelectedColumns,
    );
    if (!serializedModels) {
      return [];
    }

    if (!options.ignoreHooks?.includes("afterFetch")) {
      await this.model.afterFetch(
        Array.isArray(serializedModels) ? serializedModels : [serializedModels],
      );
    }

    return (
      Array.isArray(serializedModels) ? serializedModels : [serializedModels]
    ) as T[];
  }

  async update(data: Partial<T>, options?: UpdateOptions): Promise<number> {
    const { ignoreBeforeUpdateHook } = options || {};
    if (!ignoreBeforeUpdateHook) {
      this.model.beforeUpdate(this);
    }

    const columns = Object.keys(data);
    const values = Object.values(data);
    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
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

    log(query, this.logs, params);
    return await new Promise((resolve, reject) => {
      this.sqLiteConnection.run(query, params, function (this: any, err) {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  async delete(options: DeleteOptions = {}): Promise<number> {
    const { ignoreBeforeDeleteHook } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }

    this.whereQuery = this.whereTemplate.convertPlaceHolderToValue(
      this.whereQuery,
    );
    const query = this.deleteTemplate.massiveDelete(
      this.whereQuery,
      this.joinQuery,
    );

    log(query, this.logs, this.params);
    return new Promise((resolve, reject) => {
      this.sqLiteConnection.run(query, this.params, function (this: any, err) {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  async softDelete(options?: SoftDeleteOptions<T>): Promise<number> {
    const {
      column = "deletedAt",
      value = DateTime.local().toISO(),
      ignoreBeforeDeleteHook = false,
    } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }

    let { query, params } = this.updateTemplate.massiveUpdate(
      [column as string],
      [value],
      this.whereQuery,
      this.joinQuery,
    );

    params = [...params, ...this.params];

    log(query, this.logs, params);
    return new Promise((resolve, reject) => {
      this.sqLiteConnection.run(query, params, function (this: any, err) {
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  whereBuilder(cb: (queryBuilder: SqlLiteQueryBuilder<T>) => void): this {
    const queryBuilder = new SqlLiteQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(queryBuilder as unknown as SqlLiteQueryBuilder<T>);

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

  orWhereBuilder(cb: (queryBuilder: SqlLiteQueryBuilder<T>) => void): this {
    const nestedBuilder = new SqlLiteQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(nestedBuilder as unknown as SqlLiteQueryBuilder<T>);

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

  andWhereBuilder(cb: (queryBuilder: SqlLiteQueryBuilder<T>) => void): this {
    const nestedBuilder = new SqlLiteQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.sqLiteConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(nestedBuilder as unknown as SqlLiteQueryBuilder<T>);

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

  async raw<T>(query: string, params: any[] = []) {
    return await this.promisifyQuery<T>(query, params);
  }

  async getCount(
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
    return result ? +result.$additionalColumns.total : 0;
  }

  async getSum(column: SelectableType<T>): Promise<number>;
  async getSum(column: string): Promise<number>;
  async getSum(
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
    return result ? +result.$additionalColumns.total : 0;
  }

  async paginate(
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
      +total[0].$additionalColumns["total"] as number,
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
  select(...columns: string[]): SqlLiteQueryBuilder<T>;
  select(...columns: (SelectableType<T> | "*")[]): SqlLiteQueryBuilder<T>;
  select(
    ...columns: (SelectableType<T> | "*" | string)[]
  ): SqlLiteQueryBuilder<T> {
    this.modelSelectedColumns = columns as string[];
    this.selectQuery = this.selectTemplate.selectColumns(
      ...(columns as string[]),
    );
    return this;
  }

  joinRaw(query: string): this {
    this.joinQuery += ` ${query} `;
    return this;
  }

  join(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): SqlLiteQueryBuilder<T> {
    const join = joinTemplate(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn,
    );
    this.joinQuery += join.innerJoin();
    return this;
  }

  leftJoin(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): SqlLiteQueryBuilder<T> {
    const join = joinTemplate(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn,
    );
    this.joinQuery += join.leftJoin();
    return this;
  }

  with(
    relation: RelationType<T>,
    relatedModelQueryBuilder?: (queryBuilder: ModelQueryBuilder<any>) => void,
  ): ModelQueryBuilder<T> {
    if (!relatedModelQueryBuilder) {
      this.relations.push({
        relation: relation as string,
      });

      return this;
    }

    const queryBuilder = new SqlLiteQueryBuilder(
      // Not useful for the relations query
      {} as typeof Model,
      "",
      this.sqLiteConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );

    relatedModelQueryBuilder(queryBuilder);

    this.relations.push({
      relation: relation as string,
      selectedColumns: queryBuilder.modelSelectedColumns,
      whereQuery: this.whereTemplate.convertPlaceHolderToValue(
        queryBuilder.whereQuery,
      ),
      params: queryBuilder.params,
      joinQuery: queryBuilder.joinQuery,
      groupByQuery: queryBuilder.groupByQuery,
      orderByQuery: queryBuilder.orderByQuery,
      limitQuery: queryBuilder.limitQuery,
      offsetQuery: queryBuilder.offsetQuery,
      havingQuery: queryBuilder.havingQuery,
      dynamicColumns: queryBuilder.dynamicColumns,
    });

    return this;
  }

  addDynamicColumns(
    dynamicColumns: DynamicColumnType<T>[],
  ): ModelQueryBuilder<T> {
    this.dynamicColumns = dynamicColumns as string[];
    return this;
  }

  groupBy(...columns: SelectableType<T>[]): this;
  groupBy(...columns: string[]): this;
  groupBy(...columns: (SelectableType<T> | string)[]): this {
    this.groupByQuery = this.selectTemplate.groupBy(...(columns as string[]));
    return this;
  }

  groupByRaw(query: string): this {
    query.replace("GROUP BY", "");
    this.groupByQuery = ` GROUP BY ${query}`;
    return this;
  }

  orderBy(column: SelectableType<T>, order: "ASC" | "DESC"): this;
  orderBy(column: string, order: "ASC" | "DESC"): this;
  orderBy(column: SelectableType<T> | string, order: "ASC" | "DESC"): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );

    if (this.orderByQuery) {
      this.orderByQuery += `, ${casedColumn as string} ${order}`;
      return this;
    }

    this.orderByQuery = ` ORDER BY ${casedColumn as string} ${order}`;
    return this;
  }

  orderByRaw(query: string): this {
    if (this.orderByQuery) {
      this.orderByQuery += `, ${query}`;
      return this;
    }

    this.orderByQuery = ` ORDER BY ${query}`;
    return this;
  }

  limit(limit: number) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }

  offset(offset: number) {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }

  havingRaw(query: string): ModelQueryBuilder<T> {
    query = query.replace("HAVING", "");
    if (this.havingQuery) {
      this.havingQuery += ` AND ${query}`;
      return this;
    }

    this.havingQuery = ` HAVING ${query}`;
    return this;
  }

  copy(): ModelQueryBuilder<T> {
    const queryBuilder = new SqlLiteQueryBuilder<T>(
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

  private promisifyQuery<T>(query: string, params: any): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      this.sqLiteConnection.all(query, params, (err, result) => {
        if (err) {
          reject(err);
        }

        if (!result) {
          resolve([] as T[]);
        }

        if (!Array.isArray(result)) {
          resolve([result as T]);
        }

        resolve(result as T[]);
      });
    });
  }
}
