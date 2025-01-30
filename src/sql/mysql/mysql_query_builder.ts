import { convertCase } from "../../utils/case_utils";
import { log } from "../../utils/logger";
import { Model, getBaseModelInstance } from "../models/model";
import {
  ModelKey,
  ModelRelation,
} from "../models/model_manager/model_manager_types";
import SqlModelManagerUtils from "../models/model_manager/model_manager_utils";
import { PaginatedData, getPaginationMetadata } from "../pagination";
import {
  DeleteOptions,
  SoftDeleteOptions,
} from "../query_builder/delete_query_builder_type";
import {
  ManyOptions,
  ModelInstanceType,
  ModelQueryBuilder,
  OneOptions,
  QueryBuilder,
} from "../query_builder/query_builder";
import { UpdateOptions } from "../query_builder/update_query_builder_types";
import deleteTemplate from "../resources/query/DELETE";
import updateTemplate from "../resources/query/UPDATE";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import { SqlDataSource } from "../sql_data_source";
import { MysqlConnectionInstance } from "../sql_data_source_types";
import { execSql } from "../sql_runner/sql_runner";

export class MysqlQueryBuilder<T extends Model> extends QueryBuilder<T> {
  protected type: "mysql" | "mariadb";
  protected mysqlConnection: MysqlConnectionInstance;
  protected updateTemplate: ReturnType<typeof updateTemplate>;
  protected deleteTemplate: ReturnType<typeof deleteTemplate>;
  protected mysqlModelManagerUtils: SqlModelManagerUtils<T>;

  constructor(
    type: "mysql" | "mariadb",
    model: typeof Model,
    table: string,
    mysqlConnection: MysqlConnectionInstance,
    logs: boolean,
    isNestedCondition = false,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, table, logs, sqlDataSource);
    this.type = type;
    this.mysqlConnection = mysqlConnection;
    this.updateTemplate = updateTemplate(sqlDataSource.getDbType(), this.model);
    this.deleteTemplate = deleteTemplate(table, sqlDataSource.getDbType());
    this.isNestedCondition = isNestedCondition;
    this.mysqlModelManagerUtils = new SqlModelManagerUtils<T>(
      this.type,
      this.mysqlConnection,
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

    const [rows] = await execSql(
      query,
      this.params,
      "mysql",
      this.mysqlConnection,
      this.logs,
    );

    if (!rows.length) {
      return null;
    }

    const modelInstance = getBaseModelInstance<T>();
    await this.mergeRawPacketIntoModel(modelInstance, rows[0], this.model);
    const relationModels =
      await this.mysqlModelManagerUtils.parseQueryBuilderRelations(
        [modelInstance],
        this.model,
        this.relations,
        this.type,
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

    const [rows] = await execSql(
      query,
      this.params,
      "mysql",
      this.mysqlConnection,
      this.logs,
    );

    const modelPromises = rows.map(async (row: any) => {
      const modelInstance = getBaseModelInstance<T>();
      await this.mergeRawPacketIntoModel(modelInstance, row, this.model);
      return modelInstance as T;
    });

    const models = await Promise.all(modelPromises);
    const relationModels =
      await this.mysqlModelManagerUtils.parseQueryBuilderRelations(
        models,
        this.model,
        this.relations,
        this.type,
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

  async softDelete(options?: SoftDeleteOptions<T>): Promise<number> {
    const {
      column = "deletedAt",
      value = new Date().toISOString().slice(0, 19).replace("T", " "),
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
    const rows: any = await this.mysqlConnection.query(query, params);
    if (!rows[0].affectedRows) {
      return 0;
    }

    return rows[0].affectedRows;
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
    const rows: any = await this.mysqlConnection.query(query, this.params);

    if (!rows[0].affectedRows) {
      return 0;
    }

    return rows[0].affectedRows;
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
    );

    const { query, params } = this.updateTemplate.massiveUpdate(
      columns,
      values,
      this.whereQuery,
      this.joinQuery,
    );

    params.push(...this.params);

    log(query, this.logs, params);
    const rows: any = await this.mysqlConnection.query(query, params);
    if (!rows[0].affectedRows) {
      return 0;
    }

    return rows[0].affectedRows;
  }

  async getCount(
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    if (options.ignoreHooks) {
      const [result]: any = await this.mysqlConnection.query(
        `SELECT COUNT(*) as total from ${this.table}`,
      );
      return result[0].total;
    }

    this.select("COUNT(*) as total");
    const result = await this.one();
    return result ? +result.$additional.total : 0;
  }

  async getSum(column: ModelKey<T>): Promise<number>;
  async getSum(column: string): Promise<number>;
  async getSum(
    column: ModelKey<T> | string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    if (options.ignoreHooks) {
      const [result]: any = await this.mysqlConnection.query(
        `SELECT SUM(${column as string}) as total from ${this.table}`,
      );
      return result[0].total;
    }

    column = convertCase(column as string, this.model.databaseCaseConvention);
    this.select(`SUM(${column as string}) as total`);
    const result = await this.one();
    return result ? +result.$additional.total : 0;
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
      +total[0].$additional["total"] as number,
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

  whereBuilder(cb: (queryBuilder: MysqlQueryBuilder<T>) => void): this {
    const queryBuilder = new MysqlQueryBuilder(
      this.type,
      this.model as typeof Model,
      this.table,
      this.mysqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(queryBuilder as unknown as MysqlQueryBuilder<T>);

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

  orWhereBuilder(cb: (queryBuilder: MysqlQueryBuilder<T>) => void): this {
    const nestedBuilder = new MysqlQueryBuilder(
      this.type,
      this.model as typeof Model,
      this.table,
      this.mysqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(nestedBuilder as unknown as MysqlQueryBuilder<T>);

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

  andWhereBuilder(cb: (queryBuilder: MysqlQueryBuilder<T>) => void): this {
    const nestedBuilder = new MysqlQueryBuilder(
      this.type,
      this.model as typeof Model,
      this.table,
      this.mysqlConnection,
      this.logs,
      true,
      this.sqlDataSource,
    );
    cb(nestedBuilder as unknown as MysqlQueryBuilder<T>);

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

  with<O extends typeof Model>(
    relation: ModelRelation<T>,
    relatedModel?: O,
    relatedModelQueryBuilder?: (
      queryBuilder: ModelQueryBuilder<ModelInstanceType<O>>,
    ) => void,
    ignoreHooks?: { beforeFetch?: boolean; afterFetch?: boolean },
  ): ModelQueryBuilder<T> {
    if (!relatedModelQueryBuilder) {
      this.relations.push({
        relation: relation as string,
      });

      return this;
    }

    const queryBuilder = new MysqlQueryBuilder(
      this.type,
      relatedModel as typeof Model,
      relatedModel?.table || "",
      this.mysqlConnection,
      this.logs,
      false,
      this.sqlDataSource,
    );

    relatedModelQueryBuilder(queryBuilder as ModelQueryBuilder<any>);
    if (!ignoreHooks?.beforeFetch) {
      relatedModel?.beforeFetch(queryBuilder);
    }

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
      ignoreAfterFetchHook: ignoreHooks?.afterFetch || false,
    });

    return this;
  }

  copy(): ModelQueryBuilder<T> {
    const queryBuilder = new MysqlQueryBuilder<T>(
      this.type,
      this.model as typeof Model,
      this.table,
      this.mysqlConnection,
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
}
