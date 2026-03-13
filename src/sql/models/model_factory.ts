import { FactoryReturnType } from "../../../test/sql/test_models/factory/factory_types";
import { SqlDataSource } from "../sql_data_source";
import type { AnyModelConstructor } from "./define_model_types";
import { Model } from "./model";
import { ModelQueryBuilder } from "./model_query_builder/model_query_builder";
import { ModelWithoutRelations } from "./model_types";

class ModelFactory<M extends Model> {
  private typeofModel: AnyModelConstructor;
  private sqlDataSource: SqlDataSource;
  private modelData: Partial<M>;

  /**
   * @description Constructor for the model factory
   */
  constructor(
    sqlDataSource: SqlDataSource,
    typeofModel: AnyModelConstructor,
    modelData: Partial<M>,
  ) {
    this.sqlDataSource = sqlDataSource;
    this.typeofModel = typeofModel;
    this.modelData = modelData;
  }

  /**
   * @description Merges the provided data with the model data
   */
  merge(modelData: Partial<ModelWithoutRelations<M>>) {
    this.modelData = {
      ...this.modelData,
      ...modelData,
    };
  }

  private getQueryBuilder(): ModelQueryBuilder<M> {
    return new ModelQueryBuilder<M>(
      this.typeofModel as unknown as typeof Model,
      this.sqlDataSource,
    );
  }

  /**
   * @description Create a model
   * @param howMany - The number of models to create
   * @returns The created model(s) where howMany = 1 returns a single model and howMany !== 1 returns an array of models
   */
  async create<T extends number>(howMany: T): Promise<FactoryReturnType<T, M>> {
    if (howMany <= 0) {
      return [] as unknown as FactoryReturnType<T, M>;
    }

    const qb = this.getQueryBuilder();

    if (howMany === 1) {
      return (await qb.insert(this.modelData, {
        returning: ["*"],
      })) as unknown as FactoryReturnType<T, M>;
    }

    const array = Array.from({ length: howMany });
    return (await qb.insertMany(
      array.map(() => ({
        ...this.modelData,
      })),
      { returning: ["*"] },
    )) as unknown as FactoryReturnType<T, M>;
  }
}

export const defineModelFactory = <M extends Model>(
  sqlDataSource: SqlDataSource,
  typeofModel: AnyModelConstructor,
  modelData: Partial<ModelWithoutRelations<M>>,
) => {
  return new ModelFactory<M>(sqlDataSource, typeofModel, modelData as M);
};
