import { HysteriaError } from "../errors/hysteria_error";
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

  const serializedModels = await Promise.all(
    models.map(async (model) => {
      const serializedModel = await serializeModel(
        model,
        typeofModel,
        modelSelectedColumns,
      );

      await processRelations(
        serializedModel,
        typeofModel,
        relations,
        relationModels,
      );
      return serializedModel;
    }),
  );

  return serializedModels.length === 1 ? serializedModels[0] : serializedModels;
}

async function serializeModel<T extends Record<string, any>>(
  model: T,
  typeofModel: typeof Model,
  modelSelectedColumns: string[] = [],
): Promise<T> {
  const casedModel: Record<string, any> = {};
  const columns = getModelColumns(typeofModel);
  const hiddenColumns = columns
    .filter((column) => column.hidden)
    .map((column) => column.columnName);

  await Promise.all(
    Object.keys(model).map(async (key) => {
      if (key === "$additional") {
        processAdditionalColumns(model, key, casedModel, typeofModel);
        return;
      }

      if (
        !model.hasOwnProperty(key) ||
        hiddenColumns.includes(key) ||
        (modelSelectedColumns.length && !modelSelectedColumns.includes(key))
      ) {
        return;
      }

      const originalValue = model[key];

      // Include null values
      if (originalValue === null) {
        casedModel[convertCase(key, typeofModel.modelCaseConvention)] =
          originalValue;
        return;
      }

      if (isRelationDefinition(originalValue)) {
        return;
      }

      const camelCaseKey = convertCase(key, typeofModel.modelCaseConvention);
      if (isNestedObject(originalValue) && !Array.isArray(originalValue)) {
        casedModel[camelCaseKey] = convertToModelCaseConvention(
          originalValue,
          typeofModel,
        );
        return;
      }

      const modelColumn = columns.find((column) => column.columnName === key);
      if (modelColumn && modelColumn.serialize) {
        casedModel[camelCaseKey] = modelColumn.serialize(originalValue);
        return;
      }

      casedModel[camelCaseKey] = originalValue;
    }),
  );

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

async function processRelations(
  serializedModel: Record<string, any>,
  typeofModel: typeof Model,
  relations: Relation[],
  relationModels: { [relationName: string]: Model[] }[],
): Promise<void> {
  await Promise.all(
    relations.map(async (relation: Relation) => {
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
        case RelationEnum.belongsTo: {
          const relatedModelMap = new Map<any, Model>();
          const casedPrimaryKey = convertCase(
            primaryKey,
            typeofModel.databaseCaseConvention,
          ) as keyof Model;

          relatedModels.forEach((model) => {
            relatedModelMap.set(model[casedPrimaryKey], model);
          });

          const retrievedRelatedModel = relatedModelMap.get(
            serializedModel[foreignKey as keyof Model],
          );

          if (!retrievedRelatedModel) {
            serializedModel[relation.columnName] = null;
            return;
          }

          serializedModel[relation.columnName] = await serializeModel(
            retrievedRelatedModel,
            relation.model,
          );
          break;
        }

        case RelationEnum.hasOne: {
          const relatedModelMapHasOne = new Map<any, Model>();
          const casedForeignKey = convertCase(
            foreignKey,
            typeofModel.databaseCaseConvention,
          ) as keyof Model;

          relatedModels.forEach((model) => {
            relatedModelMapHasOne.set(model[casedForeignKey], model);
          });

          const retrievedRelatedModelHasOne = relatedModelMapHasOne.get(
            serializedModel[primaryKey as keyof Model],
          );

          if (!retrievedRelatedModelHasOne) {
            serializedModel[relation.columnName] = null;
            return;
          }

          serializedModel[relation.columnName] = await serializeModel(
            retrievedRelatedModelHasOne,
            relation.model,
          );
          break;
        }

        case RelationEnum.hasMany: {
          const retrievedRelatedModels = relatedModels.filter(
            (item) =>
              item[
                convertCase(
                  foreignKey,
                  typeofModel.databaseCaseConvention,
                ) as keyof Model
              ] === serializedModel[primaryKey as keyof Model],
          );

          serializedModel[relation.columnName] = await Promise.all(
            retrievedRelatedModels.map(
              async (model) => await serializeModel(model, relation.model),
            ),
          );
          break;
        }

        case RelationEnum.manyToMany: {
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

          serializedModel[relation.columnName] = await Promise.all(
            relatedColumnValue.map(
              async (relatedItem: Model) =>
                await serializeModel(relatedItem, relation.model),
            ),
          );
          break;
        }

        default:
          throw new HysteriaError(
            "Serializer::processRelations",
            `RELATION_TYPE_NOT_SUPPORTED_${relation.type}`,
          );
      }
    }),
  );
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
