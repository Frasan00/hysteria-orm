import { Model } from "./model";

export function getBaseModelInstance<T extends Model>(): T {
  return {} as T;
}
