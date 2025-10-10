import crypto from "node:crypto";
import { PassThrough } from "node:stream";
import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import { withPerformance } from "../../../utils/performance";
import { SelectNode } from "../../ast/query/node/select/basic_select";
import type { SqlMethod } from "../../ast/query/node/select/select_types";
import { BaseValues, BinaryOperatorType } from "../../ast/query/node/where";
import { InterpreterUtils } from "../../interpreter/interpreter_utils";
import { Model } from "../../models/model";
import type {
  ModelKey,
  ModelRelation,
} from "../../models/model_manager/model_manager_types";
import SqlModelManagerUtils from "../../models/model_manager/model_manager_utils";
import {
  CursorPaginatedData,
  getPaginationMetadata,
  PaginatedData,
} from "../../pagination";
import {
  DeleteOptions,
  SoftDeleteOptions,
} from "../../query_builder/delete_query_builder_type";
import { QueryBuilder } from "../../query_builder/query_builder";
import {
  Cursor,
  PaginateWithCursorOptions,
  RelationRetrieveMethod,
  SelectableColumn,
  StreamOptions,
} from "../../query_builder/query_builder_types";
import type { UpdateOptions } from "../../query_builder/update_query_builder_types";
import {
  deepCloneNode,
  remapSelectedColumnToFromAlias,
} from "../../resources/utils";
import { serializeModel } from "../../serializer";
import { SqlDataSource } from "../../sql_data_source";
import { execSqlStreaming } from "../../sql_runner/sql_runner";
import { ColumnType } from "../decorators/model_decorators_types";
import { BaseModelMethodOptions, ModelWithoutRelations } from "../model_types";
import { ManyToMany } from "../relations/many_to_many";
import { Relation, RelationEnum } from "../relations/relation";
import type {
  AnnotatedModel,
  CommonSqlMethodReturnType,
  FetchHooks,
  ManyOptions,
  OneOptions,
  RelatedInstance,
} from "./model_query_builder_types";
import type { RelationQueryBuilderType } from "./relation_query_builder/relation_query_builder_types";

export class ModelQueryBuilder<
  T extends Model,
  A extends Record<string, any> = {},
  R extends Record<string, any> = {},
> extends QueryBuilder<T> {
  declare relation: Relation;
  protected sqlModelManagerUtils: SqlModelManagerUtils<T>;
  protected relationQueryBuilders: ModelQueryBuilder<any>[];
  protected modelSelectedColumns: string[];
  private modelColumnsMap: Map<string, ColumnType>;
  private modelColumnsDatabaseNames: Map<string, string>;
  protected limitValue?: number;
  protected offsetValue?: number;

  // @ts-expect-error
  override performance = {
    many: this.manyWithPerformance.bind(this),
    one: this.oneWithPerformance.bind(this),
    oneOrFail: this.oneOrFailWithPerformance.bind(this),
    first: this.firstWithPerformance.bind(this),
    firstOrFail: this.firstOrFailWithPerformance.bind(this),
    paginate: this.paginateWithPerformance.bind(this),
    exists: this.existsWithPerformance.bind(this),
    paginateWithCursor: this.paginateWithCursorWithPerformance.bind(this),
    truncate: this.truncateWithPerformance.bind(this),
    delete: this.deleteWithPerformance.bind(this),
    update: this.updateWithPerformance.bind(this),
    softDelete: this.softDeleteWithPerformance.bind(this),
    pluck: this.pluckWithPerformance.bind(this),
  };

  constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.sqlModelManagerUtils = new SqlModelManagerUtils<T>(
      model,
      this.dbType,
      sqlDataSource,
    );

    this.relationQueryBuilders = [];
    this.modelSelectedColumns = [];
    this.modelColumnsMap = new Map<string, ColumnType>();
    this.modelColumnsDatabaseNames = new Map<string, string>();
    const modelColumns = this.model.getColumns();
    modelColumns.forEach((column) => {
      this.modelColumnsMap.set(column.databaseName, column);
      this.modelColumnsDatabaseNames.set(
        column.databaseName,
        column.columnName,
      );
    });
  }

  /**
   * @description Returns true if the query builder is a relation query builder, this changes the behavior of the query builder like limit, offset, etc.
   * @internal
   */
  protected get isRelationQueryBuilder(): boolean {
    return !!this.relation;
  }

  /**
   * @description Creates a new ModelQueryBuilder instance from a model. Will use the main connection to the database by default.
   */
  static from(
    model: typeof Model,
    options: BaseModelMethodOptions = {},
  ): ModelQueryBuilder<InstanceType<typeof model>> {
    if (options.connection) {
      return new ModelQueryBuilder(model, options.connection);
    }

    if (options.trx) {
      return new ModelQueryBuilder(model, options.trx.sql as SqlDataSource);
    }

    return new ModelQueryBuilder(model, model.sqlInstance);
  }

  async one(options: OneOptions = {}): Promise<AnnotatedModel<T, A, R> | null> {
    const result = await this.limit(1).many(options);
    if (!result || !result.length) {
      return null;
    }

    return result[0];
  }

  async first(options?: OneOptions): Promise<AnnotatedModel<T, A, R> | null> {
    return this.one(options);
  }

  async oneOrFail(options?: {
    ignoreHooks?: OneOptions["ignoreHooks"] & { customError?: Error };
  }): Promise<AnnotatedModel<T, A, R>> {
    const model = await this.one(options);
    if (!model) {
      throw new HysteriaError(this.model.name + "::oneOrFail", "ROW_NOT_FOUND");
    }

    return model as AnnotatedModel<T, A, R>;
  }

  async firstOrFail(options?: {
    ignoreHooks?: OneOptions["ignoreHooks"] & { customError?: Error };
  }): Promise<AnnotatedModel<T, A, R>> {
    return this.oneOrFail(options);
  }

  override async many(
    options: ManyOptions = {},
  ): Promise<AnnotatedModel<T, A, R>[]> {
    !(options.ignoreHooks as string[])?.includes("beforeFetch") &&
      (await this.model.beforeFetch?.(this));
    const rows = await super.many();
    const models = rows.map((row) => {
      return this.addAdditionalColumnsToModel(row, this.model);
    });

    if (!models.length) {
      return [];
    }

    const serializedModels = await serializeModel(
      models as T[],
      this.model,
      this.modelSelectedColumns,
      this.modelAnnotatedColumns,
      this.mustRemoveAnnotations,
    );

    if (!serializedModels) {
      return [];
    }

    const serializedModelsArray = Array.isArray(serializedModels)
      ? serializedModels
      : [serializedModels];

    if (!(options.ignoreHooks as string[])?.includes("afterFetch")) {
      await this.model.afterFetch?.(serializedModelsArray);
    }

    if (this.relationQueryBuilders.length) {
      await this.processRelationsRecursively(serializedModelsArray);
    }

    return serializedModelsArray as unknown as AnnotatedModel<T, A, R>[];
  }

  override async *chunk(
    chunkSize: number,
    options: ManyOptions = {},
  ): AsyncGenerator<AnnotatedModel<T, A, R>[]> {
    let offset = 0;

    while (true) {
      const models = await this.limit(chunkSize).offset(offset).many(options);
      if (!models.length) {
        break;
      }

      yield models;
      offset += models.length;
    }
  }

  // @ts-expect-error
  override async stream(
    options: ManyOptions & StreamOptions = {},
  ): Promise<PassThrough & AsyncGenerator<AnnotatedModel<T, A, R>>> {
    !(options.ignoreHooks as string[])?.includes("beforeFetch") &&
      (await this.model.beforeFetch?.(this));

    const { sql, bindings } = this.unWrap();
    const stream = await execSqlStreaming(
      sql,
      bindings,
      this.sqlDataSource,
      options,
      {
        onData: async (passThrough, row) => {
          const model = this.addAdditionalColumnsToModel(row, this.model);
          const serializedModel = await serializeModel(
            [model] as T[],
            this.model,
            this.modelSelectedColumns,
            this.modelAnnotatedColumns,
            this.mustRemoveAnnotations,
          );

          if (!serializedModel) {
            return;
          }

          if (!(options.ignoreHooks as string[])?.includes("afterFetch")) {
            await this.model.afterFetch?.([serializedModel] as unknown as T[]);
          }

          if (this.relationQueryBuilders.length) {
            await this.processRelationsRecursively([serializedModel as T]);
          }

          passThrough.write(serializedModel);
        },
      },
    );

    return stream as PassThrough & AsyncGenerator<AnnotatedModel<T, A, R>>;
  }

  override async paginateWithCursor<K extends ModelKey<T>>(
    page: number,
    options?: PaginateWithCursorOptions<T, K>,
    cursor?: Cursor<T, K>,
  ): Promise<[CursorPaginatedData<T, A, R>, Cursor<T, K>]> {
    if (!options) {
      if (!this.model.primaryKey) {
        throw new HysteriaError(
          this.model.name + "::paginateWithCursor",
          "PRIMARY_KEY_NOT_FOUND",
        );
      }

      options = {
        discriminator: this.model.primaryKey as K,
      };
    }

    return super.paginateWithCursor(page, options, cursor) as Promise<
      [CursorPaginatedData<T, A, R>, Cursor<T, K>]
    >;
  }

  /**
   * @description Inserts a new record into the database, it is not advised to use this method directly from the query builder if using a ModelQueryBuilder (`Model.query()`), use the `Model.insert` method instead.
   */
  // @ts-expect-error
  override async insert(
    ...args: Parameters<typeof this.model.insert>
  ): ReturnType<typeof this.model.insert> {
    return (this.model as any).insert(...args);
  }

  /**
   * @description Inserts multiple records into the database, it is not advised to use this method directly from the query builder if using a ModelQueryBuilder (`Model.query()`), use the `Model.insertMany` method instead.
   */
  // @ts-expect-error
  override async insertMany(
    ...args: Parameters<typeof this.model.insertMany>
  ): ReturnType<typeof this.model.insertMany> {
    return (this.model as any).insertMany(...args);
  }

  override async update(
    data: Partial<ModelWithoutRelations<T>>,
    options: UpdateOptions = {},
  ): Promise<number> {
    if (!options.ignoreBeforeUpdateHook) {
      await this.model.beforeUpdate?.(this);
    }
    return super.update(data);
  }

  override async softDelete(
    options: SoftDeleteOptions<T> = {},
  ): Promise<number> {
    const { ignoreBeforeUpdateHook = false } = options || {};
    !ignoreBeforeUpdateHook && (await this.model.beforeUpdate?.(this));
    return super.softDelete(options);
  }

  async delete(options: DeleteOptions = {}): Promise<number> {
    if (!options.ignoreBeforeDeleteHook) {
      await this.model.beforeDelete?.(this);
    }
    return super.delete();
  }

  override async getCount(
    column: string = "*",
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.clearForFunctions();
    this.annotate("count", column, "total");
    const ignoredHooks: string[] = options.ignoreHooks ? ["beforeFetch"] : [];

    const result = (await this.one({
      ignoreHooks: ignoredHooks as FetchHooks,
    })) as { $annotations: { total: number } } | null;

    if (!result) {
      return 0;
    }

    return +result.$annotations.total;
  }

  override async getMax(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.clearForFunctions();
    this.annotate("max", column, "total");
    const ignoredHooks: string[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = (await this.one({
      ignoreHooks: ignoredHooks as FetchHooks,
    })) as {
      $annotations: { total: number };
    } | null;

    if (!result) {
      return 0;
    }

    return +result.$annotations.total;
  }

  override async getMin(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.clearForFunctions();
    this.annotate("min", column, "total");
    const ignoredHooks: string[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = (await this.one({
      ignoreHooks: ignoredHooks as FetchHooks,
    })) as {
      $annotations: { total: number };
    } | null;

    if (!result) {
      return 0;
    }

    return +result.$annotations.total;
  }

  override async getAvg(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.clearForFunctions();
    this.annotate("avg", column, "total");
    const ignoredHooks: string[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = (await this.one({
      ignoreHooks: ignoredHooks as FetchHooks,
    })) as {
      $annotations: { total: number };
    } | null;

    if (!result) {
      return 0;
    }

    return +result.$annotations.total;
  }

  override async getSum(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.clearForFunctions();
    this.annotate("sum", column, "total");
    const ignoredHooks: string[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = (await this.one({
      ignoreHooks: ignoredHooks as FetchHooks,
    })) as {
      $annotations: { total: number };
    } | null;

    if (!result) {
      return 0;
    }

    return +result.$annotations.total;
  }

  override async paginate(
    page: number,
    perPage: number,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<PaginatedData<T, A, R>> {
    const clonedQuery = this.clone();

    const [models, total] = await Promise.all([
      this.limit(perPage)
        .offset((page - 1) * perPage)
        .many({
          ignoreHooks: options.ignoreHooks ? ["beforeFetch", "afterFetch"] : [],
        }),
      clonedQuery.getCount("*", {
        ignoreHooks: options.ignoreHooks,
      }),
    ]);

    const paginationMetadata = getPaginationMetadata(page, perPage, total);

    return {
      paginationMetadata,
      data: models,
    };
  }

  override select<S extends string>(...columns: SelectableColumn<S>[]): this;
  override select(...columns: (ModelKey<T> | "*")[]): this;
  override select<S extends string>(
    ...columns: (ModelKey<T> | "*" | SelectableColumn<S>)[]
  ): this {
    this.modelSelectedColumns = [
      ...this.modelSelectedColumns,
      ...(columns as string[]),
    ];

    this.selectNodes = this.selectNodes.concat(
      columns.map((column) => new SelectNode(column as string)),
    );

    return this;
  }

  /**
   * @description Annotates a column with a SQL method or a simple alias
   * @description If using a model, the result will be available in the $annotations property of the model, else it will be available in the result of the query
   * @example
   * ```ts
   * const user = await User.query().annotate("max", "id", "maxId").first(); // max(id) as maxId
   * const user = await User.query().annotate("id", "superId").first(); // id as superId
   * ```
   */
  // @ts-expect-error
  override annotate<K extends string, V = any>(
    column: string,
    alias: K,
  ): ModelQueryBuilder<T, A & { [P in K]: V }, R>;
  // @ts-expect-error
  override annotate<
    K extends string,
    S extends SqlMethod,
    V = CommonSqlMethodReturnType<S>,
  >(
    sqlMethod: string,
    column: string,
    alias: K,
  ): ModelQueryBuilder<T, A & { [P in K]: V }, R>;
  // @ts-expect-error
  override annotate<
    K extends string,
    S extends SqlMethod,
    V = CommonSqlMethodReturnType<S>,
  >(
    sqlMethod: S,
    column: string,
    alias: K,
  ): ModelQueryBuilder<T, A & { [P in K]: V }, R>;
  // @ts-expect-error
  override annotate<
    K extends string,
    S extends SqlMethod,
    V = CommonSqlMethodReturnType<S>,
  >(
    sqlMethod: S,
    column: string,
    alias: K,
  ): ModelQueryBuilder<T, A & { [P in K]: V }, R>;

  // @ts-expect-error
  override annotate<
    K extends string,
    S extends SqlMethod,
    V = CommonSqlMethodReturnType<S>,
  >(
    sqlMethodOrColumn: string | S,
    columnOrAlias: string,
    maybeAlias?: string,
  ): ModelQueryBuilder<T, A & { [P in K]: V }, R> {
    let sqlMethod: string | undefined;
    let column: string;
    let alias: string;

    if (maybeAlias) {
      sqlMethod = sqlMethodOrColumn as string;
      column = columnOrAlias;
      alias = maybeAlias as string;
    } else {
      sqlMethod = undefined;
      column = sqlMethodOrColumn as string;
      alias = columnOrAlias as string;
    }

    this.selectNodes = this.selectNodes.concat(
      new SelectNode(column, alias, sqlMethod),
    );
    this.modelAnnotatedColumns.push(alias);

    return this;
  }

  /**
   * @description Removes annotations from the serialized model, by default, annotations are maintained in the serialized model if `annotate` is used
   */
  removeAnnotations(): ModelQueryBuilder<T, {}> {
    this.mustRemoveAnnotations = true;
    this.modelAnnotatedColumns = [];
    return this;
  }

  /**
   * @description Fills the relations in the model in the serialized response. Relation must be defined in the model.
   * @warning Many to many relations have special behavior, since they require a join, a join clause will always be added to the query.
   * @warning Many to many relations uses the model foreign key for mapping in the `$annotations` property, this property will be removed from the model after the relation is filled.
   * @warning Foreign keys should always be selected in the relation query builder, otherwise the relation will not be filled.
   */
  load<
    RelationKey extends ModelRelation<T>,
    IA extends Record<string, any> = {},
    IR extends Record<string, any> = {},
  >(
    relation: RelationKey,
    cb: (
      queryBuilder: RelationQueryBuilderType<RelatedInstance<T, RelationKey>>,
    ) => RelationQueryBuilderType<RelatedInstance<T, RelationKey>, IA, IR>,
  ): ModelQueryBuilder<
    T,
    A,
    R & {
      [K in RelationKey]: Awaited<
        ReturnType<
          ModelQueryBuilder<
            RelatedInstance<T, K>,
            IA,
            IR
          >[RelationRetrieveMethod<T[K]>]
        >
      >;
    }
  >;
  load<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: RelationQueryBuilderType<RelatedInstance<T, RelationKey>>,
    ) => void,
  ): ModelQueryBuilder<
    T,
    A,
    R & {
      [K in RelationKey]: Awaited<
        ReturnType<
          ModelQueryBuilder<
            RelatedInstance<T, K>,
            {},
            {}
          >[RelationRetrieveMethod<T[K]>]
        >
      >;
    }
  >;
  load<
    RelationKey extends ModelRelation<T>,
    IA extends Record<string, any> = {},
    IR extends Record<string, any> = {},
  >(
    relation: RelationKey,
    cb?: (
      queryBuilder: RelationQueryBuilderType<RelatedInstance<T, RelationKey>>,
    ) => RelationQueryBuilderType<
      RelatedInstance<T, RelationKey>,
      IA,
      IR
    > | void,
  ): ModelQueryBuilder<
    T,
    A,
    R & {
      [K in RelationKey]: Awaited<
        ReturnType<
          ModelQueryBuilder<
            RelatedInstance<T, K>,
            IA,
            IR
          >[RelationRetrieveMethod<T[K]>]
        >
      >;
    }
  > {
    const modelRelation =
      this.sqlModelManagerUtils.getRelationFromModel(relation);

    const relationQueryBuilder = new ModelQueryBuilder<
      RelatedInstance<T, RelationKey>
    >(modelRelation.model, this.sqlDataSource);

    relationQueryBuilder.relation = modelRelation;
    cb?.(
      relationQueryBuilder as unknown as RelationQueryBuilderType<
        RelatedInstance<T, RelationKey>
      >,
    );
    this.relationQueryBuilders.push(relationQueryBuilder);

    return this as unknown as ModelQueryBuilder<
      T,
      A,
      R & {
        [K in RelationKey]: Awaited<
          ReturnType<
            ModelQueryBuilder<
              RelatedInstance<T, K>,
              IA,
              IR
            >[RelationRetrieveMethod<T[K]>]
          >
        >;
      }
    >;
  }

  /**
   * @description Clears the relations from the query builder
   */
  clearRelations(): this {
    this.relationQueryBuilders = [];
    return this;
  }

  // #region Relation filters

  /**
   * @description Checks if the relation exists in the models and has the given filters, if no callback is provided, it only check if there is at least one record for the relation
   * @warning All select statements are ignored, since we're only checking if the relation exists, a "select 1" will be added to the Query
   */
  havingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
    ) => void,
  ): this;
  havingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    operatorOrValue?: BinaryOperatorType | BaseValues,
    maybeValue?: BaseValues,
  ): this;
  havingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cbOrOperatorOrValue?:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | BinaryOperatorType
      | BaseValues,
    maybeValue?: BaseValues,
  ): this {
    return this.andHavingRelated(
      relation,
      cbOrOperatorOrValue as any,
      maybeValue,
    );
  }

  /**
   * @description Checks if the relation exists in the models and has the given filters, if no callback is provided, it only check if there is at least one record for the relation
   * @warning All select statements are ignored, since we're only checking if the relation exists, a "select 1" will be added to the Query
   */
  andHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
    ) => void,
  ): this;
  andHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    operatorOrValue?: BinaryOperatorType | BaseValues,
    maybeValue?: BaseValues,
  ): this;
  andHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cbOrOperatorOrValue?:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | BinaryOperatorType
      | BaseValues,
    maybeValue?: BaseValues,
  ): this {
    let actualValue: BaseValues | undefined;
    let actualOperator: BinaryOperatorType | undefined;
    let cb:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | undefined;

    if (typeof cbOrOperatorOrValue === "function") {
      cb = cbOrOperatorOrValue as (
        queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
      ) => void;
    } else if (
      typeof cbOrOperatorOrValue === "string" &&
      maybeValue !== undefined
    ) {
      actualOperator = cbOrOperatorOrValue as BinaryOperatorType;
      actualValue = maybeValue;
    } else if (cbOrOperatorOrValue !== undefined) {
      actualValue = cbOrOperatorOrValue as BaseValues;
      actualOperator = "=";
    }

    const modelRelation =
      this.sqlModelManagerUtils.getRelationFromModel(relation);
    const modelQueryBuilder = new ModelQueryBuilder<
      RelatedInstance<T, RelationKey>
    >(modelRelation.model, this.sqlDataSource);
    modelQueryBuilder.relation = modelRelation;

    const relationQueryBuilder = this.getRelatedModelsQueryForRelation(
      modelQueryBuilder,
      modelRelation,
      [],
    );

    // We clear where in order to apply having relation filter, since we're passing an empty array, by default will be a false condition so we need to clear it
    relationQueryBuilder.clearWhere();
    relationQueryBuilder.clearSelect();
    relationQueryBuilder.selectRaw("1");

    cb?.(
      relationQueryBuilder as unknown as ModelQueryBuilder<
        RelatedInstance<T, RelationKey>
      >,
    );

    this.applyHavingRelatedFilter(
      relationQueryBuilder,
      modelRelation,
      actualOperator,
      actualValue,
    );

    this.whereExists(
      relationQueryBuilder as unknown as (
        queryBuilder: QueryBuilder<T>,
      ) => void | QueryBuilder<T>,
    );

    return this;
  }

  /**
   * @description Checks if the relation exists in the models and has the given filters, if no callback is provided, it only check if there is at least one record for the relation,
   * @warning All select statements are ignored, since we're only checking if the relation exists, a "select 1" will be added to the Query
   */
  orHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
    ) => void,
  ): this;
  orHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    operatorOrValue?: BinaryOperatorType | BaseValues,
    maybeValue?: BaseValues,
  ): this;
  orHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cbOrOperatorOrValue?:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | BinaryOperatorType
      | BaseValues,
    maybeValue?: BaseValues,
  ): this {
    let actualValue: BaseValues | undefined;
    let actualOperator: BinaryOperatorType | undefined;
    let cb:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | undefined;

    if (typeof cbOrOperatorOrValue === "function") {
      cb = cbOrOperatorOrValue as (
        queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
      ) => void;
    } else if (
      typeof cbOrOperatorOrValue === "string" &&
      maybeValue !== undefined
    ) {
      actualOperator = cbOrOperatorOrValue as BinaryOperatorType;
      actualValue = maybeValue;
    } else if (cbOrOperatorOrValue !== undefined) {
      actualValue = cbOrOperatorOrValue as BaseValues;
      actualOperator = "=";
    }

    const modelRelation =
      this.sqlModelManagerUtils.getRelationFromModel(relation);
    const modelQueryBuilder = new ModelQueryBuilder<
      RelatedInstance<T, RelationKey>
    >(modelRelation.model, this.sqlDataSource);
    modelQueryBuilder.relation = modelRelation;

    const relationQueryBuilder = this.getRelatedModelsQueryForRelation(
      modelQueryBuilder,
      modelRelation,
      [],
    );

    // We clear where in order to apply having relation filter, since we're passing an empty array, by default will be a false condition so we need to clear it
    relationQueryBuilder.clearWhere();
    relationQueryBuilder.clearSelect();
    relationQueryBuilder.selectRaw("1");

    cb?.(
      relationQueryBuilder as unknown as ModelQueryBuilder<
        RelatedInstance<T, RelationKey>
      >,
    );

    this.applyHavingRelatedFilter(
      relationQueryBuilder,
      modelRelation,
      actualOperator,
      actualValue,
    );

    this.orWhereExists(
      relationQueryBuilder as unknown as (
        queryBuilder: QueryBuilder<T>,
      ) => void | QueryBuilder<T>,
    );

    return this;
  }

  /**
   * @description Checks if the relation does not exist in the models and has the given filters, if no callback is provided, it only check if there is no record for the Relation
   * @warning All select statements are ignored, since we're only checking if the relation exists, a "select 1" will be added to the Query
   */
  notHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
    ) => void,
  ): this;
  notHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    operatorOrValue?: BinaryOperatorType | BaseValues,
    maybeValue?: BaseValues,
  ): this;
  notHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cbOrOperatorOrValue?:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | BinaryOperatorType
      | BaseValues,
    maybeValue?: BaseValues,
  ): this {
    return this.andNotHavingRelated(
      relation,
      cbOrOperatorOrValue as any,
      maybeValue,
    );
  }

  /**
   * @description Checks if the relation does not exist in the models and has the given filters, if no callback is provided, it only check if there is no record for the relation
   * @warning All select statements are ignored, since we're only checking if the relation exists, a "select 1" will be added to the Query
   */
  andNotHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
    ) => void,
  ): this;
  andNotHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    operatorOrValue?: BinaryOperatorType | BaseValues,
    maybeValue?: BaseValues,
  ): this;
  andNotHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cbOrOperatorOrValue?:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | BinaryOperatorType
      | BaseValues,
    maybeValue?: BaseValues,
  ): this {
    let actualValue: BaseValues | undefined;
    let actualOperator: BinaryOperatorType | undefined;
    let cb:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | undefined;

    if (typeof cbOrOperatorOrValue === "function") {
      cb = cbOrOperatorOrValue as (
        queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
      ) => void;
    } else if (
      typeof cbOrOperatorOrValue === "string" &&
      maybeValue !== undefined
    ) {
      actualOperator = cbOrOperatorOrValue as BinaryOperatorType;
      actualValue = maybeValue;
    } else if (cbOrOperatorOrValue !== undefined) {
      actualValue = cbOrOperatorOrValue as BaseValues;
      actualOperator = "=";
    }

    const modelRelation =
      this.sqlModelManagerUtils.getRelationFromModel(relation);
    const modelQueryBuilder = new ModelQueryBuilder<
      RelatedInstance<T, RelationKey>
    >(modelRelation.model, this.sqlDataSource);
    modelQueryBuilder.relation = modelRelation;

    const relationQueryBuilder = this.getRelatedModelsQueryForRelation(
      modelQueryBuilder,
      modelRelation,
      [],
    );

    // We clear where in order to apply having relation filter, since we're passing an empty array, by default will be a false condition so we need to clear it
    relationQueryBuilder.clearWhere();
    relationQueryBuilder.clearSelect();
    relationQueryBuilder.selectRaw("1");

    cb?.(
      relationQueryBuilder as unknown as ModelQueryBuilder<
        RelatedInstance<T, RelationKey>
      >,
    );

    this.applyHavingRelatedFilter(
      relationQueryBuilder,
      modelRelation,
      actualOperator,
      actualValue,
    );

    this.whereNotExists(
      relationQueryBuilder as unknown as (
        queryBuilder: QueryBuilder<T>,
      ) => void | QueryBuilder<T>,
    );

    return this;
  }

  /**
   * @description Checks if the relation does not exist in the models and has the given filters, if no callback is provided, it only check if there is no record for the Relation
   * @warning All select statements are ignored, since we're only checking if the relation exists, a "select 1" will be added to the Query
   */
  orNotHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cb?: (
      queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
    ) => void,
  ): this;
  orNotHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    operatorOrValue?: BinaryOperatorType | BaseValues,
    maybeValue?: BaseValues,
  ): this;
  orNotHavingRelated<RelationKey extends ModelRelation<T>>(
    relation: RelationKey,
    cbOrOperatorOrValue?:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | BinaryOperatorType
      | BaseValues,
    maybeValue?: BaseValues,
  ): this {
    let actualValue: BaseValues | undefined;
    let actualOperator: BinaryOperatorType | undefined;
    let cb:
      | ((
          queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
        ) => void)
      | undefined;

    if (typeof cbOrOperatorOrValue === "function") {
      cb = cbOrOperatorOrValue as (
        queryBuilder: ModelQueryBuilder<RelatedInstance<T, RelationKey>>,
      ) => void;
    } else if (
      typeof cbOrOperatorOrValue === "string" &&
      maybeValue !== undefined
    ) {
      actualOperator = cbOrOperatorOrValue as BinaryOperatorType;
      actualValue = maybeValue;
    } else if (cbOrOperatorOrValue !== undefined) {
      actualValue = cbOrOperatorOrValue as BaseValues;
      actualOperator = "=";
    }

    const modelRelation =
      this.sqlModelManagerUtils.getRelationFromModel(relation);
    const modelQueryBuilder = new ModelQueryBuilder<
      RelatedInstance<T, RelationKey>
    >(modelRelation.model, this.sqlDataSource);
    modelQueryBuilder.relation = modelRelation;

    const relationQueryBuilder = this.getRelatedModelsQueryForRelation(
      modelQueryBuilder,
      modelRelation,
      [],
    );

    // We clear where in order to apply having relation filter, since we're passing an empty array, by default will be a false condition so we need to clear it
    relationQueryBuilder.clearWhere();
    relationQueryBuilder.clearSelect();
    relationQueryBuilder.selectRaw("1");

    cb?.(
      relationQueryBuilder as unknown as ModelQueryBuilder<
        RelatedInstance<T, RelationKey>
      >,
    );

    this.applyHavingRelatedFilter(
      relationQueryBuilder,
      modelRelation,
      actualOperator,
      actualValue,
    );

    this.orWhereNotExists(
      relationQueryBuilder as unknown as (
        queryBuilder: QueryBuilder<T>,
      ) => void | QueryBuilder<T>,
    );

    return this;
  }

  // #endregion

  /**
   * @description Returns a copy of the query builder instance.
   */
  override clone(): this {
    const queryBuilder = super.clone();
    queryBuilder.relationQueryBuilders = deepCloneNode(
      this.relationQueryBuilders,
    );
    return queryBuilder;
  }

  /**
   * @description Recursively processes all relations, including nested ones
   */
  protected async processRelationsRecursively(models: T[]): Promise<void> {
    await Promise.all(
      this.relationQueryBuilders
        .filter(
          (relationQueryBuilder) => relationQueryBuilder.isRelationQueryBuilder,
        )
        .map(async (relationQueryBuilder) => {
          const relatedModels = await this.getRelatedModelsForRelation(
            relationQueryBuilder,
            relationQueryBuilder.relation,
            models,
          );

          this.mapRelatedModelsToModels(
            relationQueryBuilder.relation,
            models,
            relatedModels,
          );
        }),
    );
  }

  protected mapRelatedModelsToModels<R extends ModelWithoutRelations<T>>(
    relation: Relation,
    modelsToFillWithRelations: T[],
    relatedModels: R[],
  ): void {
    switch (relation.type) {
      case RelationEnum.hasOne:
        if (!this.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::mapRelatedModelsToModels::hasOne",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const relatedModelsMap = new Map<string, R>();

        relatedModels.forEach((relatedModel) => {
          const foreignKeyValue = relatedModel[relation.foreignKey as keyof R];
          if (foreignKeyValue) {
            relatedModelsMap.set(String(foreignKeyValue), relatedModel);
          }
        });

        modelsToFillWithRelations.forEach((modelToFillWithRelation) => {
          const primaryKeyValue =
            modelToFillWithRelation[this.model.primaryKey as keyof T];
          if (!primaryKeyValue) {
            modelToFillWithRelation[relation.columnName as keyof T] =
              null as T[keyof T];
            return;
          }

          const relatedModel = relatedModelsMap.get(String(primaryKeyValue));
          modelToFillWithRelation[relation.columnName as keyof T] =
            (relatedModel || null) as T[keyof T];
        });

        break;
      case RelationEnum.belongsTo:
        const relatedModelsByKey = new Map<string, R>();

        relatedModels.forEach((relatedModel) => {
          if (!relation.model.primaryKey) {
            throw new HysteriaError(
              this.model.name + "::mapRelatedModelsToModels::belongsTo",
              `RELATED_MODEL_DOES_NOT_HAVE_A_PRIMARY_KEY_${relation.model.name}` as const,
            );
          }

          const primaryKeyValue =
            relatedModel[relation.model.primaryKey as keyof R];
          if (primaryKeyValue) {
            relatedModelsByKey.set(String(primaryKeyValue), relatedModel);
          }
        });

        modelsToFillWithRelations.forEach((modelToFillWithRelation) => {
          const foreignKeyValue =
            modelToFillWithRelation[relation.foreignKey as keyof T];
          if (!foreignKeyValue) {
            modelToFillWithRelation[relation.columnName as keyof T] =
              null as T[keyof T];
            return;
          }

          const relatedModel = relatedModelsByKey.get(String(foreignKeyValue));
          modelToFillWithRelation[relation.columnName as keyof T] =
            (relatedModel || null) as T[keyof T];
        });

        break;
      case RelationEnum.hasMany:
        if (!this.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::mapRelatedModelsToModels::hasMany",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const relatedModelsGroupedByForeignKey = new Map<string, R[]>();

        relatedModels.forEach((relatedModel) => {
          const foreignKeyValue = relatedModel[relation.foreignKey as keyof R];
          if (!foreignKeyValue) return;

          const foreignKeyStr = String(foreignKeyValue);
          if (!relatedModelsGroupedByForeignKey.has(foreignKeyStr)) {
            relatedModelsGroupedByForeignKey.set(foreignKeyStr, []);
          }

          relatedModelsGroupedByForeignKey
            .get(foreignKeyStr)!
            .push(relatedModel);
        });

        modelsToFillWithRelations.forEach((modelToFillWithRelation) => {
          const primaryKeyValue =
            modelToFillWithRelation[this.model.primaryKey as keyof T];
          if (!primaryKeyValue) {
            modelToFillWithRelation[relation.columnName as keyof T] =
              [] as T[keyof T];
            return;
          }

          const relatedModelsList =
            relatedModelsGroupedByForeignKey.get(String(primaryKeyValue)) || [];
          modelToFillWithRelation[relation.columnName as keyof T] =
            relatedModelsList as T[keyof T];
        });

        break;
      case RelationEnum.manyToMany:
        if (!this.model.primaryKey || !relation.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::mapRelatedModelsToModels::manyToMany",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const manyToManyRelation = relation as ManyToMany;
        const relatedModelsMapManyToMany = new Map<string, R[]>();
        const relatedPrimaryKey = manyToManyRelation.leftForeignKey;
        const casedRelatedPrimaryKey =
          this.modelColumnsMap.get(relatedPrimaryKey) ||
          this.modelColumnsDatabaseNames.get(relatedPrimaryKey) ||
          convertCase(relatedPrimaryKey, this.model.modelCaseConvention);

        relatedModels.forEach((relatedModel) => {
          const annotations = (relatedModel as any).$annotations || {};
          const foreignKeyValue = annotations[casedRelatedPrimaryKey];
          if (foreignKeyValue === undefined || foreignKeyValue === null) {
            return;
          }

          const foreignKeyStr = String(foreignKeyValue);
          if (!relatedModelsMapManyToMany.has(foreignKeyStr)) {
            relatedModelsMapManyToMany.set(foreignKeyStr, []);
          }

          if (!this.modelAnnotatedColumns.includes(casedRelatedPrimaryKey)) {
            delete annotations[casedRelatedPrimaryKey];
            if (!Object.keys(annotations).length) {
              delete (relatedModel as any).$annotations;
            }
          }

          relatedModelsMapManyToMany.get(foreignKeyStr)!.push(relatedModel);
        });

        modelsToFillWithRelations.forEach((modelToFillWithRelation) => {
          const primaryKeyValue =
            modelToFillWithRelation[this.model.primaryKey as keyof T];
          if (!primaryKeyValue) {
            modelToFillWithRelation[relation.columnName as keyof T] =
              [] as T[keyof T];
            return;
          }

          const relatedModelsList =
            relatedModelsMapManyToMany.get(String(primaryKeyValue)) || [];
          modelToFillWithRelation[relation.columnName as keyof T] =
            relatedModelsList as T[keyof T];
        });

        break;
      default:
        throw new HysteriaError(
          this.model.name + "::mapRelatedModelsToModels",
          "UNSUPPORTED_RELATION_TYPE",
        );
    }
  }

  protected async getRelatedModelsForRelation(
    relationQueryBuilder: ModelQueryBuilder<any>,
    relation: Relation,
    models: T[],
  ): Promise<ModelWithoutRelations<T>[]> {
    return this.getRelatedModelsQueryForRelation(
      relationQueryBuilder,
      relation,
      models,
    ).many();
  }

  protected getRelatedModelsQueryForRelation(
    relationQueryBuilder: ModelQueryBuilder<any>,
    relation: Relation,
    models: T[],
  ): ModelQueryBuilder<T> {
    const filterValues = this.getFilterValuesFromModelsForRelation(
      relation,
      models,
    );

    switch (relation.type) {
      case RelationEnum.belongsTo:
      case RelationEnum.hasOne:
        return relationQueryBuilder.whereIn(
          relationQueryBuilder.relation.type === RelationEnum.belongsTo
            ? relation.model.primaryKey!
            : (relation.foreignKey as string),
          filterValues,
        );
      case RelationEnum.hasMany:
        const limit = relationQueryBuilder.limitNode?.limit;
        const offset = relationQueryBuilder.offsetNode?.offset;
        if (!limit && !offset) {
          return relationQueryBuilder.whereIn(
            relationQueryBuilder.relation.type === RelationEnum.belongsTo
              ? relation.model.primaryKey!
              : (relation.foreignKey as string),
            filterValues,
          );
        }

        const rn = crypto.randomBytes(6).toString("hex");
        const withTableName = `${relation.model.table}_cte_${rn}`;
        const orderByClause = relationQueryBuilder.orderByNodes
          .map((orderByNode) => {
            if (orderByNode.isRawValue) {
              return orderByNode.column;
            }

            return `${this.interpreterUtils.formatStringColumn(this.dbType, orderByNode.column)} ${orderByNode.direction}`;
          })
          .join(", ") || ["1"];

        relationQueryBuilder.clearLimit();
        relationQueryBuilder.clearOffset();

        const qb = relationQueryBuilder.with(withTableName, (cteQb) =>
          cteQb
            .select(...relationQueryBuilder.modelSelectedColumns)
            .selectRaw(
              `ROW_NUMBER() OVER (PARTITION BY ${this.interpreterUtils.formatStringColumn(this.dbType, relation.foreignKey!)} ORDER BY ${orderByClause}) as rn_${rn}`,
            )
            .whereIn(relation.foreignKey as string, filterValues),
        );

        if (limit) {
          qb.whereRaw(`rn_${rn} <= ${limit + (offset || 0)}`);
        }

        if (offset) {
          qb.whereRaw(`rn_${rn} > ${offset}`);
        }

        const outerSelectedColumnsHasMany =
          relationQueryBuilder.modelSelectedColumns.map((column) =>
            remapSelectedColumnToFromAlias(
              column,
              withTableName,
              relationQueryBuilder.model.table,
            ),
          );

        return qb.select(...outerSelectedColumnsHasMany).from(withTableName);
      case RelationEnum.manyToMany:
        if (!this.model.primaryKey || !relation.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::getRelatedModelsForRelation",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const manyToManyRelation = relation as ManyToMany;
        if (!models.length) {
          return relationQueryBuilder;
        }

        const m2mLimit = relationQueryBuilder.limitNode?.limit;
        const m2mOffset = relationQueryBuilder.offsetNode?.offset;
        const m2mSelectedColumns = relationQueryBuilder.modelSelectedColumns
          .length
          ? relationQueryBuilder.modelSelectedColumns.map((column) =>
              column.includes(".")
                ? column
                : `${relation.model.table}.${column}`,
            )
          : [`${relation.model.table}.*`];

        if (!m2mLimit && !m2mOffset) {
          return relationQueryBuilder
            .select(...m2mSelectedColumns)
            .annotate(
              `${manyToManyRelation.throughModel}.${manyToManyRelation.leftForeignKey}`,
              manyToManyRelation.leftForeignKey,
            )
            .leftJoin(
              manyToManyRelation.throughModel,
              `${manyToManyRelation.relatedModel}.${manyToManyRelation.model.primaryKey}`,
              `${manyToManyRelation.throughModel}.${manyToManyRelation.rightForeignKey}`,
            )
            .whereIn(
              `${manyToManyRelation.throughModel}.${manyToManyRelation.leftForeignKey}`,
              filterValues,
            );
        }

        const rnM2m = crypto.randomBytes(6).toString("hex");
        const withTableNameM2m = `${relation.model.table}_cte_${rnM2m}`;
        const orderByClauseM2m = relationQueryBuilder.orderByNodes
          .map((orderByNode) => {
            if (orderByNode.isRawValue) {
              return orderByNode.column;
            }

            const column = orderByNode.column.includes(".")
              ? orderByNode.column
              : `${relation.model.table}.${orderByNode.column}`;
            return `${this.interpreterUtils.formatStringColumn(this.dbType, column)} ${orderByNode.direction}`;
          })
          .join(", ") || ["1"];

        relationQueryBuilder.clearLimit();
        relationQueryBuilder.clearOffset();
        relationQueryBuilder.clearOrderBy();

        const cteLeftForeignKey = `${crypto.randomBytes(6).toString("hex")}_left_foreign_key`;
        const qbM2m = relationQueryBuilder.with(withTableNameM2m, (innerQb) =>
          innerQb
            .select(...m2mSelectedColumns)
            .annotate(
              `${manyToManyRelation.throughModel}.${manyToManyRelation.leftForeignKey}`,
              cteLeftForeignKey,
            )
            .selectRaw(
              `ROW_NUMBER() OVER (PARTITION BY ${manyToManyRelation.throughModel}.${this.interpreterUtils.formatStringColumn(this.dbType, manyToManyRelation.leftForeignKey)} ORDER BY ${orderByClauseM2m}) as rn_${rnM2m}`,
            )
            .leftJoin(
              manyToManyRelation.throughModel,
              `${manyToManyRelation.relatedModel}.${manyToManyRelation.model.primaryKey}`,
              `${manyToManyRelation.throughModel}.${manyToManyRelation.rightForeignKey}`,
            )
            .whereIn(
              `${manyToManyRelation.throughModel}.${manyToManyRelation.leftForeignKey}`,
              filterValues,
            ),
        );

        if (m2mLimit) {
          qbM2m.whereRaw(`rn_${rnM2m} <= ${m2mLimit + (m2mOffset || 0)}`);
        }

        if (m2mOffset) {
          qbM2m.whereRaw(`rn_${rnM2m} > ${m2mOffset}`);
        }

        const outerSelectedColumns = m2mSelectedColumns.map((column) =>
          remapSelectedColumnToFromAlias(
            column,
            withTableNameM2m,
            relationQueryBuilder.model.table,
          ),
        );

        return qbM2m
          .select(...outerSelectedColumns)
          .annotate(
            `${withTableNameM2m}.${cteLeftForeignKey}`,
            manyToManyRelation.leftForeignKey,
          )
          .from(withTableNameM2m);
      default:
        throw new HysteriaError(
          this.model.name + "::getRelatedModelsForRelation",
          "UNSUPPORTED_RELATION_TYPE",
        );
    }
  }

  protected getFilterValuesFromModelsForRelation(
    relation: Relation,
    models: T[],
  ): any[] {
    switch (relation.type) {
      case RelationEnum.hasMany:
      case RelationEnum.hasOne:
        if (!this.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::getFilterValuesFromModelsForRelation",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        return models.map((model) => model[this.model.primaryKey as keyof T]);
      case RelationEnum.belongsTo:
        return models.map((model) => model[relation.foreignKey as keyof T]);
      case RelationEnum.manyToMany:
        if (!this.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::getFilterValuesFromModelsForRelation",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        return models.map((model) => model[this.model.primaryKey as keyof T]);
      default:
        throw new HysteriaError(
          this.model.name + "::getFilterValuesFromModelsForRelation",
          "UNSUPPORTED_RELATION_TYPE",
        );
    }
  }

  protected applyHavingRelatedFilter(
    relationQueryBuilder: ModelQueryBuilder<any>,
    relation: Relation,
    operator?: BinaryOperatorType,
    value?: BaseValues,
  ): void {
    const relatedInterpreter = new InterpreterUtils(relation.model);
    const outerInterpreter = new InterpreterUtils(this.model);
    const dbType = this.dbType;

    switch (relation.type) {
      case RelationEnum.hasOne:
      case RelationEnum.hasMany: {
        if (!this.model.primaryKey || !relation.foreignKey) {
          throw new HysteriaError(
            this.model.name + "::applyHavingRelatedFilter",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const left = relatedInterpreter.formatStringColumn(
          dbType,
          `${relation.model.table}.${relation.foreignKey}`,
        );

        const right = outerInterpreter.formatStringColumn(
          dbType,
          `${this.model.table}.${this.model.primaryKey}`,
        );

        relationQueryBuilder.whereRaw(`${left} = ${right}`);

        if (operator && typeof value === "number") {
          relationQueryBuilder
            .groupByRaw(left)
            .andHavingRaw(`count(*) ${operator} ${value}`);
        }
        return;
      }
      case RelationEnum.belongsTo: {
        if (!relation.model.primaryKey || !relation.foreignKey) {
          throw new HysteriaError(
            this.model.name + "::applyHavingRelatedFilter",
            `RELATED_MODEL_DOES_NOT_HAVE_A_PRIMARY_KEY_${relation.model.name}` as const,
          );
        }

        const left = relatedInterpreter.formatStringColumn(
          dbType,
          `${relation.model.table}.${relation.model.primaryKey}`,
        );
        const right = outerInterpreter.formatStringColumn(
          dbType,
          `${this.model.table}.${relation.foreignKey}`,
        );

        relationQueryBuilder.whereRaw(`${left} = ${right}`);

        if (operator && typeof value === "number") {
          relationQueryBuilder
            .groupByRaw(left)
            .andHavingRaw(`count(*) ${operator} ${value}`);
        }
        return;
      }
      case RelationEnum.manyToMany: {
        const m2m = relation as ManyToMany;
        if (!this.model.primaryKey || !relation.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::applyHavingRelatedFilter",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const hasThroughJoin = relationQueryBuilder.joinNodes?.some(
          (jn) =>
            !jn.isRawValue &&
            jn.table === m2m.throughModel &&
            jn.type === "left",
        );

        if (!hasThroughJoin) {
          relationQueryBuilder.leftJoin(
            m2m.throughModel,
            `${m2m.relatedModel}.${relation.model.primaryKey}`,
            `${m2m.throughModel}.${m2m.rightForeignKey}`,
          );
        }

        const throughLeft = outerInterpreter.formatStringColumn(
          dbType,
          `${m2m.throughModel}.${m2m.leftForeignKey}`,
        );
        const outerPk = outerInterpreter.formatStringColumn(
          dbType,
          `${this.model.table}.${this.model.primaryKey}`,
        );

        relationQueryBuilder.whereRaw(`${throughLeft} = ${outerPk}`);

        if (operator && typeof value === "number") {
          relationQueryBuilder
            .groupByRaw(throughLeft)
            .andHavingRaw(`count(*) ${operator} ${value}`);
        }
        return;
      }
      default:
        throw new HysteriaError(
          this.model.name + "::applyHavingRelatedFilter",
          "UNSUPPORTED_RELATION_TYPE",
        );
    }
  }

  protected addAdditionalColumnsToModel(
    row: any,
    typeofModel: typeof Model,
  ): Record<string, any> {
    const model: Record<string, any> = {};
    const $annotations: Record<string, any> = {};
    Object.entries(row).forEach(([key, value]) => {
      if (key === "$annotations" || this.modelColumnsDatabaseNames.get(key)) {
        model[key] = value;
        return;
      }

      $annotations[convertCase(key, typeofModel.modelCaseConvention)] = value;
    });

    model.$annotations = $annotations;
    return model;
  }

  // @ts-expect-error
  private async manyWithPerformance(
    options: ManyOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: AnnotatedModel<T, A, R>[];
    time: number;
  }> {
    const [time, data] = await withPerformance(
      this.many.bind(this, options),
      returnType,
    )();

    return { data, time: Number(time) };
  }

  // @ts-expect-error
  private async oneWithPerformance(
    options: OneOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: AnnotatedModel<T, A, R> | null;
    time: number;
  }> {
    const [time, data] = await withPerformance(
      this.one.bind(this, options),
      returnType,
    )();

    return { data, time: Number(time) };
  }

  // @ts-expect-error
  private async oneOrFailWithPerformance(
    options: OneOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: AnnotatedModel<T, A, R>;
    time: number;
  }> {
    const [time, data] = await withPerformance(
      this.oneOrFail.bind(this, options),
      returnType,
    )();

    return { data, time: Number(time) };
  }

  // @ts-expect-error
  private async firstOrFailWithPerformance(
    options: OneOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: AnnotatedModel<T, A, R>;
    time: number;
  }> {
    return this.oneOrFailWithPerformance(options, returnType);
  }

  // @ts-expect-error
  private async firstWithPerformance(
    options: OneOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: AnnotatedModel<T, A, R> | null;
    time: number;
  }> {
    return this.oneWithPerformance(options, returnType);
  }

  // @ts-expect-error
  private async paginateWithPerformance(
    page: number,
    perPage: number,
    options?: { ignoreHooks?: boolean },
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: PaginatedData<T, A, R>;
    time: number;
  }> {
    const { ignoreHooks = false } = options || {};
    const [time, data] = await withPerformance(
      this.paginate.bind(this, page, perPage, { ignoreHooks }),
      returnType,
    )();

    return {
      data: {
        paginationMetadata: data.paginationMetadata,
        data: data.data,
      },
      time: Number(time),
    };
  }

  private async paginateWithCursorWithPerformance(
    page: number,
    options: PaginateWithCursorOptions<T, ModelKey<T>>,
    cursor?: Cursor<T, ModelKey<T>>,
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: [CursorPaginatedData<T, A, R>, Cursor<T, ModelKey<T>>];
    time: number;
  }> {
    const [time, data] = await withPerformance(
      this.paginateWithCursor.bind(this, page, options, cursor),
      returnType,
    )();

    return {
      data: data as [CursorPaginatedData<T, A, R>, Cursor<T, ModelKey<T>>],
      time: Number(time),
    };
  }

  private async existsWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, data] = await withPerformance(
      this.exists.bind(this),
      returnType,
    )();

    return {
      data,
      time: Number(time),
    };
  }

  private async pluckWithPerformance(
    key: ModelKey<T>,
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, data] = await withPerformance(
      this.pluck.bind(this, key),
      returnType,
    )();

    return {
      data,
      time: Number(time),
    };
  }

  private async softDeleteWithPerformance(
    options: Omit<SoftDeleteOptions<T>, "ignoreBeforeDeleteHook"> = {},
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, data] = await withPerformance(
      this.softDelete.bind(this, options),
      returnType,
    )();

    return {
      data,
      time: Number(time),
    };
  }

  // @ts-expect-error
  private async updateWithPerformance(
    data: Partial<ModelWithoutRelations<T>>,
    options: UpdateOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, result] = await withPerformance(
      this.update.bind(this, data, options),
      returnType,
    )();

    return {
      data: result,
      time: Number(time),
    };
  }

  private async deleteWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, result] = await withPerformance(
      this.delete.bind(this),
      returnType,
    )();

    return {
      data: result,
      time: Number(time),
    };
  }

  private async truncateWithPerformance(
    returnType: "millis" | "seconds" = "millis",
  ) {
    const [time, result] = await withPerformance(
      this.truncate.bind(this),
      returnType,
    )();

    return {
      data: result,
      time: Number(time),
    };
  }
}
