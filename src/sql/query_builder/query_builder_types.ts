import { RawNode } from "../ast/query/node/raw/raw_node";
import type { Model } from "../models/model";
import type { ModelKey } from "../models/model_manager/model_manager_types";
import { DryModelQueryBuilder } from "../models/model_query_builder/dry_model_query_builder";
import { DryQueryBuilder } from "./dry_query_builder";
import { JsonQueryBuilder } from "./json_query_builder";
import type { WhereQueryBuilder } from "./where_query_builder";

export type PluckReturnType<
  T extends Model,
  K extends ModelKey<T>,
> = T[K] extends infer U ? U[] : never;

export type WhereOnlyQueryBuilder<T extends Model> = Pick<
  WhereQueryBuilder<T>,
  | "where"
  | "andWhere"
  | "orWhere"
  | "whereNot"
  | "andWhereNot"
  | "orWhereNot"
  | "whereIn"
  | "andWhereIn"
  | "orWhereIn"
  | "whereNotIn"
  | "andWhereNotIn"
  | "orWhereNotIn"
  | "whereBetween"
  | "andWhereBetween"
  | "orWhereBetween"
  | "whereNotBetween"
  | "andWhereNotBetween"
  | "orWhereNotBetween"
  | "whereNull"
  | "andWhereNull"
  | "orWhereNull"
  | "whereNotNull"
  | "andWhereNotNull"
  | "orWhereNotNull"
  | "whereLike"
  | "andWhereLike"
  | "orWhereLike"
  | "whereILike"
  | "andWhereILike"
  | "orWhereILike"
  | "whereNotLike"
  | "andWhereNotLike"
  | "orWhereNotLike"
  | "whereNotILike"
  | "andWhereNotILike"
  | "orWhereNotILike"
  | "whereRegexp"
  | "andWhereRegexp"
  | "orWhereRegexp"
  | "whereNotRegexp"
  | "andWhereNotRegexp"
  | "orWhereNotRegexp"
  | "whereRaw"
  | "andWhereRaw"
  | "orWhereRaw"
  | "whereExists"
  | "orWhereExists"
  | "andWhereExists"
> &
  Pick<
    JsonQueryBuilder<T>,
    | "whereJson"
    | "andWhereJson"
    | "orWhereJson"
    | "whereJsonContains"
    | "andWhereJsonContains"
    | "orWhereJsonContains"
    | "whereJsonNotContains"
    | "andWhereJsonNotContains"
    | "orWhereJsonNotContains"
    | "whereJsonNotContains"
    | "andWhereJsonNotContains"
    | "orWhereJsonNotContains"
    | "whereJsonRaw"
    | "andWhereJsonRaw"
    | "orWhereJsonRaw"
    | "whereJsonNotContains"
    | "andWhereJsonNotContains"
    | "orWhereJsonNotContains"
  >;

export type RelationRetrieveMethod<P extends any> = P extends any[]
  ? "many"
  : "one";

export type SelectableColumn<T extends string = string> =
  T extends `${infer Table}.${infer Column}.${string}`
    ? never // Reject multiple dots
    : T extends `${string}(${string})`
      ? T // Accept function calls: count(*), sum(age), etc.
      : T extends `${string} as ${string}`
        ? T // Accept "column as alias" and "func(args) as alias" format
        : T extends `${string} ${string}`
          ? never // Reject other spaces
          : T extends `.${string}` | `${string}.`
            ? never // Reject leading/trailing dots
            : T extends `${string}-${string}`
              ? never // Reject hyphens
              : T extends `${string}.${string}`
                ? T // Accept table.column format
                : T;

/**
 * @description A column that can be used in a join statement e.g. `users.id`
 */
export type JoinableColumn = `${string}.${string}`;

/**
 * @description Options for streaming queries
 * @sqlite Ignores the options below
 */
export type StreamOptions = {
  highWaterMark?: number;

  /** Postgres only */
  rowMode?: "array";

  /** Postgres only */
  batchSize?: number;

  /** Postgres only */
  types?: any;

  /** Mysql only */
  objectMode?: boolean;
};

export type Cursor<T extends Model, K extends ModelKey<T>> = {
  key: K;
  value: string | number;
};

export type PaginateWithCursorOptions<
  T extends Model,
  K extends ModelKey<T>,
> = {
  discriminator: K;
  operator?: "<" | ">";
  orderBy?: "asc" | "desc";
};

export type UpsertOptionsRawBuilder = {
  updateOnConflict?: boolean;
  returning?: string[];
};

export type DryQueryBuilderWithoutReadOperations = Omit<
  DryQueryBuilder,
  | "many"
  | "one"
  | "oneOrFail"
  | "first"
  | "firstOrFail"
  | "paginate"
  | "paginateWithCursor"
  | "exists"
  | "pluck"
  | "increment"
  | "decrement"
  | "getSum"
  | "getAvg"
  | "getMin"
  | "getMax"
  | "getCount"
  | "stream"
  | "chunk"
  | "paginate"
  | "paginateWithCursor"
  | "exists"
>;

export type DryModelQueryBuilderWithoutReadOperations<
  T extends Model,
  A extends Record<string, any> = {},
  R extends Record<string, any> = {},
> = Omit<
  DryModelQueryBuilder<T, A, R>,
  | "many"
  | "one"
  | "oneOrFail"
  | "first"
  | "firstOrFail"
  | "paginate"
  | "paginateWithCursor"
  | "exists"
  | "pluck"
  | "upsert"
  | "upsertMany"
  | "increment"
  | "decrement"
  | "getSum"
  | "getAvg"
  | "getMin"
  | "getMax"
  | "getCount"
  | "stream"
  | "chunk"
  | "paginate"
  | "paginateWithCursor"
  | "exists"
>;

export type WriteQueryParam =
  | string
  | number
  | boolean
  | Date
  | RawNode
  | object
  | null
  | undefined;
