import { getBaseModelInstance, Model } from "../models/model";
import {
  OneOptions,
  QueryBuilder,
  ModelQueryBuilder,
  ManyOptions,
} from "../query_builder/query_builder";
import { Client } from "pg";
import { log, queryError } from "../../utils/logger";
import joinTemplate from "../resources/query/JOIN";
import { PaginatedData, getPaginationMetadata } from "../pagination";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import {
  DynamicColumnType,
  RelationType,
  SelectableType,
} from "../models/model_manager/model_manager_types";
import "reflect-metadata";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { convertCase } from "../../utils/case_utils";
import SqlModelManagerUtils from "../models/model_manager/model_manager_utils";
import { DateTime } from "luxon";
import { DeleteOptions, SoftDeleteOptions } from "../query_builder/delete_query_builder_type";
import deleteTemplate from "../resources/query/DELETE";
import updateTemplate from "../resources/query/UPDATE";
import { UpdateOptions } from "../query_builder/update_query_builder_types";

export class PostgresQueryBuilder<T extends Model> extends QueryBuilder<T> {
  protected pgClient: Client;
  protected postgresModelManagerUtils: SqlModelManagerUtils<T>;
  protected updateTemplate: ReturnType<typeof updateTemplate>;
  protected deleteTemplate: ReturnType<typeof deleteTemplate>;

  public constructor(
    model: typeof Model,
    table: string,
    pgClient: Client,
    logs: boolean,
    isNestedCondition = false,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, table, logs, sqlDataSource);
    this.pgClient = pgClient;
    this.isNestedCondition = isNestedCondition;
    this.updateTemplate = updateTemplate(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = deleteTemplate(table, sqlDataSource.getDbType());
    this.postgresModelManagerUtils = new SqlModelManagerUtils<T>(
      "postgres",
      this.pgClient,
    );
  }

  // SELECT
  public select(...columns: string[]): PostgresQueryBuilder<T>;
  public select(
    ...columns: (SelectableType<T> | "*")[]
  ): PostgresQueryBuilder<T>;
  public select(
    ...columns: (SelectableType<T> | "*" | string)[]
  ): PostgresQueryBuilder<T> {
    this.selectQuery = this.selectTemplate.selectColumns(
      ...(columns as string[]),
    );
    return this;
  }

  public async one(
    options: OneOptions = { throwErrorOnNull: false },
  ): Promise<T | null> {
    // hook query builder
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }

    this.limitQuery = this.selectTemplate.limit(1);
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
      const result = await this.pgClient.query(query, this.params);
      if (!result.rows[0]) {
        if (options.throwErrorOnNull) {
          throw new Error("ROW_NOT_FOUND");
        }

        return null;
      }

      const modelInstance = getBaseModelInstance<T>();
      await this.mergeRawPacketIntoModel(
        modelInstance,
        result.rows[0],
        this.model,
      );

      const relationModels =
        await this.postgresModelManagerUtils.parseQueryBuilderRelations(
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
      const result = await this.pgClient.query(query, this.params);
      const rows = result.rows;

      const modelPromises = rows.map(async (row) => {
        const modelInstance = getBaseModelInstance<T>();
        await this.mergeRawPacketIntoModel(modelInstance, row, this.model);

        return modelInstance as T;
      });

      const models = await Promise.all(modelPromises);
      const relationModels =
        await this.postgresModelManagerUtils.parseQueryBuilderRelations(
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
    } catch (error: any) {
      throw new Error("query failed: " + error.message);
    }
  }

  public async update(
    data: Partial<T>,
    options?: UpdateOptions,
  ): Promise<number> {
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
    try {
      const result = await this.pgClient.query<T>(query, params);
      if (!result.rows) {
        return 0;
      }

      return result.rowCount || 0;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }

  public async delete(options: DeleteOptions = {}): Promise<number> {
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
    try {
      const result = await this.pgClient.query<T>(query, this.params);
      if (!result.rows) {
        return 0;
      }

      return result.rowCount || 0;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }

  public async softDelete(options?: SoftDeleteOptions<T>): Promise<number> {
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
    try {
      const result = await this.pgClient.query<T>(query, params);
      if (!result.rows) {
        return 0;
      }

      return result.rowCount || 0;
    } catch (error) {
      queryError(query);
      throw new Error("query failed " + error);
    }
  }

  public whereBuilder(
    cb: (queryBuilder: PostgresQueryBuilder<T>) => void,
  ): this {
    const queryBuilder = new PostgresQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.pgClient,
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

  public orWhereBuilder(
    cb: (queryBuilder: PostgresQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new PostgresQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.pgClient,
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

  public andWhereBuilder(
    cb: (queryBuilder: PostgresQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new PostgresQueryBuilder(
      this.model as typeof Model,
      this.table,
      this.pgClient,
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

  public async getCount(
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    if (options.ignoreHooks) {
      const { rows } = await this.pgClient.query(
        `SELECT COUNT(*) as total from ${this.table}`,
      );
      return +rows[0].total;
    }
    this.select("COUNT(*) as total");
    const result = await this.one();
    return result ? +result.extraColumns["total"] : 0;
  }

  public async getSum(column: SelectableType<T>): Promise<number>;
  public async getSum(column: string): Promise<number>;
  public async getSum(
    column: SelectableType<T> | string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    if (options.ignoreHooks) {
      const { rows } = await this.pgClient.query(
        `SELECT SUM(${column as string}) as total from ${this.table}`,
      );
      return +rows[0].total || 0;
    }

    column = convertCase(column as string, this.model.databaseCaseConvention);
    this.select(`SUM(${column as string}) as total`);
    const result = await this.one();
    return result ? +result.extraColumns["total"] : 0;
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

  public join(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): PostgresQueryBuilder<T> {
    const join = joinTemplate(
      this.model,
      relationTable,
      primaryColumn as string,
      foreignColumn as string,
    );
    this.joinQuery += join.innerJoin();
    return this;
  }

  public leftJoin(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): PostgresQueryBuilder<T> {
    const join = joinTemplate(
      this.model,
      relationTable,
      primaryColumn as string,
      foreignColumn as string,
    );
    this.joinQuery += join.leftJoin();
    return this;
  }

  public addRelations(relations: RelationType<T>[]): PostgresQueryBuilder<T> {
    this.relations = relations as string[];
    return this;
  }

  public addDynamicColumns(
    dynamicColumns: DynamicColumnType<T>[],
  ): ModelQueryBuilder<T> {
    this.dynamicColumns = dynamicColumns as string[];
    return this;
  }

  public groupBy(...columns: SelectableType<T>[]): this;
  public groupBy(...columns: string[]): this;
  public groupBy(...columns: (SelectableType<T> | string)[]): this {
    this.groupByQuery = this.selectTemplate.groupBy(...(columns as string[]));
    return this;
  }

  public groupByRaw(query: string): this {
    this.groupByQuery = ` GROUP BY ${query}`;
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

  public orderByRaw(query: string): this {
    this.orderByQuery = ` ORDER BY ${query}`;
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
    const queryBuilder = new PostgresQueryBuilder<T>(
      this.model as typeof Model,
      this.table,
      this.pgClient,
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
}
