import type { BaseValues } from "../../ast/query/node/where/where";
import type { SqlDataSourceType } from "../../sql_data_source_types";
import type { Model } from "../model";
import { FetchHooks } from "../model_query_builder/model_query_builder_types";
import {
  ModelDataProperties,
  ModelQueryResult,
  ModelWithoutRelations,
} from "../model_types";
import type { Simplify } from "../../../utils/types";

type NullableAndUndefinable<T> =
  | T
  | (T | null)
  | (T | undefined)
  | (T | null | undefined);

export type UpsertOptions<T extends Model> = {
  ignoreHooks?: boolean;
  updateOnConflict?: boolean;
  returning?: ReturningKey<T>[];
};

export type InsertOptions<T extends Model> = {
  ignoreHooks?: boolean;
  returning?: ReturningKey<T>[];
};

export type UpdateOptions<T extends Model> = {
  returning?: ModelKey<T>[];
};

export type ExcludeRelations<T> = {
  [K in keyof T]: K extends "__tableName"
    ? never
    : T[K] extends
          | NullableAndUndefinable<Model>
          | NullableAndUndefinable<Model[]>
          | ((...args: any[]) => any)
      ? never
      : K;
}[keyof T];

export type OnlyRelations<T> = {
  [K in keyof T]: T[K] extends
    | NullableAndUndefinable<Model>
    | NullableAndUndefinable<Model[]>
    ? K
    : never;
}[keyof T];

export type OnlyM2MRelations<T> = {
  [K in keyof T]: K extends string
    ? T[K] extends NullableAndUndefinable<Model[]>
      ? K
      : never
    : never;
}[keyof T];

export type FindComparisonOperator =
  | "$eq"
  | "$ne"
  | "$gt"
  | "$gte"
  | "$lt"
  | "$lte";

export type BaseWhereType<T> = {
  [K in keyof T as K extends "__tableName"
    ? never
    : T[K] extends Function
      ? never
      : K]?:
    | T[K]
    | { op: "$between"; value: [T[K], T[K]] }
    | { op: "$not between"; value: [T[K], T[K]] }
    | { op: "$regexp"; value: RegExp }
    | { op: "$not regexp"; value: RegExp }
    | { op: "$is null" }
    | { op: "$is not null" }
    | { op: "$like"; value: string }
    | { op: "$not like"; value: string }
    | { op: "$ilike"; value: string }
    | { op: "$not ilike"; value: string }
    | { op: "$in"; value: T[K][] }
    | { op: "$nin"; value: T[K][] }
    | { op: FindComparisonOperator; value: T[K] | T[K][] | null };
};

export type WhereType<T> = BaseWhereType<T> & {
  $and?: WhereType<T>[];
  $or?: WhereType<T>[];
};

/**
 * Internal type that extracts plain (non-prefixed) column keys from a Model.
 * Excludes relations, functions, "*", and the phantom `__tableName` property.
 * @internal – use `ModelKey<T>` for the public API.
 */
export type RawModelKey<T extends Model> = {
  [K in keyof T]: K extends "__tableName"
    ? never
    : T[K] extends
          | NullableAndUndefinable<Model>
          | NullableAndUndefinable<Model[]>
      ? never
      : K extends "*"
        ? never
        : T[K] extends (...args: any[]) => any
          ? never
          : K;
}[keyof T];

/**
 * Strips the table prefix from a `"table.column"` string key.
 * If the key has no prefix, it is returned as-is.
 */
export type StripTablePrefix<K extends string> =
  K extends `${string}.${infer C}` ? C : K;

/**
 * Produces both table-prefixed and plain column keys for `defineModel` models
 * (e.g. `"users.id" | "id" | "users.name" | "name"`).
 * For decorator-based models without a literal table name, falls back to
 * plain column keys only.
 */
export type ModelKey<T extends Model> = T extends {
  __tableName: infer TN extends string;
}
  ? `${TN}.${RawModelKey<T> & string}` | RawModelKey<T>
  : RawModelKey<T>;

/**
 * Valid key for the `returning` option: plain column name or `"*"` for all columns.
 * Uses raw (non-prefixed) keys since returning always refers to the current table.
 */
export type ReturningKey<T extends Model> = RawModelKey<T> | "*";

/**
 * Generic constraint for the `returning` columns parameter.
 * Used as a generic bound on insert/upsert/write methods.
 */
export type ReturningColumns<T extends Model> =
  | readonly ReturningKey<T>[]
  | undefined;

/**
 * Database types that support `RETURNING` on bulk UPDATE/DELETE operations.
 * - PostgreSQL / CockroachDB: native `RETURNING` clause
 * - MSSQL: `OUTPUT` clause
 * Note: INSERT and UPSERT operations support `returning` on all databases.
 */
export type ReturningSupported = "postgres" | "cockroachdb" | "mssql";

/**
 * Constrains the returning parameter for bulk UPDATE/DELETE operations based on database support.
 * On unsupported databases (sqlite, mysql), resolves to `never[]` preventing usage.
 * Note: This type is NOT used for INSERT/UPSERT operations, which support `returning` on all databases.
 */
export type ReturningParam<
  T extends Model,
  D extends SqlDataSourceType,
> = D extends ReturningSupported ? readonly (RawModelKey<T> | "*")[] : never[];

/**
 * Resolves the return type for a single-row write operation (insert) based on returning columns.
 * - `never[]` or `undefined` → `void`
 * - `["*"]` → `ModelQueryResult<T>`
 * - `["col1", "col2"]` → `{ col1: ...; col2: ... }`
 */
export type ReturningResult<
  T extends Model,
  Ret extends readonly any[] | undefined,
> = [Ret] extends [never[]]
  ? void
  : Ret extends undefined
    ? void
    : Ret extends readonly any[]
      ? "*" extends Ret[number]
        ? Simplify<ModelQueryResult<T>, never>
        : Simplify<{ [K in Ret[number] & string & keyof T]: T[K] }, never>
      : void;

/**
 * Resolves the return type for multi-row write operations (insertMany/upsert/upsertMany).
 * Same as ReturningResult but wraps results in arrays.
 */
export type ReturningResultMany<
  T extends Model,
  Ret extends readonly any[] | undefined,
> = [Ret] extends [never[]]
  ? void
  : Ret extends undefined
    ? void
    : Ret extends readonly any[]
      ? "*" extends Ret[number]
        ? Simplify<ModelQueryResult<T>, never>[]
        : Simplify<{ [K in Ret[number] & string & keyof T]: T[K] }, never>[]
      : void;

/**
 * Resolves the return type for mutation operations (update/delete) based on returning columns.
 * - `never[]` → `number` (affected rows count)
 * - `["*"]` → `ModelQueryResult<T>[]`
 * - `["col1", "col2"]` → `{ col1: ...; col2: ... }[]`
 */
export type MutationReturningResult<
  T extends Model,
  Ret extends readonly any[],
> = [Ret] extends [never[]]
  ? number
  : "*" extends Ret[number]
    ? Simplify<ModelQueryResult<T>, never>[]
    : Simplify<{ [K in Ret[number] & string & keyof T]: T[K] }, never>[];

/**
 * Extracts the value type for a model column key, adding `null` for SQL compatibility.
 * Strips any table prefix before indexing into the model type.
 */
export type WhereColumnValue<T extends Model, K extends ModelKey<T>> =
  | T[StripTablePrefix<K & string> & keyof T]
  | null;

/**
 * Resolves the value type for a column in where clauses.
 * For model columns (ModelKey<T>), returns the specific column type.
 * For arbitrary columns (joins, aliases), falls back to BaseValues.
 */
export type ResolveWhereValue<T extends Model, K extends string> =
  K extends ModelKey<T> ? T[StripTablePrefix<K> & keyof T] | null : BaseValues;

export type ModelRelation<T extends Model> = OnlyRelations<T>;

export type OrderByChoices = "asc" | "desc";
export type OrderByType<T extends Model> = {
  [K in keyof T as K extends "__tableName" ? never : K]?: OrderByChoices;
} & {
  [K in string]?: OrderByChoices;
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
  ignoreHooks?: FetchHooks;
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
    : { [K in StripTablePrefix<S[number] & string> & keyof T]: T[K] } & {
        [K in R[number] & keyof T]: T[K];
      }
  : ModelWithoutRelations<T> & { [K in R[number] & keyof T]: T[K] };

/**
 * Return type for write operations (insert/upsert) based on the returning columns.
 * - `undefined` or `[]` -> `void` (no data fetched)
 * - `["*"]` -> `ModelQueryResult<T>` (full model)
 * - `["col1", "col2"]` -> `{ col1: ...; col2: ... } & ModelDataProperties`
 *
 * @typeParam T - The Model type
 * @typeParam R - The returning columns array (literal tuple for type inference)
 */
export type WriteReturnType<
  T extends Model,
  R extends ReturningColumns<T>,
> = R extends undefined
  ? void
  : R extends readonly []
    ? void
    : R extends readonly ReturningKey<T>[]
      ? "*" extends R[number]
        ? ModelQueryResult<T>
        : { [K in R[number] & string & keyof T]: T[K] } & ModelDataProperties
      : never;
