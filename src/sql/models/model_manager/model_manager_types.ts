import { Model } from "../model";
import { FetchHooks } from "../model_query_builder/model_query_builder_types";
import { ModelWithoutRelations } from "../model_types";

type NullableAndUndefinable<T> =
  | T
  | (T | null)
  | (T | undefined)
  | (T | null | undefined);

export type UpsertOptions<T extends Model> = {
  ignoreHooks?: boolean;
  updateOnConflict?: boolean;
  returning?: ModelKey<T>[];
};

export type InsertOptions<T extends Model> = {
  ignoreHooks?: boolean;
  returning?: ModelKey<T>[];
};

export type UpdateOptions<T extends Model> = {
  returning?: ModelKey<T>[];
};

export type ExcludeRelations<T> = {
  [K in keyof T]: T[K] extends
    | NullableAndUndefinable<Model>
    | NullableAndUndefinable<Model[]>
    | ((...args: any[]) => any)
    ? never
    : K;
}[keyof T];

export type OnlyRelations<T> = {
  [K in keyof T]: T[K] extends
    | NullableAndUndefinable<Model>
    | NullableAndUndefinable<Model[]>
    ? K
    : never;
}[keyof T];

export type OnlyM2MRelations<T> = {
  [K in keyof T]: K extends string
    ? T[K] extends NullableAndUndefinable<Model[]>
      ? K
      : never
    : never;
}[keyof T];

export type FindComparisonOperator =
  | "$eq"
  | "$ne"
  | "$gt"
  | "$gte"
  | "$lt"
  | "$lte";

export type BaseWhereType<T> = {
  [K in keyof T as T[K] extends Function ? never : K]?:
    | T[K]
    | { op: "$between"; value: [T[K], T[K]] }
    | { op: "$not between"; value: [T[K], T[K]] }
    | { op: "$regexp"; value: RegExp }
    | { op: "$not regexp"; value: RegExp }
    | { op: "$is null" }
    | { op: "$is not null" }
    | { op: "$like"; value: string }
    | { op: "$not like"; value: string }
    | { op: "$ilike"; value: string }
    | { op: "$not ilike"; value: string }
    | { op: "$in"; value: T[K][] }
    | { op: "$nin"; value: T[K][] }
    | { op: FindComparisonOperator; value: T[K] | T[K][] | null };
};

export type WhereType<T> = BaseWhereType<T> & {
  $and?: WhereType<T>[];
  $or?: WhereType<T>[];
};

export type ModelKey<T extends Model> = {
  [K in keyof T]: T[K] extends
    | NullableAndUndefinable<Model>
    | NullableAndUndefinable<Model[]>
    ? never
    : K extends "*"
      ? never
      : T[K] extends (...args: any[]) => any
        ? never
        : K;
}[keyof T];

export type ModelRelation<T extends Model> = OnlyRelations<T>;

export type OrderByChoices = "asc" | "desc";
export type OrderByType<T extends Model> = {
  [K in keyof T]?: OrderByChoices;
} & {
  [K in string]?: OrderByChoices;
};

export type FindOneType<
  T extends Model,
  S extends ModelKey<T>[] = any[],
  R extends ModelRelation<T>[] = never[],
> = {
  select?: S;
  offset?: number;
  relations?: R;
  orderBy?: OrderByType<T>;
  groupBy?: ModelKey<T>[];
  where?: WhereType<T>;
  ignoreHooks?: FetchHooks;
};

export type FindType<
  T extends Model,
  S extends ModelKey<T>[] = any[],
  R extends ModelRelation<T>[] = never[],
> = Omit<FindOneType<T, S, R>, "throwErrorOnNull"> & {
  limit?: number;
};

export type FindReturnType<
  T extends Model,
  S extends ModelKey<T>[] = any[],
  R extends ModelRelation<T>[] = never[],
> = S extends readonly any[]
  ? S[number] extends never
    ? ModelWithoutRelations<T> & { [K in R[number] & keyof T]: T[K] }
    : { [K in S[number] & keyof T]: T[K] } & {
        [K in R[number] & keyof T]: T[K];
      }
  : ModelWithoutRelations<T> & { [K in R[number] & keyof T]: T[K] };
