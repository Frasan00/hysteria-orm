import { Model } from "../model";
import { FetchHooks } from "../model_query_builder/model_query_builder_types";
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

type ExcludeRelations<T> = {
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

type OnlyRelations<T> = {
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
  [K in keyof T]?: string | number | boolean | Date | null;
};

export type ModelKey<T extends Model> = ExcludeRelations<T>;

export type ModelRelation<T extends Model> = OnlyRelations<T>;

export type OrderByChoices = "asc" | "desc" | "asc" | "desc";
export type OrderByType = {
  [key: string]: OrderByChoices;
};

export type UnrestrictedFindOneType<T extends Model> = {
  select?: string[];
  relations?: ModelRelation<T>[];
  ignoreHooks?: FetchHooks[];
  where?: Record<string, any>;
  orderBy?: OrderByType;
  groupBy?: string[];
  offset?: number;
};

export type UnrestrictedFindType<T extends Model> = Omit<
  UnrestrictedFindOneType<T>,
  "throwErrorOnNull"
> & {
  limit?: number;
};

export type FindOneType<T extends Model> = {
  select?: ModelKey<T>[];
  offset?: number;
  relations?: ModelRelation<T>[];
  orderBy?: OrderByType;
  groupBy?: ModelKey<T>[];
  where?: WhereType<T>;
  ignoreHooks?: FetchHooks[];
};

export type FindType<T extends Model> = Omit<
  FindOneType<T>,
  "throwErrorOnNull"
> & {
  limit?: number;
};
