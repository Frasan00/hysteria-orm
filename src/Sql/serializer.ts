import { fromSnakeToCamelCase } from "../CaseUtils";
import { isNestedObject } from "./jsonUtils";
import { Model } from "./Models/Model";
import { Relation, RelationType } from "./Models/Relations/Relation";

export async function parseDatabaseDataIntoModelResponse<T extends Model>(
  models: T[],
  typeofModel: typeof Model,
): Promise<T | T[] | null> {
  if (!models.length) {
    return null;
  }

  const tempModel = new typeofModel() as T;
  const relations = Object.keys(tempModel).filter(
    (key) => tempModel[key as keyof T] instanceof Relation,
  );

  const serializedModels = models.map((model) => {
    Object.keys(model).forEach((key) => {
      const value = model[key as keyof Model];
      if (value === undefined) {
        delete (model as Partial<Model>)[key as keyof Model];
      }
    });

    return serializeModel(model, relations, tempModel);
  });

  return serializedModels.length === 1 ? serializedModels[0] : serializedModels;
}

function serializeModel<T extends Record<string, any>>(
  model: T,
  relations?: string[],
  tempModel?: T,
): T {
  const camelCaseModel: Record<string, any> = {};
  const keys = Object.keys(model);
  // Used to avoid having to have relations first in the final object
  const relationProps: Record<string, any>[] = [];

  for (const key of keys) {
    if (["extraColumns"].includes(key)) {
      processExtraColumns(model, key, camelCaseModel);
      continue;
    }

    const originalValue = model[key];
    if (!originalValue) {
      continue;
    }

    if (isRelationDefinition(originalValue)) {
      continue;
    }

    // Serialize the relations
    const camelCaseKey = fromSnakeToCamelCase(key);
    if (relations && tempModel && relations.includes(key)) {
      processRelation(key, relations, tempModel, originalValue, relationProps);
      continue;
    }

    // Serialize the rest of the model
    if (isNestedObject(originalValue) && !Array.isArray(originalValue)) {
      convertToCamelCaseObject(originalValue);
      continue;
    }

    // Removes every array value key that is not a relation or an extra column
    if (Array.isArray(originalValue)) {
      continue;
    }

    camelCaseModel[camelCaseKey] = originalValue;
  }

  // Add the relation properties to the final object
  relationProps.forEach((relationProp) => {
    camelCaseModel[relationProp.key] = relationProp.value;
  });
  return camelCaseModel as T;
}

function processExtraColumns(
  model: Record<string, any>,
  key: string,
  camelCaseModel: Record<string, any>,
) {
  if (!Object.keys(model[key]).length) {
    return;
  }

  const extraColumns = Object.keys(model[key]).reduce(
    (acc, objKey) => {
      acc[fromSnakeToCamelCase(objKey)] = model[key][objKey];
      return acc;
    },
    {} as Record<string, any>,
  );

  camelCaseModel[key] = extraColumns;
}

function isRelationDefinition<T extends Record<string, any>>(
  originalValue: any,
): originalValue is Relation {
  if (
    originalValue.hasOwnProperty("type") &&
    originalValue.hasOwnProperty("relatedModel") &&
    originalValue.hasOwnProperty("foreignKey")
  ) {
    return true;
  }

  return false;
}

function processRelation(
  key: string,
  relations: string[],
  tempModel: Record<string, any>,
  originalValue: any,
  relationProps: Record<string, any>[],
) {
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

        relationProps.push({
          key: camelCaseKey,
          value: camelCaseObject,
        });
        break;

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

        relationProps.push({
          key: camelCaseKey,
          value: camelCaseArray,
        });
        break;

      default:
        throw new Error(
          "Invalid relation type while serializing for key " + key,
        );
    }
  }
}

function convertToCamelCaseObject(
  originalValue: Record<string, any>,
): Record<string, any> {
  return Object.keys(originalValue).reduce(
    (acc, objKey) => {
      acc[fromSnakeToCamelCase(objKey)] = originalValue[objKey];
      return acc;
    },
    {} as Record<string, any>,
  );
}
