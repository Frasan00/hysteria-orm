import { MongoCollectionKey } from "../../no_sql/mongo/mongo_models/mongo_collection_types";

export type DeleteOptions = {
  ignoreBeforeDeleteHook?: boolean;
};

export type SoftDeleteOptions<T> = {
  column?: MongoCollectionKey<T>;
  value?: string | number | boolean;
  ignoreBeforeDeleteHook?: boolean;
};
