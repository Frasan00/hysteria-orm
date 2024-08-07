import { fromSnakeToCamelCase } from "../CaseUtils";
import { Model } from "./Models/Model";
import { Relation } from "./Models/Relations/Relation";

export async function parseDatabaseDataIntoModelResponse<T extends Model>(
  models: T[],
  typeofModel: typeof Model,
): Promise<T | T[] | null> {
  if (!models.length) {
    return null;
  }

  models = models.map((model) => {
    Object.keys(model).forEach((key) => {
      const value = model[key as keyof Model];
      if (value === undefined) {
        delete (model as Partial<Model>)[key as keyof Model];
      }
    });

    return model;
  });

  const parsedModels = models.map((model) => serializeModel(model));
  await typeofModel.afterFetch(parsedModels);
  return parsedModels.length === 1 ? parsedModels[0] : parsedModels;
}

function serializeModel<T extends Record<string, any>>(model: T): T {
  const camelCaseModel: Record<string, any> = {};

  Object.keys(model).forEach((key) => {
    if (["metadata"].includes(key)) {
      return;
    }

    if (["extraColumns"].includes(key)) {
      if (!Object.keys(model[key]).length) {
        return;
      }

      camelCaseModel[key] = model[key];
      return;
    }

    const originalValue = model[key];
    const camelCaseKey = fromSnakeToCamelCase(key);

    const isObject = typeof originalValue === "object";
    const isNotArray = !Array.isArray(originalValue);
    const isNotRelation = !(originalValue instanceof Relation);
    const isNotDate = !(originalValue instanceof Date);

    if (originalValue && isObject && isNotArray && isNotRelation && isNotDate) {
      camelCaseModel[camelCaseKey] = serializeModel(originalValue);
    } else if (isNotRelation && isNotDate) {
      camelCaseModel[camelCaseKey] = originalValue;
    }
  });

  return camelCaseModel as T;
}
