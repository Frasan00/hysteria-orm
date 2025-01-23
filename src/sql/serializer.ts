import { convertCase } from "../utils/case_utils";
import { isNestedObject } from "../utils/json_utils";
import { Model } from "./models/model";
import { getModelColumns, getRelations } from "./models/model_decorators";
import {
  isRelationDefinition,
  Relation,
  RelationEnum,
} from "./models/relations/relation";

export async function parseDatabaseDataIntoModelResponse<T extends Model>(
  models: T[],
  typeofModel: typeof Model,
  relationModels: { [relationName: string]: Model[] }[] = [],
  modelSelectedColumns: string[] = [],
): Promise<T | T[] | null> {
  if (!models.length) {
    return null;
  }

  const relations = getRelations(typeofModel);

  const serializedModels = models.map((model) => {
    const serializedModel = serializeModel(
      model,
      typeofModel,
      modelSelectedColumns,
    );
    processRelation(serializedModel, typeofModel, relations, relationModels);

    return serializedModel;
  });

  return serializedModels.length === 1 ? serializedModels[0] : serializedModels;
}

function serializeModel<T extends Record<string, any>>(
  model: T,
  typeofModel: typeof Model,
  modelSelectedColumns: string[] = [],
): T {
  const casedModel: Record<string, any> = {};
  const columns = getModelColumns(typeofModel);
  const hiddenColumns = columns
    .filter((column) => column.hidden)
    .map((column) => column.columnName);

  for (const key in model) {
    if (key === "$additional") {
      processAdditionalColumns(model, key, casedModel, typeofModel);
      continue;
    }

    if (
      !model.hasOwnProperty(key) ||
      hiddenColumns.includes(key) ||
      (modelSelectedColumns.length && !modelSelectedColumns.includes(key))
    ) {
      continue;
    }

    const originalValue = model[key];
    // Include null values
    if (originalValue == null) {
      casedModel[convertCase(key, typeofModel.modelCaseConvention)] =
        originalValue;
      continue;
    }

    if (isRelationDefinition(originalValue)) {
      continue;
    }

    const camelCaseKey = convertCase(key, typeofModel.modelCaseConvention);
    if (isNestedObject(originalValue) && !Array.isArray(originalValue)) {
      casedModel[camelCaseKey] = convertToModelCaseConvention(
        originalValue,
        typeofModel,
      );
      continue;
    }

    if (Array.isArray(originalValue)) {
      continue;
    }

    const modelColumn = columns.find((column) => column.columnName === key);
    if (modelColumn && modelColumn.serialize) {
      casedModel[camelCaseKey] = modelColumn.serialize(originalValue);
      continue;
    }

    casedModel[camelCaseKey] = originalValue;
  }

  return casedModel as T;
}

function processAdditionalColumns(
  model: Record<string, any>,
  key: string,
  casedModel: Record<string, any>,
  typeofModel: typeof Model,
) {
  if (!Object.keys(model[key]).length) {
    return;
  }

  const $additional = Object.keys(model[key]).reduce(
    (acc, objKey) => {
      acc[convertCase(objKey, typeofModel.modelCaseConvention)] =
        model[key][objKey];
      return acc;
    },
    {} as Record<string, any>,
  );

  casedModel[key] = $additional;
}

function processRelation(
  serializedModel: Record<string, any>,
  typeofModel: typeof Model,
  relations: Relation[],
  relationModels: { [relationName: string]: Model[] }[],
) {
  relations.forEach((relation: Relation) => {
    const relationModel = relationModels.find(
      (relationModel) => relationModel[relation.columnName],
    );

    if (!relationModel) {
      return;
    }

    const relatedModels = relationModel[relation.columnName];
    const foreignKey = convertCase(
      relation.foreignKey,
      typeofModel.modelCaseConvention,
    ) as string;
    const primaryKey = convertCase(
      typeofModel.primaryKey,
      typeofModel.modelCaseConvention,
    ) as string;

    switch (relation.type) {
      case RelationEnum.belongsTo:
        const relatedModelMap = new Map<any, Model>();
        const casedPrimaryKey = convertCase(
          primaryKey,
          typeofModel.databaseCaseConvention,
        ) as keyof Model;

        relatedModels.forEach((model) => {
          relatedModelMap.set(model[casedPrimaryKey as keyof Model], model);
        });

        const retrievedRelatedModel = relatedModelMap.get(
          serializedModel[foreignKey as keyof Model],
        );

        if (!retrievedRelatedModel) {
          serializedModel[relation.columnName] = null;
          return;
        }

        serializedModel[relation.columnName] = serializeModel(
          retrievedRelatedModel,
          relation.model,
        );
        break;

      case RelationEnum.hasOne:
        const relatedModelMapHasOne = new Map<any, Model>();
        const casedForeignKey = convertCase(
          foreignKey,
          typeofModel.databaseCaseConvention,
        ) as keyof Model;

        relatedModels.forEach((model) => {
          relatedModelMapHasOne.set(
            model[casedForeignKey as keyof Model],
            model,
          );
        });

        const retrievedRelatedModelHasOne = relatedModelMapHasOne.get(
          serializedModel[primaryKey as keyof Model],
        );

        if (!retrievedRelatedModelHasOne) {
          serializedModel[relation.columnName] = null;
          return;
        }

        serializedModel[relation.columnName] = serializeModel(
          retrievedRelatedModelHasOne,
          relation.model,
        );
        break;

      case RelationEnum.hasMany:
        const retrievedRelatedModels = relatedModels.filter(
          (item) =>
            // Since it's still raw data and it's not yet been converted to camel case (it will soon in the serializeModel call)m it's matched with the camel case key
            item[
              convertCase(
                foreignKey,
                typeofModel.databaseCaseConvention,
              ) as keyof Model
            ] === serializedModel[primaryKey as keyof Model],
        );

        serializedModel[relation.columnName] = retrievedRelatedModels.map(
          (model) => serializeModel(model, relation.model),
        );
        break;

      case RelationEnum.manyToMany:
        const relatedModelMapManyToMany = new Map<any, Model>();
        relatedModels.forEach((model) => {
          relatedModelMapManyToMany.set(
            model[primaryKey as keyof Model],
            model,
          );
        });

        const currentModelId = serializedModel[primaryKey as keyof Model];
        const relatedModel = relatedModelMapManyToMany.get(currentModelId);

        if (!relatedModel) {
          serializedModel[relation.columnName] = [];
          return;
        }

        let relatedColumnValue =
          relatedModel[relation.columnName as keyof Model];
        if (!relatedColumnValue) {
          relatedColumnValue = [];
        }

        if (!Array.isArray(relatedColumnValue)) {
          relatedColumnValue = [relatedColumnValue];
        }

        serializedModel[relation.columnName] = relatedColumnValue.map(
          (relatedItem: Model) => serializeModel(relatedItem, relation.model),
        );
        break;
      default:
        throw new Error("Relation type not supported");
    }
  });
}

function convertToModelCaseConvention(
  originalValue: Record<string, any>,
  typeofModel: typeof Model,
): Record<string, any> {
  return Object.keys(originalValue).reduce(
    (acc, objKey) => {
      acc[convertCase(objKey, typeofModel.modelCaseConvention)] =
        originalValue[objKey];
      return acc;
    },
    {} as Record<string, any>,
  );
}
