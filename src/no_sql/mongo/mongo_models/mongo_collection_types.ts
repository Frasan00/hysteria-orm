import { convertCase } from "../../../utils/case_utils";
import { MongoDataSource } from "../mongo_data_source";
import { Collection } from "./mongo_collection";
import * as mongodb from "mongodb";
import { plural } from "pluralize";

export function getBaseCollectionName(target: typeof Collection): string {
  const className = target.name;
  const snakeCaseName = convertCase(className, "snake");
  return plural(snakeCaseName);
}

export type BaseModelMethodOptions = {
  useConnection?: MongoDataSource;
  session?: mongodb.ClientSession;
};

/**
 * @descriptionAllows Allows a type safe way to make a Partial of T, while keeping the keys that are not in T for unstructured data
 */
export type ModelKeyOrAny<T> = {
  [key in keyof T]?: T[key];
} & {
  [key: string]: any;
};

/**
 * @description Allows a type-safe way to make a Partial of T, while keeping the keys that are not in T for unstructured data, with values restricted to 1 or -1
 */
export type ModelKeyOrAnySort<T> = {
  [key in keyof T]?: 1 | -1;
} & {
  [key: string]: 1 | -1;
};
