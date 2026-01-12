import { RawNode } from "../ast/query/node/raw/raw_node";
import type { Model } from "../models/model";
import type { ModelKey } from "../models/model_manager/model_manager_types";
import { JsonQueryBuilder } from "./json_query_builder";
import type { WhereQueryBuilder } from "./where_query_builder";

export type PluckReturnType<
  T extends Model,
  K extends ModelKey<T>,
> = T[K] extends infer U ? U[] : never;

/**
 * Common SQL functions with intellisense support.
 * Provides autocomplete for standard SQL aggregate and scalar functions,
 * while still allowing any custom function name via string fallback.
 *
 * @example
 * selectFunc("count", "*", "total")     // Intellisense suggests "count"
 * selectFunc("custom_fn", "col", "res") // Custom functions still work
 */
export type SqlFunction =
  | "count"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "upper"
  | "lower"
  | "length"
  | "trim"
  | "abs"
  | "round"
  | "coalesce"
  | "ceil"
  | "floor"
  | "sqrt"
  | (string & {});

/**
 * Maps SQL function names to their return types.
 * Used by selectFunc to auto-infer the result type.
 *
 * - Numeric functions (count, sum, avg, etc.) → number
 * - String functions (upper, lower, trim) → string
 * - Unknown functions → any
 */
export type SqlFunctionReturnType<F extends string> = F extends
  | "count"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "length"
  | "abs"
  | "round"
  | "ceil"
  | "floor"
  | "sqrt"
  ? number
  : F extends "upper" | "lower" | "trim"
    ? string
    : any;

/**
 * A tuple type for selecting a column with an alias.
 * @example ["id", "userId"] selects "id" column as "userId"
 */
export type SelectTuple<
  C extends string = string,
  A extends string = string,
> = readonly [column: C, alias: A];

/**
 * Input type for select() method in raw query builder.
 * Accepts either a column string or a [column, alias] tuple.
 *
 * @example
 * .select("id", "name")                    // Simple columns
 * .select(["id", "userId"], ["name", "n"]) // Columns with aliases
 * .select("id", ["name", "userName"])      // Mixed
 */
export type Selectable = string | SelectTuple;

/**
 * Unique symbol used internally to mark that a raw select() has been called.
 */
declare const RAW_SELECT_BRAND: unique symbol;

/**
 * Marker type to indicate that a raw select() has been called.
 * @internal
 */
export type RawSelectBrand = { [RAW_SELECT_BRAND]?: never };

/**
 * Utility type to convert a union to an intersection.
 * @internal
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

/**
 * Extracts the final property name from a column selection for raw queries.
 * Supports both string columns and [column, alias] tuples.
 *
 * | Input                        | Output        |
 * |------------------------------|---------------|
 * | `"name"`                     | `"name"`      |
 * | `"users.name"`               | `"name"`      |
 * | `["name", "userName"]`       | `"userName"`  |
 * | `["users.id", "id"]`         | `"id"`        |
 * | `"*"`                        | `never`       |
 * | `"users.*"`                  | `never`       |
 */
export type ExtractRawColumnName<S> = S extends readonly [
  string,
  infer Alias extends string,
]
  ? Alias
  : S extends string
    ? S extends "*"
      ? never
      : S extends `${string}.*`
        ? never
        : S extends `${string}.${infer Column}`
          ? Column extends "*"
            ? never
            : Column
          : S
    : never;

/**
 * Builds the type for a single selected column in a raw query.
 * All column types are `any` since we don't have model type information.
 * Supports both string columns and [column, alias] tuples.
 *
 * | Selection              | Result Type                           |
 * |------------------------|---------------------------------------|
 * | `"*"`                  | `Record<string, any>`                 |
 * | `"table.*"`            | `Record<string, any>`                 |
 * | `"column"`             | `{ column: any }`                     |
 * | `["col", "alias"]`     | `{ alias: any }`                      |
 *
 * @internal
 */
export type BuildRawSingleSelectType<S> = S extends readonly [
  string,
  infer Alias extends string,
]
  ? { [K in Alias]: any }
  : S extends string
    ? S extends "*"
      ? Record<string, any>
      : S extends `${string}.*`
        ? Record<string, any>
        : ExtractRawColumnName<S> extends never
          ? {}
          : {
              [K in ExtractRawColumnName<S> & string]: any;
            }
    : {};

/**
 * Checks if a column selection includes wildcards or is empty.
 * @internal
 */
type HasRawStarOrEmpty<Columns extends readonly Selectable[]> =
  Columns["length"] extends 0
    ? true
    : "*" extends Columns[number]
      ? true
      : false;

/**
 * Builds the combined TypeScript type for multiple selected columns in a raw query.
 * Supports both string columns and [column, alias] tuples.
 *
 * ## Rules
 *
 * 1. **Empty selection or `*`**: Returns `Record<string, any>`
 * 2. **Specific columns**: Returns intersection of all selected column types (all `any`)
 * 3. **With `table.*`**: Adds `Record<string, any>` to allow unknown properties
 *
 * @example
 * // .select("name", ["age", "userAge"])
 * BuildRawSelectType<["name", ["age", "userAge"]]>
 * // Result: { name: any; userAge: any } & RawSelectBrand
 *
 * @example
 * // .select("*")
 * BuildRawSelectType<["*"]>
 * // Result: Record<string, any>
 */
export type BuildRawSelectType<Columns extends readonly Selectable[]> =
  HasRawStarOrEmpty<Columns> extends true
    ? Record<string, any>
    : UnionToIntersection<
          {
            [K in keyof Columns]: BuildRawSingleSelectType<Columns[K]>;
          }[number]
        > extends infer Result
      ? Result extends Record<string, any>
        ? keyof Result extends never
          ? Record<string, any>
          : Result & RawSelectBrand
        : Record<string, any>
      : Record<string, any>;

/**
 * Composes a new selection with the existing selection state for raw queries.
 *
 * - If S is the default Record<string, any> (no previous select), returns just the new selection
 * - If S already has RawSelectBrand (from a previous select), composes with new selection
 *
 * @typeParam S - Current selection state
 * @typeParam Added - New fields being added by the select
 *
 * @example
 * // First selectRaw - creates new selection
 * ComposeRawSelect<Record<string, any>, { count: number }>
 * // Result: RawSelectBrand & { count: number }
 *
 * @example
 * // Chained selectRaw - composes with previous
 * ComposeRawSelect<{ count: number } & RawSelectBrand, { userName: string }>
 * // Result: { count: number } & RawSelectBrand & { userName: string }
 */
export type ComposeRawSelect<
  S extends Record<string, any>,
  Added extends Record<string, any>,
> = (typeof RAW_SELECT_BRAND extends keyof S ? S : RawSelectBrand) & Added;

/**
 * Composes a BuildRawSelectType result with the existing selection state.
 *
 * Similar to ComposeRawSelect but designed for use with BuildRawSelectType.
 *
 * @typeParam S - Current selection state
 * @typeParam Columns - The columns being selected
 */
export type ComposeBuildRawSelect<
  S extends Record<string, any>,
  Columns extends readonly Selectable[],
> = (typeof RAW_SELECT_BRAND extends keyof S ? S : {}) &
  BuildRawSelectType<Columns>;

/**
 * Composes a new selection with the existing selection state for select* methods.
 * Similar to ComposeRawSelect but without the RawSelectBrand.
 *
 * - If S is the default Record<string, any>, returns just the new selection
 * - Otherwise, composes S with the new selection
 *
 * @typeParam S - Current selection state
 * @typeParam Added - New fields being added by the select
 *
 * @example
 * // First selectCount - creates new selection
 * ComposeSelect<Record<string, any>, { count: number }>
 * // Result: { count: number }
 *
 * @example
 * // Chained select - composes with previous
 * ComposeSelect<{ count: number }, { userName: string }>
 * // Result: { count: number } & { userName: string }
 */
export type ComposeSelect<
  S extends Record<string, any>,
  Added extends Record<string, any>,
> = S extends Record<string, any> ? S & Added : Added;

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

/**
 * Validates a column string for raw query builder select().
 * Use [column, alias] tuple format for aliases instead of "column as alias".
 * Use selectFunction() for SQL functions instead of embedding them in select().
 */
export type SelectableColumn<T extends string = string> =
  T extends `${string}.${string}.${string}`
    ? never // Reject multiple dots
    : T extends `${string} ${string}`
      ? never // Reject spaces (use tuple for aliases)
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

export type WriteQueryParam =
  | string
  | number
  | boolean
  | Date
  | RawNode
  | object
  | null
  | undefined;

/**
 * Simple paginated data type for raw query builders (without Model constraint)
 */
export type RawPaginatedData<S extends Record<string, any>> = {
  paginationMetadata: {
    perPage: number;
    currentPage: number;
    firstPage: number;
    isEmpty: boolean;
    total: number;
    lastPage: number;
    hasMorePages: boolean;
    hasPages: boolean;
  };
  data: S[];
};

/**
 * Simple cursor paginated data type for raw query builders (without Model constraint)
 */
export type RawCursorPaginatedData<S extends Record<string, any>> = {
  paginationMetadata: {
    perPage: number;
    firstPage: number;
    isEmpty: boolean;
    total: number;
  };
  data: S[];
};
