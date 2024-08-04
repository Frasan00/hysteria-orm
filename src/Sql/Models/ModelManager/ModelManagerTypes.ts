import { MysqlTransaction } from "../../Mysql/MysqlTransaction";
import { PostgresTransaction } from "../../Postgres/PostgresTransaction";
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
  [P in keyof T]?: string | number | boolean | Date | null;
};

export type SelectableType<T> = ExcludeRelations<Omit<T, "extraColumns">>;
export type RelationType<T> = OnlyRelations<Omit<T, "extraColumns">>;

type OrderByType = {
  columns: string[];
  type: "ASC" | "DESC";
};

// model manager only makes and where, for more complex queries use query builder
export type FindOneType<T> = {
  select?: SelectableType<T>[];
  relations?: RelationType<T>[];
  where?: WhereType<T>;
  throwErrorOnNull?: boolean;
};

export type FindType<T> = Omit<FindOneType<T>, "throwError"> & {
  orderBy?: OrderByType;
  groupBy?: string[];
  limit?: number;
  offset?: number;
};

export type TransactionType = MysqlTransaction | PostgresTransaction;
