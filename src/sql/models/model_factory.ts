import { FactoryReturnType } from "../../../test/sql/test_models/factory/factory_types";
import { Model } from "./model";

class ModelFactory<M extends Model> {
  typeofModel: typeof Model;
  modelData: Partial<M>;

  /**
   * @description Constructor for the model factory
   */
  constructor(typeofModel: typeof Model, modelData: Partial<M>) {
    this.typeofModel = typeofModel;
    this.modelData = modelData;
  }

  /**
   * @description Create a model
   * @param howMany - The number of models to create
   * @returns The created model(s)
   */
  async create<T extends number>(howMany: T): Promise<FactoryReturnType<T, M>> {
    const insertModel = this.typeofModel as {
      insert: (data: Partial<M>) => Promise<M>;
      insertMany: (data: Partial<M>[]) => Promise<M[]>;
    };

    if (howMany === 1) {
      return insertModel.insert(this.modelData) as Promise<
        FactoryReturnType<T, M>
      >;
    }

    const array = Array.from({ length: howMany });
    return insertModel.insertMany(
      array.map(() => ({
        ...this.modelData,
      })),
    ) as Promise<FactoryReturnType<T, M>>;
  }
}

export const createModelFactory = <M extends Model>(
  typeofModel: typeof Model,
  modelData: Partial<M>,
) => {
  return new ModelFactory<M>(typeofModel, modelData);
};
