import { Model } from "../../models/model";
import { SqlMethod } from "../../resources/query/SELECT";

export type ModelInstanceType<O> = O extends typeof Model
  ? InstanceType<O>
  : never;

export type FetchHooks = "beforeFetch" | "afterFetch";

export type OneOptions = {
  ignoreHooks?: FetchHooks[];
};

export type ManyOptions = {
  ignoreHooks?: FetchHooks[];
};

export type AnnotatedModel<T extends Model, A> = keyof A extends never
  ? T
  : T & { $annotations: { [K in keyof A]: A[K] } };

export type CommonSqlMethodReturnType<T extends SqlMethod> =
  // Aggregates
  T extends "count" | "sum" | "avg" | "min" | "max"
    ? number
    : // String methods
      T extends "upper" | "lower" | "trim"
      ? string
      : T extends "length"
        ? number
        : // Type conversion
          T extends "cast" | "convert"
          ? any
          : // Other
            T extends "abs" | "round" | "floor" | "ceil"
            ? number
            : // Fallback
              any;
