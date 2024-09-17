import { fromSnakeToCamelCase } from "../CaseUtils";
import { isNestedObject } from "./jsonUtils";
import { getModelBooleanColumns, Model } from "./Models/Model";
import { Relation, RelationType } from "./Models/Relations/Relation";

export async function parseDatabaseDataIntoModelResponse<T extends Model>(
  models: T[],
  typeofModel: typeof Model,
  relationModels: { [relationName: string]: Model[] }[] = [],
): Promise<T | T[] | null> {
  if (!models.length) {
    return null;
  }

  const tempModel = new typeofModel() as T;
  const relations = Object.keys(tempModel).filter(
    (key) => tempModel[key as keyof T] instanceof Relation,
  );

  const serializedModels = models.map((model) => {
    const serializedModel = serializeModel(model, typeofModel);
    processRelation(
      serializedModel,
      tempModel,
      typeofModel,
      relations,
      relationModels,
    );

    return serializedModel;
  });

  return serializedModels.length === 1 ? serializedModels[0] : serializedModels;
}

function serializeModel<T extends Record<string, any>>(
  model: T,
  typeofModel: typeof Model,
): T {
  const camelCaseModel: Record<string, any> = {};
  const booleanColumns = getModelBooleanColumns(typeofModel);

  for (const key in model) {
    if (model[key] === undefined) {
      delete (model as Partial<Model>)[key as keyof Model];
    }

    if (model.hasOwnProperty(key)) {
      if (key === "extraColumns") {
        processExtraColumns(model, key, camelCaseModel);
        continue;
      }

      const originalValue = model[key];
      // Include null values
      if (originalValue == null) {
        camelCaseModel[fromSnakeToCamelCase(key)] = originalValue;
        continue;
      }

      if (isRelationDefinition(originalValue)) {
        continue;
      }

      const camelCaseKey = fromSnakeToCamelCase(key);
      if (isNestedObject(originalValue) && !Array.isArray(originalValue)) {
        camelCaseModel[camelCaseKey] = convertToCamelCaseObject(originalValue);
        continue;
      }

      // TODO: For now, non relation arrays are not supported
      if (Array.isArray(originalValue)) {
        continue;
      }

      if (booleanColumns.includes(camelCaseKey)) {
        camelCaseModel[camelCaseKey] = Boolean(originalValue);
        console.log(camelCaseKey, originalValue);
        continue;
      }

      camelCaseModel[camelCaseKey] = originalValue;
    }
  }

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

function isRelationDefinition(originalValue: any): originalValue is Relation {
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
  serializedModel: Record<string, any>,
  tempModel: Record<string, any>, // For relations
  typeofModel: typeof Model,
  relationsNames: string[],
  relationModels: { [relationName: string]: Model[] }[],
) {
  relationsNames.forEach((relationName) => {
    const relation = tempModel[relationName as keyof Model] as Relation;
    const relationModel = relationModels.find(
      (relationModel) => relationModel[relationName],
    );

    if (!relationModel) {
      return;
    }

    const relatedModel = relationModel[relationName];
    const foreignKey = fromSnakeToCamelCase(relation.foreignKey) as string;
    const primaryKey = typeofModel.metadata.primaryKey as string;

    const relatedModelMap = new Map<any, Model>();
    relatedModel.forEach((model) => {
      relatedModelMap.set(model[primaryKey as keyof Model], model);
    });

    switch (relation.type) {
      case RelationType.belongsTo:
      case RelationType.hasOne:
        const retrievedRelatedModel = relatedModelMap.get(
          serializedModel[foreignKey as keyof Model],
        );

        if (retrievedRelatedModel) {
          serializedModel[relationName] = serializeModel(
            retrievedRelatedModel,
            relation.model,
          );
        }
        break;

      case RelationType.hasMany:
        Object.keys(relatedModel).forEach((key: string) => {
          // @ts-ignore
          relatedModel[key as keyof Model] = convertToCamelCaseObject(
            relatedModel[key as any],
          );
        });

        const retrievedRelatedModels = relatedModel.filter(
          (item) =>
            item[foreignKey as keyof Model] ===
            serializedModel[primaryKey as keyof Model],
        );

        serializedModel[relationName] = retrievedRelatedModels.map((model) =>
          serializeModel(model, relation.model),
        );
        break;

      default:
        throw new Error("Relation type not supported");
    }
  });
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
