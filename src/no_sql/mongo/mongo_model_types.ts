import { convertCase } from "../../utils/case_utils";
import { MongoModel } from "./mongo_model";

export function getBaseCollectionName(target: typeof MongoModel): string {
  const className = target.name;
  return className.endsWith("s")
    ? convertCase(className, "snake")
    : convertCase(className, "snake") + "s";
}
