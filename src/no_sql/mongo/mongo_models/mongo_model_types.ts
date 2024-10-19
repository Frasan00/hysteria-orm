import { convertCase } from "../../../utils/case_utils";
import { MongoDataSource } from "../mongo_data_source";
import { MongoModel } from "./mongo_model";
import { Session } from "../session";

export function getBaseCollectionName(target: typeof MongoModel): string {
  const className = target.name;
  return className.endsWith("s")
    ? convertCase(className, "snake")
    : convertCase(className, "snake") + "s";
}

export type BaseModelMethodOptions = {
  useConnection?: MongoDataSource;
  session?: Session;
};

/**
 * @descriptionAllows Allows a type safe way to make a Partial of T, while keeping the keys that are not in T for unstructured data
 */
export type ModelKeyOrAny<T> = {
  [key in keyof T]?: T[key];
} & {
  [key: string]: any;
};
