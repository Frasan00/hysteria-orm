import crypto from "node:crypto";
import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import { withPerformance } from "../../../utils/performance";
import { SelectNode } from "../../ast/query/node/select/basic_select";
import type { SqlMethod } from "../../ast/query/node/select/select_types";
import { getModelColumns } from "../../models/decorators/model_decorators";
import { Model } from "../../models/model";
import type {
  ModelKey,
  ModelRelation,
} from "../../models/model_manager/model_manager_types";
import SqlModelManagerUtils from "../../models/model_manager/model_manager_utils";
import { getPaginationMetadata, PaginatedData } from "../../pagination";
import {
  DeleteOptions,
  SoftDeleteOptions,
} from "../../query_builder/delete_query_builder_type";
import { QueryBuilder } from "../../query_builder/query_builder";
import {
  RelationRetrieveMethod,
  SelectableColumn,
} from "../../query_builder/query_builder_types";
import type { UpdateOptions } from "../../query_builder/update_query_builder_types";
import { remapSelectedColumnToFromAlias } from "../../resources/utils";
import { serializeModel } from "../../serializer";
import { SqlDataSource } from "../../sql_data_source";
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

  constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.sqlModelManagerUtils = new SqlModelManagerUtils<T>(
      this.dbType,
      sqlDataSource,
    );
    this.relationQueryBuilders = [];
    this.modelSelectedColumns = [];
    this.modelColumnsMap = new Map<string, ColumnType>();
    this.modelColumnsDatabaseNames = new Map<string, string>();
    const modelColumns = getModelColumns(this.model);
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
    if (options.useConnection) {
      return new ModelQueryBuilder(model, options.useConnection);
    }

    if (options.trx) {
      return new ModelQueryBuilder(model, options.trx.sqlDataSource);
    }

    return new ModelQueryBuilder(model, model.sqlInstance);
  }

  /**
   * @description Executes the query and retrieves the first result.
   */
  async one(options: OneOptions = {}): Promise<AnnotatedModel<T, A, R> | null> {
    const result = await this.limit(1).many(options);
    if (!result || !result.length) {
      return null;
    }

    return result[0];
  }

  /**
   * @alias one
   */
  async first(options?: OneOptions): Promise<AnnotatedModel<T, A, R> | null> {
    return this.one(options);
  }

  /**
   * @description Executes the query and retrieves the first result. Fail if no result is found.
   */
  async oneOrFail(options?: {
    ignoreHooks?: OneOptions["ignoreHooks"] & { customError?: Error };
  }): Promise<AnnotatedModel<T, A, R>> {
    const model = await this.one(options);
    if (!model) {
      throw new HysteriaError(this.model.name + "::oneOrFail", "ROW_NOT_FOUND");
    }

    return model as AnnotatedModel<T, A, R>;
  }

  /**
   * @alias oneOrFail
   */
  async firstOrFail(options?: {
    ignoreHooks?: OneOptions["ignoreHooks"] & { customError?: Error };
  }): Promise<AnnotatedModel<T, A, R>> {
    return this.oneOrFail(options);
  }

  /**
   * @description Executes the query and retrieves multiple results.
   */
  override async many(
    options: ManyOptions = {},
  ): Promise<AnnotatedModel<T, A, R>[]> {
    !options.ignoreHooks?.includes("beforeFetch") &&
      this.model.beforeFetch?.(this);
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
    if (!options.ignoreHooks?.includes("afterFetch")) {
      await this.model.afterFetch?.(serializedModelsArray);
    }

    if (this.relationQueryBuilders.length) {
      await this.processRelationsRecursively(serializedModelsArray);
    }

    return serializedModelsArray as unknown as AnnotatedModel<T, A, R>[];
  }

  /**
   * @description Executes the query and returns true if the query returns at least one result, false otherwise.
   * @description Returns the time that took to execute the query
   */
  // @ts-expect-error
  override async manyWithPerformance(
    options: ManyOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: AnnotatedModel<T, A, R>[];
    time: number;
  }> {
    const [time, data] = await withPerformance(
      this.many.bind(this, options),
      returnType,
    );

    return { data, time: Number(time) };
  }

  /**
   * @description Executes the query and returns true if the query returns at least one result, false otherwise.
   * @description Returns the time that took to execute the query
   */
  // @ts-expect-error
  override async oneWithPerformance(
    options: OneOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: AnnotatedModel<T, A, R> | null;
    time: number;
  }> {
    const [time, data] = await withPerformance(
      this.one.bind(this, options),
      returnType,
    );

    return { data, time: Number(time) };
  }

  /**
   * @description Executes the query and returns true if the query returns at least one result, false otherwise.
   * @description Returns the time that took to execute the query
   */
  // @ts-expect-error
  override async oneOrFailWithPerformance(
    options: OneOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: AnnotatedModel<T, A, R>;
    time: number;
  }> {
    const [time, data] = await withPerformance(
      this.oneOrFail.bind(this, options),
      returnType,
    );

    return { data, time: Number(time) };
  }

  /**
   * @alias oneOrFailWithPerformance
   */
  // @ts-expect-error
  override async firstOrFailWithPerformance(
    options: OneOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: AnnotatedModel<T, A, R>;
    time: number;
  }> {
    return this.oneOrFailWithPerformance(options, returnType);
  }

  /**
   * @alias oneWithPerformance
   */
  // @ts-expect-error
  override async firstWithPerformance(
    options: OneOptions = {},
    returnType: "millis" | "seconds" = "millis",
  ): Promise<{
    data: AnnotatedModel<T, A, R> | null;
    time: number;
  }> {
    return this.oneWithPerformance(options, returnType);
  }

  /**
   * @description Executes the query and returns the paginated data.
   * @description Returns the time that took to execute the query
   */
  // @ts-expect-error
  override async paginateWithPerformance(
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
    );

    return {
      data: {
        paginationMetadata: data.paginationMetadata,
        data: data.data,
      },
      time: Number(time),
    };
  }

  /**
   * @description Updates records in the database for the current query.
   */
  override async update(
    data: Partial<ModelWithoutRelations<T>>,
    options: UpdateOptions = {},
  ): Promise<number> {
    options.ignoreBeforeUpdateHook && this.model.beforeUpdate?.(this);
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
    !ignoreBeforeDeleteHook && this.model.beforeDelete?.(this);
    return super.softDelete(options);
  }

  /**
   * @description Deletes Records from the database for the current query.
   */
  async delete(options: DeleteOptions = {}): Promise<number> {
    options.ignoreBeforeDeleteHook && this.model.beforeDelete?.(this);
    return super.delete();
  }

  override async getCount(
    column: string = "*",
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.annotate("count", column, "total");
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch"]
      : [];

    const result = (await this.one({
      ignoreHooks: ignoredHooks,
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
    this.annotate("max", column, "total");
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = (await this.one({ ignoreHooks: ignoredHooks })) as {
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
    this.annotate("min", column, "total");
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = (await this.one({ ignoreHooks: ignoredHooks })) as {
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
    this.annotate("avg", column, "total");
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = (await this.one({ ignoreHooks: ignoredHooks })) as {
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
    this.annotate("sum", column, "total");
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = (await this.one({ ignoreHooks: ignoredHooks })) as {
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
    const originalSelectNodes = this.selectNodes;
    const total = await this.getCount("*", {
      ignoreHooks: options.ignoreHooks,
    });

    this.selectNodes = originalSelectNodes;
    const models = await this.limit(perPage)
      .offset((page - 1) * perPage)
      .many({
        ignoreHooks: options.ignoreHooks ? ["beforeFetch", "afterFetch"] : [],
      });

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
  ): ModelQueryBuilder<T, A & { [P in K]: V }>;
  // @ts-expect-error
  override annotate<
    K extends string,
    S extends SqlMethod,
    V = CommonSqlMethodReturnType<S>,
  >(
    sqlMethod: string,
    column: string,
    alias: K,
  ): ModelQueryBuilder<T, A & { [P in K]: V }>;
  // @ts-expect-error
  override annotate<
    K extends string,
    S extends SqlMethod,
    V = CommonSqlMethodReturnType<S>,
  >(
    sqlMethod: S,
    column: string,
    alias: K,
  ): ModelQueryBuilder<T, A & { [P in K]: V }>;
  // @ts-expect-error
  override annotate<
    K extends string,
    S extends SqlMethod,
    V = CommonSqlMethodReturnType<S>,
  >(
    sqlMethod: S,
    column: string,
    alias: K,
  ): ModelQueryBuilder<T, A & { [P in K]: V }>;
  // @ts-expect-error
  override annotate<
    K extends string,
    S extends SqlMethod,
    V = CommonSqlMethodReturnType<S>,
  >(
    sqlMethodOrColumn: string | S,
    columnOrAlias: string,
    maybeAlias?: string,
  ): ModelQueryBuilder<T, A & { [P in K]: V }> {
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
  withRelation<
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
  withRelation<RelationKey extends ModelRelation<T>>(
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
  withRelation<
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
    const modelRelation = this.sqlModelManagerUtils.getRelationFromModel(
      relation as string,
      this.model,
    );

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

  clearRelations(): this {
    this.relationQueryBuilders = [];
    return this;
  }

  /**
   * @description Returns a copy of the query builder instance.
   */
  override copy(): this {
    const queryBuilder = super.copy();
    queryBuilder.relationQueryBuilders = [...this.relationQueryBuilders];
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
          const relationModel = relationQueryBuilder.relation.model;
          type RelationModel = InstanceType<typeof relationModel>;
          const relatedModels = await this.getRelatedModelsForRelation(
            relationQueryBuilder,
            relationQueryBuilder.relation,
            models,
          );

          this.mapRelatedModelsToModels<RelationModel>(
            relationQueryBuilder.relation,
            models,
            relatedModels,
          );
        }),
    );
  }

  protected mapRelatedModelsToModels<R extends Model>(
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
  ): Promise<T[]> {
    const filterValues = this.getFilterValuesFromModelsForRelation(
      relation,
      models,
    );

    switch (relation.type) {
      case RelationEnum.belongsTo:
      case RelationEnum.hasOne:
        return relationQueryBuilder
          .whereIn(
            relationQueryBuilder.relation.type === RelationEnum.belongsTo
              ? relation.model.primaryKey!
              : (relation.foreignKey as string),
            filterValues,
          )
          .many();
      case RelationEnum.hasMany:
        const limit = relationQueryBuilder.limitNode?.limit;
        const offset = relationQueryBuilder.offsetNode?.offset;
        if (!limit && !offset) {
          return relationQueryBuilder
            .whereIn(
              relationQueryBuilder.relation.type === RelationEnum.belongsTo
                ? relation.model.primaryKey!
                : (relation.foreignKey as string),
              filterValues,
            )
            .many();
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

        return qb
          .select(...outerSelectedColumnsHasMany)
          .from(withTableName)
          .many();
      case RelationEnum.manyToMany:
        if (!this.model.primaryKey || !relation.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::getRelatedModelsForRelation",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const manyToManyRelation = relation as ManyToMany;
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
            )
            .many();
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
          .from(withTableNameM2m)
          .many();
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
}
