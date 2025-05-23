import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
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
import type { UpdateOptions } from "../../query_builder/update_query_builder_types";
import { serializeModel } from "../../serializer";
import { SqlDataSource } from "../../sql_data_source";
import { ColumnType } from "../decorators/model_decorators_types";
import { BaseModelMethodOptions } from "../model_types";
import { ManyToMany } from "../relations/many_to_many";
import { Relation, RelationEnum } from "../relations/relation";
import type {
  FetchHooks,
  ManyOptions,
  OneOptions,
} from "./model_query_builder_types";
import type { RelationQueryBuilderType } from "./relation_query_builder/relation_query_builder_types";

export class ModelQueryBuilder<T extends Model> extends QueryBuilder<T> {
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
   * @description Removes annotations from the serialized model, by default, annotations are maintained in the serialized model
   * @description Annotations are defined from the SQL methods used in the select statements and can be retrieved here `$annotations`
   */
  removeAnnotations(): this {
    this.mustRemoveAnnotations = true;
    return this;
  }

  /**
   * @description This options will add to the final serialized model the annotations
   * @description Annotations are defined from the SQL methods used in the select statements and can be retrieved here `$annotations`
   */
  clearRemoveAnnotations(): this {
    this.mustRemoveAnnotations = true;
    return this;
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
      return this.addAdditionalColumnsToModel(row, this.model);
    });

    if (!models.length) {
      return [];
    }

    const serializedModels = await serializeModel(
      models as T[],
      this.model,
      this.modelSelectedColumns,
      this.mustRemoveAnnotations,
    );

    if (!serializedModels) {
      return [];
    }

    const serializedModelsArray = Array.isArray(serializedModels)
      ? serializedModels
      : [serializedModels];
    if (!options.ignoreHooks?.includes("afterFetch")) {
      await this.model.afterFetch(serializedModelsArray);
    }

    if (this.relationQueryBuilders.length) {
      await this.processRelationsRecursively(serializedModelsArray);
    }

    return serializedModelsArray;
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
    this.annotate("count", column, "total");
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch"]
      : [];

    const result = await this.one({ ignoreHooks: ignoredHooks });
    return result ? +result.$annotations.total : 0;
  }

  /**
   * @description Executes the query and retrieves the maximum value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getMax(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.annotate("max", column, "total");
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = await this.one({ ignoreHooks: ignoredHooks });
    return result ? +result.$annotations.total : 0;
  }

  /**
   * @description Executes the query and retrieves the minimum value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getMin(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.annotate("min", column, "total");
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = await this.one({ ignoreHooks: ignoredHooks });
    return result ? +result.$annotations.total : 0;
  }

  /**
   * @description Executes the query and retrieves the average value of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getAvg(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.annotate("avg", column, "total");
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = await this.one({ ignoreHooks: ignoredHooks });
    return result ? +result.$annotations.total : 0;
  }

  /**
   * @description Executes the query and retrieves the sum of a column, it ignores all select, group by, order by, limit and offset clauses if they are present.
   */
  async getSum(
    column: string,
    options: { ignoreHooks: boolean } = { ignoreHooks: false },
  ): Promise<number> {
    this.annotate("sum", column, "total");
    const ignoredHooks: FetchHooks[] = options.ignoreHooks
      ? ["beforeFetch", "afterFetch"]
      : [];

    const result = await this.one({ ignoreHooks: ignoredHooks });
    return result ? +result.$annotations.total : 0;
  }

  /**
   * @description Executes the query and retrieves multiple paginated results.
   * @description Overrides the limit and offset clauses in order to paginate the results.
   */
  async paginate(
    page: number,
    perPage: number,
    options: ManyOptions = {},
  ): Promise<PaginatedData<T>> {
    const originalSelectQuery = this.selectQuery;
    const total = await this.getCount();
    this.selectQuery = originalSelectQuery;
    const models = await this.limit(perPage)
      .offset((page - 1) * perPage)
      .many(options);

    const paginationMetadata = getPaginationMetadata(page, perPage, total);

    return {
      paginationMetadata,
      data: models,
    } as PaginatedData<T>;
  }

  override select(...columns: string[]): this;
  override select(...columns: (ModelKey<T> | "*")[]): this;
  override select(...columns: (ModelKey<T> | "*" | string)[]): this {
    this.modelSelectedColumns = [
      ...this.modelSelectedColumns,
      ...(columns as string[]),
    ];

    this.selectQuery = this.selectTemplate.selectColumns([
      ...this.modelSelectedColumns,
    ]);

    return this;
  }

  /**
   * @description Fills the relations in the model in the serialized response. Relation must be defined in the model.
   * @warning Many to many relations have special behavior, since they require a join, a join clause will always be added to the query.
   * @warning Many to many relations uses the model foreign key for mapping in the `$annotations` property, this property will be removed from the model after the relation is filled.
   */
  withRelation<O extends typeof Model>(
    relation: ModelRelation<T>,
    _relatedModel?: O,
    cb?: (queryBuilder: RelationQueryBuilderType<InstanceType<O>>) => void,
  ): this {
    const modelRelation = this.sqlModelManagerUtils.getRelationFromModel(
      relation as string,
      this.model,
    );

    const relationQueryBuilder = new ModelQueryBuilder<InstanceType<O>>(
      modelRelation.model,
      this.sqlDataSource,
    );

    relationQueryBuilder.relation = modelRelation;
    cb?.(relationQueryBuilder);
    this.relationQueryBuilders.push(relationQueryBuilder);
    return this;
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
        const relatedPrimaryKey = manyToManyRelation.throughModelForeignKey;
        const casedRelatedPrimaryKey =
          this.modelColumnsMap.get(relatedPrimaryKey) ||
          this.modelColumnsDatabaseNames.get(relatedPrimaryKey) ||
          convertCase(relatedPrimaryKey, this.model.modelCaseConvention);

        relatedModels.forEach((relatedModel) => {
          const foreignKeyValue =
            relatedModel.$annotations[casedRelatedPrimaryKey];
          if (!foreignKeyValue) return;

          const foreignKeyStr = String(foreignKeyValue);
          if (!relatedModelsMapManyToMany.has(foreignKeyStr)) {
            relatedModelsMapManyToMany.set(foreignKeyStr, []);
          }

          if (
            relatedModel.$annotations &&
            relatedModel.$annotations[casedRelatedPrimaryKey] &&
            !this.modelSelectedColumns.includes(casedRelatedPrimaryKey)
          ) {
            delete relatedModel.$annotations[casedRelatedPrimaryKey];
          }

          if (Object.keys(relatedModel.$annotations).length === 0) {
            delete (relatedModel as any).$annotations;
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
      case RelationEnum.hasMany:
      case RelationEnum.hasOne:
        return relationQueryBuilder
          .whereIn(
            relationQueryBuilder.relation.type === RelationEnum.belongsTo
              ? relation.model.primaryKey!
              : (relation.foreignKey as string),
            filterValues,
          )
          .many();
      case RelationEnum.manyToMany:
        if (!this.model.primaryKey || !relation.model.primaryKey) {
          throw new HysteriaError(
            this.model.name + "::getRelatedModelsForRelation",
            "MODEL_HAS_NO_PRIMARY_KEY",
          );
        }

        const manyToManyRelation = relation as ManyToMany;
        return relationQueryBuilder
          .select(`${relation.model.table}.*`)
          .annotate(
            manyToManyRelation.throughModelForeignKey,
            manyToManyRelation.throughModelForeignKey,
          )
          .leftJoin(
            manyToManyRelation.throughModel,
            `${manyToManyRelation.relatedModel}.${manyToManyRelation.model.primaryKey}`,
            `${manyToManyRelation.throughModel}.${manyToManyRelation.relatedModelForeignKey}`,
          )
          .whereIn(
            `${manyToManyRelation.throughModel}.${manyToManyRelation.throughModelForeignKey}`,
            filterValues,
          )
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
