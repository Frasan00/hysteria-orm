import { convertCase } from "../utils/case_utils";
import { getModelColumns } from "./models/decorators/model_decorators";
import { ColumnType } from "./models/decorators/model_decorators_types";
import { Model } from "./models/model";

/**
 * @description Main serializer function
 */
export async function parseDatabaseDataIntoModelResponse<T extends Model>(
  models: T[],
  typeofModel: typeof Model,
  modelSelectedColumns: string[] = [],
): Promise<T | T[] | null> {
  if (!models.length) {
    return null;
  }

  const modelColumns = getModelColumns(typeofModel);
  const modelColumnsMap = new Map<string, ColumnType>(
    modelColumns.map((modelColumn) => [modelColumn.columnName, modelColumn]),
  );

  // At this point `modelSelectedColumns` are in database convention
  modelSelectedColumns = modelSelectedColumns
    .map((databaseColumn) => {
      // If alias, skip because it will be added in $additional
      if (databaseColumn.toLowerCase().includes("as")) {
        return;
      }

      // If contains . it means it's something like user.name, so split it and return the last part since it was something useful for the query but at this point we want what to retrieve
      if (databaseColumn.includes(".")) {
        databaseColumn = databaseColumn.split(".").pop() as string;
      }

      return (
        modelColumnsMap.get(databaseColumn)?.columnName ??
        convertCase(databaseColumn, typeofModel.modelCaseConvention)
      );
    })
    .filter((column) => column !== "*" && column);

  const serializedModels = await Promise.all(
    models.map(async (model) => {
      const serializedModel = await serializeModel(
        model,
        typeofModel,
        modelColumns,
        modelColumnsMap,
        modelSelectedColumns,
      );

      return serializedModel;
    }),
  );

  return serializedModels.length === 1 ? serializedModels[0] : serializedModels;
}

async function serializeModel<T extends Record<string, any>>(
  model: T,
  typeofModel: typeof Model,
  modelColumns: ColumnType[],
  modelColumnsMap: Map<string, ColumnType>,
  modelSelectedColumns: string[] = [],
): Promise<T> {
  const casedModel: Record<string, any> = {};
  const hiddenColumns = modelColumns
    .filter((column) => column.hidden)
    .map((column) => column.columnName);

  const databaseColumnsMap = new Map<string, ColumnType>(
    modelColumns.map((modelColumn) => [modelColumn.databaseName, modelColumn]),
  );

  await Promise.all(
    Object.keys(model).map(async (key) => {
      const databaseValue = model[key];
      const modelKey =
        databaseColumnsMap.get(key)?.columnName ??
        convertCase(key, typeofModel.modelCaseConvention);

      if (modelKey === "$additional") {
        processAdditionalColumns(model, key, casedModel, typeofModel);
        return;
      }

      if (
        !modelColumnsMap.has(modelKey) || // Handled in the $additional property
        hiddenColumns.includes(modelKey) ||
        (modelSelectedColumns.length &&
          !modelSelectedColumns.includes(modelKey))
      ) {
        return;
      }

      // Include null values
      if (databaseValue === null) {
        casedModel[modelKey] = null;
        return;
      }

      const modelColumn = modelColumnsMap.get(modelKey);
      if (modelColumn && modelColumn.serialize) {
        casedModel[modelKey] = await modelColumn.serialize(databaseValue);
        return;
      }

      casedModel[modelKey] = databaseValue;
    }),
  );

  // Fill model with modelSelectedColumns as null if not present in the model
  modelSelectedColumns.forEach((column) => {
    if (!casedModel[column]) {
      casedModel[column] = null;
    }
  });

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
