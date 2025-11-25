import { convertCase } from "../utils/case_utils";
import { ColumnType } from "./models/decorators/model_decorators_types";
import { Model } from "./models/model";

export const parseDatabaseDataIntoModelResponse = async <
  T extends Record<string, any>,
>(
  model: T,
  typeofModel: typeof Model,
  modelColumns: ColumnType[],
  modelColumnsMap: Map<string, ColumnType>,
  modelSelectedColumns: string[] = [],
  modelAnnotatedColumns: string[] = [],
  mustRemoveAnnotations: boolean = false,
): Promise<T> => {
  const casedModel: Record<string, any> =
    new (typeofModel as unknown as new () => T)();
  const hiddenColumnsSet = new Set<string>(
    modelColumns
      .filter((column) => column.hidden)
      .map((column) => column.columnName),
  );

  const databaseColumnsMap = new Map<string, ColumnType>(
    modelColumns.map((modelColumn) => [modelColumn.databaseName, modelColumn]),
  );

  const modelSelectedColumnsSet = modelSelectedColumns.length
    ? new Set<string>(modelSelectedColumns)
    : null;

  await Promise.all(
    Object.keys(model).map(async (key) => {
      const databaseValue = model[key];
      const modelKey =
        databaseColumnsMap.get(key)?.columnName ??
        convertCase(key, typeofModel.modelCaseConvention);

      if (modelKey === "$annotations" && !mustRemoveAnnotations) {
        processAnnotations(
          model,
          key,
          casedModel,
          typeofModel,
          modelAnnotatedColumns,
        );
        return;
      }

      if (
        !modelColumnsMap.has(modelKey) || // Handled in the $annotations property
        hiddenColumnsSet.has(modelKey) ||
        (modelSelectedColumnsSet && !modelSelectedColumnsSet.has(modelKey))
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
  if (modelSelectedColumnsSet) {
    for (const column of modelSelectedColumnsSet) {
      if (!(column in casedModel)) {
        casedModel[column] = null;
      }
    }
  }

  return casedModel as T;
};

export const processAnnotations = (
  model: Record<string, any>,
  key: string,
  casedModel: Record<string, any>,
  typeofModel: typeof Model,
  modelAnnotatedColumns: string[] = [],
) => {
  const annotationsData = model[key];
  if (!annotationsData || !Object.keys(annotationsData).length) {
    return;
  }

  const modelAnnotatedColumnsSet =
    modelAnnotatedColumns.length > 0
      ? new Set<string>(modelAnnotatedColumns)
      : null;

  if (!modelAnnotatedColumnsSet) {
    return;
  }

  const $annotations: Record<string, any> = {};
  for (const objKey of Object.keys(annotationsData)) {
    if (modelAnnotatedColumnsSet.has(objKey)) {
      $annotations[convertCase(objKey, typeofModel.modelCaseConvention)] =
        annotationsData[objKey];
    }
  }

  if (Object.keys($annotations).length > 0) {
    casedModel[key] = $annotations;
  }
};

/**
 * @description Main serializer function
 */
export const serializeModel = async <T extends Model>(
  models: T[],
  typeofModel: typeof Model,
  modelSelectedColumns: string[] = [],
  modelAnnotatedColumns: string[] = [],
  mustRemoveAnnotations: boolean = false,
): Promise<T | T[] | null> => {
  if (!models.length) {
    return null;
  }

  const modelColumns = typeofModel.getColumns();
  const modelColumnsMap = new Map<string, ColumnType>(
    modelColumns.map((modelColumn) => [modelColumn.columnName, modelColumn]),
  );

  // At this point `modelSelectedColumns` are in database convention
  const processedSelectedColumns: string[] = [];
  for (const databaseColumn of modelSelectedColumns) {
    // If alias, skip because it will be added in $annotations
    if (databaseColumn.toLowerCase().includes("as")) {
      continue;
    }

    let processedColumn = databaseColumn;
    // If contains . it means it's something like user.name, so split it and return the last part since it was something useful for the query but at this point we want what to retrieve
    if (processedColumn.includes(".")) {
      processedColumn = processedColumn.split(".").pop() as string;
    }

    if (processedColumn === "*") {
      continue;
    }

    const columnName =
      modelColumnsMap.get(processedColumn)?.columnName ??
      convertCase(processedColumn, typeofModel.modelCaseConvention);
    processedSelectedColumns.push(columnName);
  }
  modelSelectedColumns = processedSelectedColumns;

  const serializedModels = await Promise.all(
    models.map(async (model) => {
      const serializedModel = await parseDatabaseDataIntoModelResponse(
        model,
        typeofModel,
        modelColumns,
        modelColumnsMap,
        modelSelectedColumns,
        modelAnnotatedColumns,
        mustRemoveAnnotations,
      );

      return serializedModel;
    }),
  );

  return serializedModels.length === 1 ? serializedModels[0] : serializedModels;
};
