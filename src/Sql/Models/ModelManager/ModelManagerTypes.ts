import { FetchHooks } from "../../QueryBuilder/QueryBuilder";
import { SqlDataSource } from "../../SqlDatasource";
import { Transaction } from "../../Transaction";
import { Model } from "../Model";
import { BelongsTo } from "../Relations/BelongsTo";
import { HasMany } from "../Relations/HasMany";
import { HasOne } from "../Relations/HasOne";

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
  useConnection?: SqlDataSource;
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
  useConnection?: SqlDataSource;
  trx?: Transaction;
  throwErrorOnNull?: boolean;
};

export type FindType<T> = Omit<FindOneType<T>, "throwErrorOnNull"> & {
  orderBy?: OrderByType;
  groupBy?: string[];
  limit?: number;
  offset?: number;
};
