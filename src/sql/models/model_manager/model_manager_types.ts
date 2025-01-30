import { FetchHooks } from "../../query_builder/query_builder";
import { SqlDataSource } from "../../sql_data_source";
import { Transaction } from "../../transactions/transaction";
import { Model } from "../model";
import { BelongsTo } from "../relations/belongs_to";
import { HasMany } from "../relations/has_many";
import { HasOne } from "../relations/has_one";

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

export type ModelKey<T> = ExcludeRelations<Omit<T, "$additional">>;
export type ModelRelation<T> = OnlyRelations<Omit<T, "$additional">>;

export type OrderByChoices = "ASC" | "DESC" | "asc" | "desc";
export type OrderByType = {
  [key: string]: OrderByChoices;
};

export type UnrestrictedFindOneType<T> = {
  select?: string[];
  relations?: ModelRelation<T>[];
  ignoreHooks?: FetchHooks[];
  where?: Record<string, any>;
  orderBy?: OrderByType;
  groupBy?: string[];
  offset?: number;
};

export type UnrestrictedFindType<T> = Omit<
  UnrestrictedFindOneType<T>,
  "throwErrorOnNull"
> & {
  limit?: number;
};

export type FindOneType<T> = {
  select?: ModelKey<T>[];
  offset?: number;
  relations?: ModelRelation<T>[];
  orderBy?: OrderByType;
  groupBy?: ModelKey<T>[];
  where?: WhereType<T>;
  ignoreHooks?: FetchHooks[];
  useConnection?: SqlDataSource;
  trx?: Transaction;
};

export type FindType<T> = Omit<FindOneType<T>, "throwErrorOnNull"> & {
  limit?: number;
};
