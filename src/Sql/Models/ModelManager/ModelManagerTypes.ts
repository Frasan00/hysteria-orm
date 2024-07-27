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
  [P in keyof T]?: string | number | boolean | null;
};

export type SelectType<T> = ExcludeRelations<Omit<T, "aliasColumns">>;
export type RelationType<T> = OnlyRelations<Omit<T, "aliasColumns">>;

type OrderByType = {
  columns: string[];
  type: "ASC" | "DESC";
};

// model manager only makes and where, for more complex queries use query builder
export type FindOneType<T> = {
  select?: SelectType<T>[];
  relations?: RelationType<T>[];
  where?: WhereType<T>;
};

export type FindType<T> = FindOneType<T> & {
  orderBy?: OrderByType;
  groupBy?: string[];
  limit?: number;
  offset?: number;
};

export type TransactionType = {
  createTrx?: string;
  commitTrx?: string;
  rollbackTrx?: string;
};
