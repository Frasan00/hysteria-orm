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

export type SelectableType<T> = ExcludeRelations<Omit<T, "$additionalColumns">>;
export type RelationType<T> = OnlyRelations<Omit<T, "$additionalColumns">>;
export type DynamicColumnType<T> = {
  [k in keyof T]: T[k] extends (...args: any[]) => any ? k : never;
}[keyof T];

type OrderByType = {
  [key: string]: "ASC" | "DESC";
};

export type UnrestrictedFindOneType<T> = {
  select?: string[];
  relations?: RelationType<T>[];
  ignoreHooks?: FetchHooks[];
  dynamicColumns?: DynamicColumnType<T>;
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
  select?: SelectableType<T>[];
  offset?: number;
  relations?: RelationType<T>[];
  orderBy?: OrderByType;
  groupBy?: SelectableType<T>[];
  dynamicColumns?: DynamicColumnType<T>;
  where?: WhereType<T>;
  ignoreHooks?: FetchHooks[];
  useConnection?: SqlDataSource;
  trx?: Transaction;
};

export type FindType<T> = Omit<FindOneType<T>, "throwErrorOnNull"> & {
  limit?: number;
};
