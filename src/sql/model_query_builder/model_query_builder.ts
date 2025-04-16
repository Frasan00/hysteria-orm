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
import { QueryBuilder } from "../query_builder/query_builder";
import { parseDatabaseDataIntoModelResponse } from "../serializer";
import { SqlDataSource } from "../sql_data_source";
import { DeleteOptions, SoftDeleteOptions } from "./delete_query_builder_type";
import type {
  FetchHooks,
  ManyOptions,
  ModelInstanceType,
  OneOptions,
  RelationQueryBuilder,
} from "./model_query_builder_types";
import type { UpdateOptions } from "./update_query_builder_types";

export class ModelQueryBuilder<T extends Model> extends QueryBuilder<T> {
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;
  protected relations: RelationQueryBuilder[];
  protected modelSelectedColumns: string[];

  constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.sqlModelManagerUtils = new SqlModelManagerUtils<T>(
      this.dbType,
      sqlDataSource,
    );
    this.relations = [];
    this.modelSelectedColumns = [];
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
  override async many(options: ManyOptions = {}): Promise<T[]> {
    !options.ignoreHooks?.includes("beforeFetch") &&
      this.model.beforeFetch(this);
    const rows = await super.many();
    const models = rows.map((row) => {
      const modelInstance = getBaseModelInstance<T>();
      this.mergeRawPacketIntoModel(modelInstance, row, this.model);
      return modelInstance;
    });

    const relationModels =
      await this.sqlModelManagerUtils.parseQueryBuilderRelations(
        models,
        this.model,
        this.relations,
        this.dbType,
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
  override async update(
    data: Partial<T>,
    options: UpdateOptions = {},
  ): Promise<number> {
    options.ignoreBeforeUpdateHook && this.model.beforeUpdate(this);
    return super.update(data);
  }

  /**
   * @description soft Deletes Records from the database.
   * @default column - 'deletedAt'
   * @default value - The current date and time.
   * @default ignoreBeforeDeleteHook - false
   * @default trx - undefined
   */
  override async softDelete(
    options: SoftDeleteOptions<T> = {},
  ): Promise<number> {
    const { ignoreBeforeDeleteHook = false } = options || {};
    !ignoreBeforeDeleteHook && this.model.beforeDelete(this);

    return super.softDelete(options);
  }

  /**
   * @description Deletes Records from the database for the current query.
   */
  async delete(options: DeleteOptions = {}): Promise<number> {
    options.ignoreBeforeDeleteHook && this.model.beforeDelete(this);
    return super.delete();
  }

  /**
   * @description Executes the query and retrieves the count of results, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getCount(
    column: string = "*",
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.select(`COUNT(${column}) as total`);
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch"]
      : [];

    const result = await this.one({ ignoreHooks: ignoredHooks });
    return result ? +result.$additional.total : 0;
    return 0;
  }

  /**
   * @description Executes the query and retrieves the maximum value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getMax(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.select(`MAX(${column}) as total`);
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = await this.one({ ignoreHooks: ignoredHooks });
    return result ? +result.$additional.total : 0;
  }

  /**
   * @description Executes the query and retrieves the minimum value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getMin(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.select(`MIN(${column}) as total`);
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = await this.one({ ignoreHooks: ignoredHooks });
    return result ? +result.$additional.total : 0;
  }

  /**
   * @description Executes the query and retrieves the average value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getAvg(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.select(`AVG(${column}) as total`);
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
   * @description Executes the query and retrieves multiple paginated results.
   */
  async paginate(
    page: number,
    perPage: number,
    options: ManyOptions = {},
  ): Promise<PaginatedData<T>> {
    this.limitQuery = this.selectTemplate.limit(perPage);
    this.offsetQuery = this.selectTemplate.offset((page - 1) * perPage);

    const originalSelectQuery = this.selectQuery;
    this.select(`COUNT(*) as total`);
    const total = await this.getCount();

    this.selectQuery = originalSelectQuery;
    const models = await this.many(options);

    const paginationMetadata = getPaginationMetadata(page, perPage, total);

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

  override select(...columns: string[]): this;
  override select(...columns: (ModelKey<T> | "*")[]): this;
  override select(...columns: (ModelKey<T> | "*" | string)[]): this {
    this.selectQuery = this.selectTemplate.selectColumns(
      this.fromTable,
      columns as string[],
    );

    this.modelSelectedColumns = columns.map((column) =>
      convertCase(column as string, this.model.databaseCaseConvention),
    ) as string[];

    return this;
  }

  /**
   * @description Fills the relations in the model in the serialized response.
   * @description Relation must be defined in the model.
   */
  withRelation<O extends typeof Model>(
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
      whereQuery: convertPlaceHolderToValue(
        this.dbType,
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

  /**
   * @description Returns a copy of the query builder instance.
   */
  override copy(): this {
    const queryBuilder = super.copy();
    queryBuilder.relations = [...this.relations];
    return queryBuilder;
  }

  protected mergeRawPacketIntoModel(
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
