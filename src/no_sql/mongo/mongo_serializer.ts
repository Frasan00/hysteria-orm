import { convertCase } from "../../utils/case_utils";
import {
  Collection,
  getBaseCollectionInstance,
} from "./mongo_models/mongo_collection";
import {
  getCollectionDynamicProperties,
  getCollectionProperties,
} from "./mongo_models/mongo_collection_decorators";

export async function serializeCollection<T extends Collection>(
  collection: typeof Collection,
  data: any,
  collectionSelectedProperties?: string[],
  dynamicColumnsToAdd: string[] = [],
): Promise<T | null> {
  if (!data) {
    return null;
  }

  const serializedCollection = getBaseCollectionInstance<T>() as Record<
    string,
    any
  >;
  const collectionProperties = getCollectionProperties(collection);
  if (!collectionSelectedProperties || !collectionSelectedProperties.length) {
    collectionSelectedProperties = collectionProperties;
  }

  if (!collectionSelectedProperties.includes("id")) {
    collectionSelectedProperties.push("id");
  }

  for (const key in data) {
    if (key === "_id") {
      serializedCollection.id = data._id?.toString();
      continue;
    }

    if (!collectionProperties.includes(key)) {
      const casedKey = convertCase(key, collection.modelCaseConvention);
      serializedCollection.$additional[casedKey] = data[key];
      continue;
    }

    const casedKey = convertCase(key, collection.modelCaseConvention);
    serializedCollection[casedKey] = data[key];
  }

  if (!Object.keys(serializedCollection.$additional).length) {
    delete serializedCollection.$additional;
  }

  for (const column of collectionSelectedProperties) {
    if (column === "id") {
      continue;
    }

    if (!data.hasOwnProperty(column)) {
      const casedKey = convertCase(column, collection.modelCaseConvention);
      serializedCollection[casedKey] = null;
      continue;
    }
  }

  if (dynamicColumnsToAdd.length) {
    await addDynamicColumnsToModel(
      collection,
      serializedCollection,
      dynamicColumnsToAdd,
    );
  }

  return serializedCollection as T;
}

export async function serializeCollections<T extends Collection>(
  model: typeof Collection,
  data: any[],
  collectionSelectedProperties?: string[],
  dynamicColumnsToAdd: string[] = [],
): Promise<T[]> {
  const promises = data.map(async (modelData: T) => {
    return await serializeCollection(
      model,
      modelData,
      collectionSelectedProperties,
      dynamicColumnsToAdd,
    );
  });

  const serializedModels = await Promise.all(promises);
  return serializedModels.filter((model) => model !== null) as T[];
}

export async function addDynamicColumnsToModel(
  typeofCollection: typeof Collection,
  model: Record<string, any>,
  dynamicColumnsToAdd: string[],
): Promise<void> {
  const dynamicColumns = getCollectionDynamicProperties(typeofCollection);
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
    dynamicColumnMap.set(dynamicColumn.functionName as string, {
      columnName: dynamicColumn.propertyName,
      dynamicColumnFn: dynamicColumn.dynamicPropertyFn,
    });
  }

  const promises = dynamicColumnsToAdd.map(async (dynamicColumn: string) => {
    const dynamic = dynamicColumnMap.get(dynamicColumn);
    if (!dynamic) {
      return;
    }

    const casedKey = convertCase(
      dynamic?.columnName,
      typeofCollection.modelCaseConvention,
    );

    model[casedKey] = await dynamic.dynamicColumnFn(model);
  });

  await Promise.all(promises);
}
