import { Model } from "../model";
import { FetchHooks } from "../model_query_builder/model_query_builder_types";
import { ModelWithoutRelations } from "../model_types";
import { BelongsTo } from "../relations/belongs_to";
import { HasMany } from "../relations/has_many";
import { HasOne } from "../relations/has_one";

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
    | (Model[] | HasMany)
    | (Model | HasMany)
    | (Model | BelongsTo)
    | (Model[] | BelongsTo)
    | (Model | HasOne)
    | (Model[] | HasOne)
    | ((...args: any[]) => any)
    ? never
    : K;
}[keyof T];

export type OnlyRelations<T> = {
  [K in keyof T]: T[K] extends
    | (Model[] | HasMany)
    | (Model | HasMany)
    | (Model | BelongsTo)
    | (Model[] | BelongsTo)
    | (Model | HasOne)
    | (Model[] | HasOne)
    ? K
    : never;
}[keyof T];

export type WhereType<T> = {
  [K in keyof T]?: T[K];
};

export type ModelKey<T extends Model> = {
  [K in keyof T]: T[K] extends
    | (Model[] | HasMany)
    | (Model | HasMany)
    | (Model | BelongsTo)
    | (Model[] | BelongsTo)
    | (Model | HasOne)
    | (Model[] | HasOne)
    ? never
    : K extends "*"
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

export type UnrestrictedFindOneType<
  T extends Model,
  S extends ModelKey<T>[] = any[],
  R extends ModelRelation<T>[] = never[],
> = {
  select?: S;
  relations?: R;
  ignoreHooks?: FetchHooks[];
  where?: Record<string, any>;
  orderBy?: OrderByType<T>;
  groupBy?: string[];
  offset?: number;
};

export type UnrestrictedFindType<
  T extends Model,
  S extends ModelKey<T>[] = any[],
  R extends ModelRelation<T>[] = never[],
> = Omit<UnrestrictedFindOneType<T, S, R>, "throwErrorOnNull"> & {
  limit?: number;
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
  ignoreHooks?: FetchHooks[];
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
