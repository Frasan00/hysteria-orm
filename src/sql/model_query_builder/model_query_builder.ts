import { format } from "sql-formatter";
import { HysteriaError } from "../../errors/hysteria_error";
import { convertCase } from "../../utils/case_utils";
import { convertPlaceHolderToValue } from "../../utils/placeholder";
import { getBaseModelInstance, Model } from "../models/model";
import { getModelColumns } from "../models/model_decorators";
import type {
  ModelKey,
  ModelRelation,
} from "../models/model_manager/model_manager_types";
import SqlModelManagerUtils from "../models/model_manager/model_manager_utils";
import { getPaginationMetadata, PaginatedData } from "../pagination";
import deleteTemplate from "../resources/query/DELETE";
import selectTemplate from "../resources/query/SELECT";
import updateTemplate from "../resources/query/UPDATE";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import { SqlDataSource } from "../sql_data_source";
import { SqlDataSourceType } from "../sql_data_source_types";
import { execSql, getSqlDialect } from "../sql_runner/sql_runner";
import { DeleteOptions, SoftDeleteOptions } from "./delete_query_builder_type";
import type {
  FetchHooks,
  ManyOptions,
  ModelInstanceType,
  OneOptions,
  RelationQueryBuilder,
} from "./model_query_builder_types";
import type { UpdateOptions } from "./update_query_builder_types";
import { WhereQueryBuilder } from "./where_query_builder";

export class ModelQueryBuilder<T extends Model> extends WhereQueryBuilder<T> {
  protected selectTemplate: ReturnType<typeof selectTemplate>;
  protected updateTemplate: ReturnType<typeof updateTemplate>;
  protected deleteTemplate: ReturnType<typeof deleteTemplate>;
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;
  protected type: SqlDataSourceType;
  protected selectQuery: string;
  protected modelSelectedColumns: string[];
  protected relations: RelationQueryBuilder[];
  protected groupByQuery: string;
  protected orderByQuery: string;
  protected limitQuery: string;
  protected offsetQuery: string;
  protected havingQuery: string;

  constructor(
    model: typeof Model,
    sqlDataSource: SqlDataSource,
    isNestedCondition = false,
  ) {
    super(model, isNestedCondition, sqlDataSource);
    this.sqlDataSource = sqlDataSource;
    this.type = this.sqlDataSource.getDbType();
    this.sqlModelManagerUtils = new SqlModelManagerUtils<T>(
      this.type,
      this.sqlDataSource,
    );
    this.selectTemplate = selectTemplate(this.type, this.model);
    this.updateTemplate = updateTemplate(this.type, this.model);
    this.deleteTemplate = deleteTemplate(this.model.table, this.type);
    this.selectQuery = this.selectTemplate.selectAll;
    this.whereQuery = "";
    this.modelSelectedColumns = [];
    this.relations = [];
    this.groupByQuery = "";
    this.orderByQuery = "";
    this.limitQuery = "";
    this.offsetQuery = "";
    this.havingQuery = "";
  }

  /**
   * @description Executes the query and retrieves the first result.
   */
  async one(options: OneOptions = {}): Promise<T | null> {
    const result = await this.limit(1).many(options);
    if (!result || !result.length) {
      return null;
    }

    return result[0];
  }

  /**
   * @alias one
   */
  async first(options?: OneOptions): Promise<T | null> {
    return this.one(options);
  }

  /**
   * @description Executes the query and retrieves the first result. Fail if no result is found.
   */
  async oneOrFail(options?: {
    ignoreHooks?: OneOptions["ignoreHooks"] & { customError?: Error };
  }): Promise<T> {
    const model = await this.one(options);
    if (!model) {
      throw new HysteriaError(this.model.name + "::oneOrFail", "ROW_NOT_FOUND");
    }

    return model;
  }

  /**
   * @alias oneOrFail
   */
  async firstOrFail(options?: {
    ignoreHooks?: OneOptions["ignoreHooks"] & { customError?: Error };
  }): Promise<T> {
    return this.oneOrFail(options);
  }

  /**
   * @description Executes the query and retrieves multiple results.
   */
  async many(options: ManyOptions = {}): Promise<T[]> {
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
    const rows = await execSql(query, this.params, this.sqlDataSource, "raw", {
      sqlLiteOptions: {
        typeofModel: this.model,
      },
    });

    const modelPromises = rows.map(async (row: any) => {
      const modelInstance = getBaseModelInstance<T>();
      await this.mergeRawPacketIntoModel(modelInstance, row, this.model);
      return modelInstance as T;
    });

    const models = await Promise.all(modelPromises);
    const relationModels =
      await this.sqlModelManagerUtils.parseQueryBuilderRelations(
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

  /**
   * @description Updates records in the database for the current query.
   */
  async update(data: Partial<T>, options: UpdateOptions = {}): Promise<number> {
    const { ignoreBeforeUpdateHook } = options || {};
    if (!ignoreBeforeUpdateHook) {
      this.model.beforeUpdate(this);
    }

    const columns = Object.keys(data);
    const values = Object.values(data);
    this.whereQuery = convertPlaceHolderToValue(
      this.type,
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

    return execSql(query, params, this.sqlDataSource, "affectedRows", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "affectedRows",
      },
    });
  }

  /**
   * @description soft Deletes Records from the database.
   * @default column - 'deletedAt'
   * @default value - The current date and time.
   * @default ignoreBeforeDeleteHook - false
   * @default trx - undefined
   */
  async softDelete(options: SoftDeleteOptions<T> = {}): Promise<number> {
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

    return execSql(query, params, this.sqlDataSource, "affectedRows", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "affectedRows",
      },
    });
  }

  /**
   * @description Deletes Records from the database for the current query.
   */
  async delete(options: DeleteOptions = {}): Promise<number> {
    const { ignoreBeforeDeleteHook } = options || {};
    if (!ignoreBeforeDeleteHook) {
      this.model.beforeDelete(this);
    }

    const query = this.deleteTemplate.massiveDelete(
      this.whereQuery,
      this.joinQuery,
    );

    return execSql(query, this.params, this.sqlDataSource, "affectedRows", {
      sqlLiteOptions: {
        typeofModel: this.model,
        mode: "affectedRows",
      },
    });
  }

  /**
   * @description Executes the query and retrieves the count of results, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getCount(
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.select("COUNT(*) as total");
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = await this.one({ ignoreHooks: ignoredHooks });
    return result ? +result.$additional.total : 0;
  }

  /**
   * @description Executes the query and retrieves the sum of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getSum(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.select(`SUM(${column}) as total`);
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = await this.one({ ignoreHooks: ignoredHooks });
    return result ? +result.$additional.total : 0;
  }

  /**
   * @description Executes the query and retrieves multiple results.
   */
  async paginate(
    page: number,
    limit: number,
    options: ManyOptions = {},
  ): Promise<PaginatedData<T>> {
    this.limitQuery = this.selectTemplate.limit(limit);
    this.offsetQuery = this.selectTemplate.offset((page - 1) * limit);

    const originalSelectQuery = this.selectQuery;
    this.select("COUNT(*) as total");
    const total = await this.getCount();

    this.selectQuery = originalSelectQuery;
    const models = await this.many(options);

    const paginationMetadata = getPaginationMetadata(page, limit, total);

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
   * @description Adds a SELECT condition to the query.
   */
  select(...columns: string[]): ModelQueryBuilder<T>;
  select(...columns: (ModelKey<T> | "*")[]): ModelQueryBuilder<T>;
  select(...columns: (ModelKey<T> | "*" | string)[]): ModelQueryBuilder<T> {
    this.selectQuery = this.selectTemplate.selectColumns(
      ...(columns as string[]),
    );

    this.modelSelectedColumns = columns.map((column) =>
      convertCase(column as string, this.model.databaseCaseConvention),
    ) as string[];

    return this;
  }

  distinct(): ModelQueryBuilder<T> {
    const distinct = this.selectTemplate.distinct;
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinct}`,
    );

    return this;
  }

  distinctOn(...columns: ModelKey<T>[]): ModelQueryBuilder<T>;
  distinctOn(...columns: string[]): ModelQueryBuilder<T>;
  distinctOn(...columns: (string | ModelKey<T>)[]): ModelQueryBuilder<T> {
    const distinctOn = this.selectTemplate.distinctOn(...(columns as string[]));

    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinctOn}`,
    );

    return this;
  }

  /**
   * @description Fills the relations in the model in the serialised response.
   * @description Relation must be defined in the model.
   */
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

    const queryBuilder = new ModelQueryBuilder(this.model, this.sqlDataSource);
    relatedModelQueryBuilder(queryBuilder as ModelQueryBuilder<any>);
    if (!ignoreHooks?.beforeFetch) {
      relatedModel?.beforeFetch(queryBuilder);
    }

    this.relations.push({
      relation: relation as string,
      selectedColumns: queryBuilder.modelSelectedColumns,
      whereQuery: convertPlaceHolderToValue(this.type, queryBuilder.whereQuery),
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

  /**
   * @description Use this to build more complex where conditions.
   */
  whereBuilder(cb: (queryBuilder: ModelQueryBuilder<T>) => void): this {
    const queryBuilder = new ModelQueryBuilder(
      this.model,
      this.sqlDataSource,
      true,
    );
    cb(queryBuilder as unknown as ModelQueryBuilder<T>);

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
   * @description Use this to build more complex where conditions.
   */
  andWhereBuilder(cb: (queryBuilder: ModelQueryBuilder<T>) => void): this {
    const nestedBuilder = new ModelQueryBuilder(
      this.model,
      this.sqlDataSource,
      true,
    );
    cb(nestedBuilder as unknown as ModelQueryBuilder<T>);

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
   * @description Use this to build more complex where conditions.
   */
  orWhereBuilder(cb: (queryBuilder: ModelQueryBuilder<T>) => void): this {
    const nestedBuilder = new ModelQueryBuilder(
      this.model,
      this.sqlDataSource,
      true,
    );
    cb(nestedBuilder as unknown as ModelQueryBuilder<T>);

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
   * @description Returns a copy of the query builder instance.
   */
  copy(): ModelQueryBuilder<T> {
    const queryBuilder = new ModelQueryBuilder<T>(
      this.model,
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

  /**
   * @description Returns the query and the parameters in an object.
   */
  toSql(): {
    query: string;
    params: any[];
  } {
    const query =
      this.selectQuery +
      this.joinQuery +
      this.whereQuery +
      this.groupByQuery +
      this.havingQuery +
      this.orderByQuery +
      this.limitQuery +
      this.offsetQuery;

    function parsePlaceHolders(
      dbType: string,
      query: string,
      startIndex: number = 1,
    ): string {
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          return query.replace(/PLACEHOLDER/g, () => "?");
        case "postgres":
        case "cockroachdb":
          let index = startIndex;
          return query.replace(/PLACEHOLDER/g, () => `$${index++}`);
        default:
          throw new HysteriaError(
            "Autogenerator::parsePlaceHolders",
            `UNSUPPORTED_DATABASE_TYPE_ERROR}`,
          );
      }
    }

    let parsedQuery = parsePlaceHolders(this.type, query);

    parsedQuery = format(parsedQuery, {
      language: getSqlDialect(this.type),
    });
    return { query: parsedQuery, params: this.params };
  }

  protected groupFooterQuery(): string {
    return (
      this.groupByQuery +
      this.havingQuery +
      this.orderByQuery +
      this.limitQuery +
      this.offsetQuery
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
      if (columns.map((column) => column.columnName).includes(casedKey)) {
        Object.assign(model, { [casedKey]: value });
        return;
      }

      model.$additional[key] = value as string | number | boolean;
    });
  }
}
