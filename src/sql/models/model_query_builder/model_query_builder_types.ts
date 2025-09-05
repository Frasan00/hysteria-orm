import { SqlMethod } from "../../ast/query/node/select/select_types";
import { Model } from "../../models/model";
import { ModelRelation } from "../model_manager/model_manager_types";
import { ModelWithoutRelations } from "../model_types";

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

export type AnnotatedModel<
  T extends Model,
  A extends object = {},
  R extends object = {},
> = [keyof A] extends [never]
  ? ModelWithoutRelations<T> & R
  : ModelWithoutRelations<T> & { $annotations: A } & R;

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

export type RelatedInstance<
  M extends Model,
  K extends ModelRelation<M>,
> = M[K] extends (infer R)[]
  ? R extends Model
    ? R
    : never
  : M[K] extends Model
    ? M[K]
    : never;
