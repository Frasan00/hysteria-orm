import { fromSnakeToCamelCase } from "../CaseUtils";
import { Model } from "./Models/Model";
import { Relation, RelationType } from "./Models/Relations/Relation";

export async function parseDatabaseDataIntoModelResponse<T extends Model>(
  models: T[],
  _typeofModel: typeof Model,
): Promise<T | T[] | null> {
  if (!models.length) {
    return null;
  }

  const _tempModel = new _typeofModel() as T;
  const relations = Object.keys(_tempModel).filter(
    (key) => _tempModel[key as keyof T] instanceof Relation,
  );

  models = models.map((model) => {
    Object.keys(model).forEach((key) => {
      const value = model[key as keyof Model];
      if (value === undefined) {
        delete (model as Partial<Model>)[key as keyof Model];
      }
    });

    return model;
  });

  const parsedModels = models.map((model) =>
    serializeModel(model, relations, _tempModel),
  );
  return parsedModels.length === 1 ? parsedModels[0] : parsedModels;
}

function serializeModel<T extends Record<string, any>>(
  model: T,
  relations?: string[],
  tempModel?: T,
): T {
  const camelCaseModel: Record<string, any> = {};
  Object.keys(model).forEach((key) => {
    if (["extraColumns"].includes(key)) {
      if (!Object.keys(model[key]).length) {
        return;
      }

      camelCaseModel[key] = model[key];
      return;
    }

    const originalValue = model[key];
    if (!originalValue) {
      return;
    }

    const camelCaseKey = fromSnakeToCamelCase(key);
    if (relations && tempModel && relations.includes(key)) {
      const relation = tempModel[key] as Relation;
      switch (relation.type) {
        case RelationType.hasOne:
        case RelationType.belongsTo:
          const camelCaseObject = Object.keys(originalValue).reduce(
            (acc, objKey) => {
              acc[fromSnakeToCamelCase(objKey)] = originalValue[objKey];
              return acc;
            },
            {} as Record<string, any>,
          );

          camelCaseModel[camelCaseKey] = camelCaseObject;
          return;

        case RelationType.hasMany:
          const originalValueArray = Array.isArray(originalValue)
            ? originalValue
            : [originalValue];
          const camelCaseArray = originalValueArray.map((value: any) => {
            return Object.keys(value).reduce(
              (acc, objKey) => {
                acc[fromSnakeToCamelCase(objKey)] = value[objKey];
                return acc;
              },
              {} as Record<string, any>,
            );
          });

          camelCaseModel[camelCaseKey] = camelCaseArray;
          return;

        default:
          throw new Error(
            "Invalid relation type while serializing for key " + key,
          );
      }
    }

    if (typeof originalValue === "object") {
      const camelCaseObject = Object.keys(originalValue).reduce(
        (acc, objKey) => {
          acc[fromSnakeToCamelCase(objKey)] = originalValue[objKey];
          return acc;
        },
        {} as Record<string, any>,
      );

      camelCaseModel[camelCaseKey] = camelCaseObject;
      return;
    }

    camelCaseModel[camelCaseKey] = originalValue;
  });

  return camelCaseModel as T;
}
