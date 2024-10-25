import { convertCase } from "../../utils/case_utils";
import {
  getBaseCollectionInstance,
  Collection,
} from "./mongo_models/mongo_collection";
import {
  getMongoDynamicProperties,
  getCollectionProperties,
} from "./mongo_models/mongo_collection_decorators";

export async function serializeCollection<T extends Collection>(
  model: typeof Collection,
  data: any,
  modelSelectedColumns?: string[],
  dynamicColumnsToAdd: string[] = [],
): Promise<T | null> {
  if (!data) {
    return null;
  }

  const serializedModel = getBaseCollectionInstance<T>() as Record<string, any>;
  const collectionFields = getCollectionProperties(model);
  if (!modelSelectedColumns || !modelSelectedColumns.length) {
    modelSelectedColumns = collectionFields;
  }

  if (!modelSelectedColumns.includes("id")) {
    modelSelectedColumns.push("id");
  }

  for (const key in data) {
    if (key === "_id") {
      serializedModel.id = data._id?.toString();
      continue;
    }

    if (!collectionFields.includes(key)) {
      const casedKey = convertCase(key, model.modelCaseConvention);
      serializedModel.$additionalColumns[casedKey] = data[key];
      continue;
    }

    const casedKey = convertCase(key, model.modelCaseConvention);
    serializedModel[casedKey] = data[key];
  }

  if (!Object.keys(serializedModel.$additionalColumns).length) {
    delete serializedModel.$additionalColumns;
  }

  for (const column of modelSelectedColumns) {
    if (column === "id") {
      continue;
    }

    if (!data.hasOwnProperty(column)) {
      const casedKey = convertCase(column, model.modelCaseConvention);
      serializedModel[casedKey] = null;
      continue;
    }
  }

  await addDynamicColumnsToModel(model, serializedModel, dynamicColumnsToAdd);
  return serializedModel as T;
}

export async function serializeCollections<T extends Collection>(
  model: typeof Collection,
  data: any[],
  modelSelectedColumns?: string[],
  dynamicColumnsToAdd: string[] = [],
): Promise<T[]> {
  const promises = data.map(async (modelData: T) => {
    return await serializeCollection(
      model,
      modelData,
      modelSelectedColumns,
      dynamicColumnsToAdd,
    );
  });

  const serializedModels = await Promise.all(promises);
  return serializedModels.filter((model) => model !== null) as T[];
}

export async function addDynamicColumnsToModel(
  typeofModel: typeof Collection,
  model: Record<string, any>,
  dynamicColumnsToAdd: string[],
): Promise<void> {
  const dynamicColumns = getMongoDynamicProperties(typeofModel);
  if (!dynamicColumns || !dynamicColumns.length) {
    return;
  }

  const dynamicColumnMap = new Map<
    string,
    {
      columnName: string;
      dynamicColumnFn: (...args: any[]) => any;
    }
  >();

  for (const dynamicColumn of dynamicColumns) {
    dynamicColumnMap.set(dynamicColumn.functionName, {
      columnName: dynamicColumn.propertyName,
      dynamicColumnFn: dynamicColumn.dynamicPropertyFn,
    });
  }

  const promises = dynamicColumnsToAdd.map(async (dynamicColumn: string) => {
    const dynamic = dynamicColumnMap.get(dynamicColumn);
    const casedKey = convertCase(
      dynamic?.columnName,
      typeofModel.modelCaseConvention,
    );

    Object.assign(model, { [casedKey]: await dynamic?.dynamicColumnFn() });
  });

  await Promise.all(promises);
}
