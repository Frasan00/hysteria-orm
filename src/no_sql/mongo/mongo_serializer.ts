import { convertCase } from "../../utils/case_utils";
import {
  Collection,
  getBaseCollectionInstance,
} from "./mongo_models/mongo_collection";
import { getCollectionProperties } from "./mongo_models/mongo_collection_decorators";

export async function serializeCollection<T extends Collection>(
  collection: typeof Collection,
  data: any,
  collectionSelectedProperties?: string[],
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

  // Initialize $annotations if needed
  if (!serializedCollection.$annotations) {
    serializedCollection.$annotations = {};
  }

  // Process each key in data concurrently
  await Promise.all(
    Object.keys(data).map(async (key) => {
      if (key === "_id") {
        serializedCollection.id = data._id?.toString();
        return;
      }

      if (!collectionProperties.includes(key)) {
        const casedKey = convertCase(key, collection.modelCaseConvention);
        serializedCollection.$annotations[casedKey] = data[key];
        return;
      }

      const casedKey = convertCase(key, collection.modelCaseConvention);
      serializedCollection[casedKey] = data[key];
    }),
  );

  if (!Object.keys(serializedCollection.$annotations).length) {
    delete serializedCollection.$annotations;
  }

  // Process selected properties concurrently
  await Promise.all(
    collectionSelectedProperties.map(async (column) => {
      if (column === "id") {
        return;
      }

      if (!data.hasOwnProperty(column)) {
        const casedKey = convertCase(column, collection.modelCaseConvention);
        serializedCollection[casedKey] = null;
      }
    }),
  );

  return serializedCollection as T;
}

export async function serializeCollections<T extends Collection>(
  model: typeof Collection,
  data: any[],
  collectionSelectedProperties?: string[],
): Promise<T[]> {
  const serializedModels = await Promise.all(
    data.map(async (modelData: T) => {
      return await serializeCollection(
        model,
        modelData,
        collectionSelectedProperties,
      );
    }),
  );
  return serializedModels.filter((model) => model !== null) as T[];
}
