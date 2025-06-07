import { convertCase } from "../../../utils/case_utils";
import { MongoDataSource } from "../mongo_data_source";
import { Collection } from "./mongo_collection";
import pkg from "pluralize";
const { plural } = pkg;

export type MongoCollectionKey<T> = T extends Collection ? T : never;

export function getBaseCollectionName(target: typeof Collection): string {
  const className = target.name;
  const snakeCaseName = convertCase(className, "snake");
  return plural(snakeCaseName);
}

export type BaseModelMethodOptions = {
  useConnection?: MongoDataSource;
  session?: ReturnType<MongoDataSource["startSession"]>;
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
