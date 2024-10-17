import { FetchHooks } from "../../query_builder/query_builder";
import { Sql_data_source } from "../../sql_data_source";
import { Transaction } from "../../transaction";
import { Model } from "../model";
import { Belongs_to } from "../relations/belongs_to";
import { Has_many } from "../relations/has_many";
import { Has_one } from "../relations/has_one";

type ExcludeRelations<T> = {
  [K in keyof T]: T[K] extends
    | (Model[] | Has_many)
    | (Model | Has_many)
    | (Model | Belongs_to)
    | (Model[] | Belongs_to)
    | (Model | Has_one)
    | (Model[] | Has_one)
    | ((...args: any[]) => any)
    ? never
    : K;
}[keyof T];

type OnlyRelations<T> = {
  [K in keyof T]: T[K] extends
    | (Model[] | Has_many)
    | (Model | Has_many)
    | (Model | Belongs_to)
    | (Model[] | Belongs_to)
    | (Model | Has_one)
    | (Model[] | Has_one)
    ? K
    : never;
}[keyof T];

export type WhereType<T> = {
  [K in keyof T]?: string | number | boolean | Date | null;
};

export type SelectableType<T> = ExcludeRelations<Omit<T, "extraColumns">>;
export type RelationType<T> = OnlyRelations<Omit<T, "extraColumns">>;
export type DynamicColumnType<T> = {
  [k in keyof T]: T[k] extends (...args: any[]) => any ? k : never;
}[keyof T];

type OrderByType = {
  columns: string[];
  type: "ASC" | "DESC";
};

export type UnrestrictedFindOneType<T> = {
  select?: string[];
  relations?: RelationType<T>[];
  ignoreHooks?: FetchHooks[];
  dynamicColumns?: DynamicColumnType<T>;
  where?: Record<string, any>;
  useConnection?: Sql_data_source;
  trx?: Transaction;
  throwErrorOnNull?: boolean;
};

export type UnrestrictedFindType<T> = Omit<
  UnrestrictedFindOneType<T>,
  "throwErrorOnNull"
> & {
  orderBy?: OrderByType;
  groupBy?: string[];
  limit?: number;
  offset?: number;
};

export type FindOneType<T> = {
  select?: SelectableType<T>[];
  relations?: RelationType<T>[];
  dynamicColumns?: DynamicColumnType<T>;
  where?: WhereType<T>;
  ignoreHooks?: FetchHooks[];
  useConnection?: Sql_data_source;
  trx?: Transaction;
  throwErrorOnNull?: boolean;
};

export type FindType<T> = Omit<FindOneType<T>, "throwErrorOnNull"> & {
  orderBy?: OrderByType;
  groupBy?: string[];
  limit?: number;
  offset?: number;
};
