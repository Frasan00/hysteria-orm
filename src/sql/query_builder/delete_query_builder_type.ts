import { MongoCollectionKey } from "../../no_sql/mongo/mongo_models/mongo_collection_types";

export type DeleteOptions = {};

export type SoftDeleteOptions<T> = {
  column?: MongoCollectionKey<T>;
  value?: string | number | boolean;
};
