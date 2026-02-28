import { FactoryReturnType } from "../../../test/sql/test_models/factory/factory_types";
import type { AnyModelConstructor } from "./define_model_types";
import { Model } from "./model";
import { ModelWithoutRelations } from "./model_types";

class ModelFactory<M extends Model> {
  private typeofModel: AnyModelConstructor;
  private modelData: Partial<M>;

  /**
   * @description Constructor for the model factory
   */
  constructor(typeofModel: AnyModelConstructor, modelData: Partial<M>) {
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

  /**
   * @description Create a model
   * @param howMany - The number of models to create
   * @returns The created model(s) where howMany = 1 returns a single model and howMany !== 1 returns an array of models
   */
  async create<T extends number>(howMany: T): Promise<FactoryReturnType<T, M>> {
    if (howMany <= 0) {
      return [] as unknown as FactoryReturnType<T, M>;
    }

    const insertModel = this.typeofModel as {
      insert: (
        data: Partial<M>,
        options: { returning: string[] },
      ) => Promise<M>;
      insertMany: (
        data: Partial<M>[],
        options: { returning: string[] },
      ) => Promise<M[]>;
    };

    if (howMany === 1) {
      return (await insertModel.insert(this.modelData, {
        returning: ["*"],
      })) as FactoryReturnType<T, M>;
    }

    const array = Array.from({ length: howMany });
    return (await insertModel.insertMany(
      array.map(() => ({
        ...this.modelData,
      })),
      { returning: ["*"] },
    )) as FactoryReturnType<T, M>;
  }
}

export const createModelFactory = <M extends Model>(
  typeofModel: AnyModelConstructor,
  modelData: Partial<ModelWithoutRelations<M>>,
) => {
  return new ModelFactory<M>(typeofModel, modelData as M);
};
