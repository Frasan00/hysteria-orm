import plural from "pluralize";
import { convertCase } from "../../utils/case_utils";
import { Model } from "./model";

export function getBaseTableName(target: typeof Model): string {
  const className = target.name;
  const snakeCaseName = convertCase(className, "snake");
  return plural(snakeCaseName);
}

export function getBaseModelInstance<T extends Model>(): T {
  return { $annotations: {} } as T;
}
