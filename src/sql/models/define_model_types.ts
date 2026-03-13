import type { CaseConvention } from "../../utils/case_utils";
import type { OnUpdateOrDelete } from "../migrations/schema/schema_types";
import type { Model } from "./model";
import type { ModelQueryBuilder } from "./model_query_builder/model_query_builder";
import type {
  AsymmetricEncryptionOptions,
  CheckType,
  ColumnOptions,
  ColumnType,
  DateColumnOptions,
  DatetimeColumnOptions,
  IndexType,
  LazyRelationType,
  ManyToManyStringOptions,
  SymmetricEncryptionOptions,
  ThroughModel,
  UniqueType,
} from "./decorators/model_decorators_types";
import type { ModelKey } from "./model_manager/model_manager_types";
/**
 * Phantom-typed descriptor for a model column.
 * `T` carries the TypeScript type the column resolves to at the instance level.
 */
export interface ColumnDef<T = unknown> {
  readonly _phantom: T;
  readonly _isPrimary?: boolean;
  readonly _apply: (target: Object, propertyKey: string) => void;
}

/**
 * A column descriptor marked as a primary key.
 * Used by `col.primary()`, `col.increment()`, and `col.bigIncrement()` to
 * carry PK type information for `defineModel` type inference.
 */
export interface PrimaryColumnDef<T = unknown> extends ColumnDef<T> {
  readonly _isPrimary: true;
}

/**
 * Phantom-typed descriptor for a model relation.
 * `T` carries the TypeScript type the relation resolves to at the instance level.
 */
export interface RelationDef<T = any> {
  readonly _phantom: T;
  readonly _apply: (target: Object, propertyKey: string) => void;
}

// ---------------------------------------------------------------------------
// Column descriptor option types (mirror decorator option types, minus
// `serialize`/`prepare` which are handled internally by the typed helpers)
// ---------------------------------------------------------------------------
// Column option types for defineModel
// ---------------------------------------------------------------------------
// The `default` property on all column options below is **migration-only
// metadata** used by auto-generated migrations (CREATE TABLE / ALTER TABLE).
// It does NOT enforce a default value during `insert()` — to set a value at
// insert time, use the `prepare` callback on the column decorator or pass
// the value explicitly in your insert payload.
// ---------------------------------------------------------------------------

export type ColOptions = Omit<
  ColumnOptions,
  "primaryKey" | "serialize" | "prepare" | "default"
> & {
  length?: number;
};
export type ColPrimaryOptions = Omit<
  ColumnOptions,
  "primaryKey" | "serialize" | "prepare" | "default"
>;
export type ColStringOptions = Omit<
  ColumnOptions,
  "type" | "serialize" | "prepare" | "default"
> & {
  length?: number;
};
export type ColTextOptions = Omit<
  ColumnOptions,
  "type" | "serialize" | "prepare" | "default"
>;
export type ColIntegerOptions = Omit<
  ColumnOptions,
  "serialize" | "prepare" | "default"
>;
export type ColBigIntegerOptions = Omit<
  ColumnOptions,
  "serialize" | "prepare" | "default"
>;
export type ColFloatOptions = Omit<
  ColumnOptions,
  "serialize" | "prepare" | "default"
>;
export type ColDecimalOptions = Omit<
  ColumnOptions,
  "serialize" | "prepare" | "default"
> & {
  precision?: number;
  scale?: number;
};
export type ColIncrementOptions = Omit<
  ColumnOptions,
  "serialize" | "prepare" | "primaryKey" | "nullable" | "default"
>;
export type ColBigIncrementOptions = Omit<
  ColumnOptions,
  "serialize" | "prepare" | "primaryKey" | "nullable" | "default"
>;
export type ColBooleanOptions = Omit<
  ColumnOptions,
  "prepare" | "serialize" | "default"
>;
export type ColDateOptions = Omit<
  DateColumnOptions,
  "format" | "serialize" | "prepare" | "default"
>;
export type ColDatetimeOptions = Omit<
  DatetimeColumnOptions,
  "serialize" | "prepare" | "default"
>;
export type ColTimestampOptions = Omit<
  DatetimeColumnOptions,
  "serialize" | "prepare" | "default"
>;
export type ColTimeOptions = Omit<
  DateColumnOptions,
  "format" | "serialize" | "prepare" | "default"
>;
export type ColJsonOptions = Omit<
  ColumnOptions,
  "prepare" | "serialize" | "default"
>;
export type ColJsonbOptions = Omit<
  ColumnOptions,
  "prepare" | "serialize" | "default"
>;
export type ColUuidOptions = Omit<
  ColumnOptions,
  "prepare" | "serialize" | "default"
>;
export type ColUlidOptions = Omit<
  ColumnOptions,
  "prepare" | "serialize" | "default"
>;
export type ColBinaryOptions = Omit<
  ColumnOptions,
  "type" | "serialize" | "prepare" | "default"
>;
export type ColEnumOptions = Omit<
  ColumnOptions,
  "type" | "serialize" | "prepare" | "default"
>;
export type ColSymmetricOptions = Omit<
  SymmetricEncryptionOptions,
  "prepare" | "serialize"
>;
export type ColAsymmetricOptions = Omit<
  AsymmetricEncryptionOptions,
  "prepare" | "serialize"
>;
export type ColCharOptions = Omit<
  ColumnOptions,
  "type" | "serialize" | "prepare" | "default"
> & {
  length?: number;
};
export type ColVarbinaryOptions = Omit<
  ColumnOptions,
  "type" | "serialize" | "prepare" | "default"
> & {
  length?: number;
};
export type ColTinyIntOptions = Omit<
  ColumnOptions,
  "type" | "serialize" | "prepare" | "default"
>;
export type ColSmallIntOptions = Omit<
  ColumnOptions,
  "type" | "serialize" | "prepare" | "default"
>;
export type ColMediumIntOptions = Omit<
  ColumnOptions,
  "type" | "serialize" | "prepare" | "default"
>;

// ---------------------------------------------------------------------------
// Relation descriptor option types
// ---------------------------------------------------------------------------

export type RelationConstraintOptions = {
  /**
   * Useful for auto generated migrations to specify the on delete action, it does not affect the code wise implementation
   */
  onDelete?: OnUpdateOrDelete;
  /**
   * Useful for auto generated migrations to specify the on update action, it does not affect the code wise implementation
   */
  onUpdate?: OnUpdateOrDelete;
  /**
   * Useful for auto generated migrations to specify the constraint name, it does not affect the code wise implementation
   */
  constraintName?: string;
};

export type RelationNullableOption = { nullable?: boolean };

// ---------------------------------------------------------------------------
// Nullable conditional helper
// ---------------------------------------------------------------------------

/**
 * Resolves to `Base` when `Opts` has `{ nullable: false }`, otherwise
 * `Base | null`. This powers nullable-aware type inference
 * for `col.*()` methods.
 */
export type NullableColumn<Base, Opts> = Opts extends { nullable: false }
  ? Base
  : Opts extends { primaryKey: true }
    ? Base
    : Base | null;

// ---------------------------------------------------------------------------
// Typed serialize / prepare callback helpers
// ---------------------------------------------------------------------------

export type TypedSerialize<T> = { serialize?: (value: any) => T };
export type TypedPrepare<T> = { prepare?: (value: T) => any };
export type TypedDefault<T> = {
  /**
   * Narrows the `default` property to the column's base type.
   * @migration Migration-only metadata. Sets the DEFAULT clause in CREATE TABLE / ALTER TABLE.
   * Does **not** enforce a value during `insert()` — pass the value explicitly or use `prepare`.
   */
  default?: T | null;
};

// ---------------------------------------------------------------------------
// col namespace type
// ---------------------------------------------------------------------------

export interface ColNamespace {
  /**
   * Generic column — you control the TypeScript type via `col<T>()`.
   * Use for columns whose type doesn't match any built-in helper.
   *
   * Supports typed `serialize` and `prepare` callbacks.
   *
   * ```ts
   * col<string>({ nullable: false })
   * col<MyCustomType>({ serialize: (raw) => parse(raw), prepare: (v) => stringify(v) })
   * ```
   */
  <T = unknown>(
    options?: ColOptions &
      TypedSerialize<T> &
      TypedPrepare<T> &
      TypedDefault<T>,
  ): ColumnDef<T>;

  /**
   * Generic primary key column. Defaults to `string | number`.
   * Override the generic when you know the exact type.
   * If using Auto Generated Migrations, ensure to add a `type` property in the options to help migrations generate the correct column type.
   *
   * ```ts
   * col.primary<number>({ type: "bigIncrement", nullable: false })
   * ```
   */
  primary<T = string | number>(
    options?: ColPrimaryOptions &
      TypedSerialize<T> &
      TypedPrepare<T> &
      TypedDefault<T>,
  ): PrimaryColumnDef<T>;

  /**
   * VARCHAR column. Accepts an optional `length` option.
   * Type: `string` (nullable-aware).
   *
   * ```ts
   * col.string({ length: 255, nullable: false }) // string
   * col.string()                                  // string | null
   * ```
   */
  string<O extends ColStringOptions = ColStringOptions>(
    options?: O &
      TypedSerialize<NullableColumn<string, O>> &
      TypedPrepare<NullableColumn<string, O>> &
      TypedDefault<string>,
  ): ColumnDef<NullableColumn<string, O>>;

  /**
   * LONGTEXT column for large text content.
   * Type: `string` (nullable-aware).
   */
  text<O extends ColTextOptions = ColTextOptions>(
    options?: O &
      TypedSerialize<NullableColumn<string, O>> &
      TypedPrepare<NullableColumn<string, O>> &
      TypedDefault<string>,
  ): ColumnDef<NullableColumn<string, O>>;

  /**
   * Integer column.
   * Type: `number` (nullable-aware). Only `prepare` is exposed (no `serialize`).
   */
  integer<O extends ColIntegerOptions = ColIntegerOptions>(
    options?: O &
      TypedPrepare<NullableColumn<number, O>> &
      TypedDefault<number>,
  ): ColumnDef<NullableColumn<number, O>>;

  /**
   * Big integer column for values exceeding 32-bit range.
   * Type: `number` (nullable-aware). Only `prepare` is exposed.
   */
  bigInteger<O extends ColBigIntegerOptions = ColBigIntegerOptions>(
    options?: O &
      TypedPrepare<NullableColumn<number, O>> &
      TypedDefault<number>,
  ): ColumnDef<NullableColumn<number, O>>;

  /**
   * Floating-point column.
   * Type: `number` (nullable-aware). Only `prepare` is exposed.
   */
  float<O extends ColFloatOptions = ColFloatOptions>(
    options?: O &
      TypedPrepare<NullableColumn<number, O>> &
      TypedDefault<number>,
  ): ColumnDef<NullableColumn<number, O>>;

  /**
   * Decimal column with optional `precision` and `scale`.
   * Type: `number` (nullable-aware). Only `prepare` is exposed.
   *
   * ```ts
   * col.decimal({ precision: 10, scale: 2, nullable: false }) // number
   * ```
   */
  decimal<O extends ColDecimalOptions = ColDecimalOptions>(
    options?: O &
      TypedPrepare<NullableColumn<number, O>> &
      TypedDefault<number>,
  ): ColumnDef<NullableColumn<number, O>>;

  /**
   * Auto-incrementing integer primary key. Always non-nullable.
   * Type: `number`. Only `prepare` is exposed.
   */
  increment(
    options?: ColIncrementOptions & TypedPrepare<number> & TypedDefault<number>,
  ): PrimaryColumnDef<number>;

  /**
   * Auto-incrementing bigint primary key. Always non-nullable.
   * Type: `number`. Only `prepare` is exposed.
   */
  bigIncrement(
    options?: ColBigIncrementOptions &
      TypedPrepare<number> &
      TypedDefault<number>,
  ): PrimaryColumnDef<number>;

  /**
   * Boolean column.
   * Type: `boolean` (nullable-aware). No `serialize` or `prepare` exposed.
   */
  boolean<O extends ColBooleanOptions = ColBooleanOptions>(
    options?: O & TypedDefault<boolean>,
  ): ColumnDef<NullableColumn<boolean, O>>;

  /**
   * DATE column (YYYY-MM-DD). Defaults to `Date` because database drivers
   * return `Date` objects.
   *
   * Pass a `serialize` function to type the column as `string` instead:
   *
   * ```ts
   * col.date({ nullable: false, serialize: (raw) => raw.toISOString().split("T")[0] }) // string
   * col.date({ nullable: false })                                                       // Date
   * col.date({ serialize: (raw) => raw.toISOString().split("T")[0] })                  // string | null
   * col.date()                                                                          // Date | null
   * ```
   * @warning Serialize functions for Date columns can only return a string
   */
  date(
    options: ColDateOptions & { nullable: false } & {
      serialize: (value: any) => string;
    } & TypedPrepare<string> &
      TypedDefault<string>,
  ): ColumnDef<string>;
  date(
    options: ColDateOptions & { nullable: false } & TypedPrepare<Date> &
      TypedDefault<string>,
  ): ColumnDef<Date>;
  date(
    options: ColDateOptions & {
      serialize: (value: any) => string | null;
    } & TypedPrepare<string | null> &
      TypedDefault<string>,
  ): ColumnDef<string | null>;
  date(
    options?: ColDateOptions & TypedPrepare<Date | null> & TypedDefault<string>,
  ): ColumnDef<Date | null>;

  /**
   * DATETIME column. Defaults to `Date` because database drivers return
   * `Date` objects.
   *
   * Pass a `serialize` function to type the column as `string` instead:
   *
   * ```ts
   * col.datetime({ nullable: false, serialize: (raw) => new Date(raw).toISOString() }) // string
   * col.datetime({ nullable: false })                                                   // Date
   * col.datetime({ serialize: (raw) => new Date(raw).toISOString() })                  // string | null
   * col.datetime()                                                                      // Date | null
   * ```
   * @warning Serialize functions for Date columns can only return a string
   */
  datetime(
    options: ColDatetimeOptions & { nullable: false } & {
      serialize: (value: any) => string;
    } & TypedPrepare<string> &
      TypedDefault<string>,
  ): ColumnDef<string>;
  datetime(
    options: ColDatetimeOptions & { nullable: false } & TypedPrepare<Date> &
      TypedDefault<string>,
  ): ColumnDef<Date>;
  datetime(
    options: ColDatetimeOptions & {
      serialize: (value: any) => string | null;
    } & TypedPrepare<string | null> &
      TypedDefault<string>,
  ): ColumnDef<string | null>;
  datetime(
    options?: ColDatetimeOptions &
      TypedPrepare<Date | null> &
      TypedDefault<string>,
  ): ColumnDef<Date | null>;

  /**
   * TIMESTAMP column. Defaults to `Date` because database drivers return
   * `Date` objects.
   *
   * Pass a `serialize` function to type the column as `string` instead:
   *
   * ```ts
   * col.timestamp({ nullable: false, serialize: (raw) => new Date(raw).toISOString() }) // string
   * col.timestamp({ nullable: false })                                                   // Date
   * col.timestamp({ serialize: (raw) => new Date(raw).toISOString() })                  // string | null
   * col.timestamp()                                                                      // Date | null
   * ```
   * @warning Serialize functions for Date columns can only return a string
   */
  timestamp(
    options: ColTimestampOptions & { nullable: false } & {
      serialize: (value: any) => string;
    } & TypedPrepare<string> &
      TypedDefault<string>,
  ): ColumnDef<string>;
  timestamp(
    options: ColTimestampOptions & { nullable: false } & TypedPrepare<Date> &
      TypedDefault<string>,
  ): ColumnDef<Date>;
  timestamp(
    options: ColTimestampOptions & {
      serialize: (value: any) => string | null;
    } & TypedPrepare<string | null> &
      TypedDefault<string>,
  ): ColumnDef<string | null>;
  timestamp(
    options?: ColTimestampOptions &
      TypedPrepare<Date | null> &
      TypedDefault<string>,
  ): ColumnDef<Date | null>;

  /**
   * TIME column. Defaults to `Date` because database drivers return
   * `Date` objects.
   *
   * Pass a `serialize` function to type the column as `string` instead:
   *
   * ```ts
   * col.time({ nullable: false, serialize: (raw) => new Date(raw).toTimeString() }) // string
   * col.time({ nullable: false })                                                    // Date
   * col.time({ serialize: (raw) => new Date(raw).toTimeString() })                  // string | null
   * col.time()                                                                       // Date | null
   * ```
   * @warning Serialize functions for Date columns can only return a string
   */
  time(
    options: ColTimeOptions & { nullable: false } & {
      serialize: (value: any) => string;
    } & TypedPrepare<string> &
      TypedDefault<string>,
  ): ColumnDef<string>;
  time(
    options: ColTimeOptions & { nullable: false } & TypedPrepare<Date> &
      TypedDefault<string>,
  ): ColumnDef<Date>;
  time(
    options: ColTimeOptions & {
      serialize: (value: any) => string | null;
    } & TypedPrepare<string | null> &
      TypedDefault<string>,
  ): ColumnDef<string | null>;
  time(
    options?: ColTimeOptions & TypedPrepare<Date | null> & TypedDefault<string>,
  ): ColumnDef<Date | null>;

  /**
   * JSON column (`type: "json"`). Defaults to `unknown`.
   * Pass a concrete type for structured JSON data: `col.json<MyType>()`.
   *
   * No `serialize` or `prepare` exposed — serialization is handled internally.
   *
   * ```ts
   * col.json<{ theme: string }>({ nullable: false }) // { theme: string }
   * col.json()                                        // unknown | null
   * ```
   */
  json<T = unknown>(
    options: ColJsonOptions & { nullable: false } & TypedDefault<string>,
  ): ColumnDef<T>;
  json<T = unknown>(
    options?: ColJsonOptions & TypedDefault<string>,
  ): ColumnDef<T | null>;

  /**
   * JSONB column (`type: "jsonb"`). Defaults to `unknown`.
   * Prefer over `col.json()` on PostgreSQL for indexing support.
   * Pass a concrete type for structured JSON data: `col.jsonb<MyType>()`.
   *
   * No `serialize` or `prepare` exposed — serialization is handled internally.
   *
   * ```ts
   * col.jsonb<{ theme: string }>({ nullable: false }) // { theme: string }
   * col.jsonb()                                        // unknown | null
   * ```
   */
  jsonb<T = unknown>(
    options: ColJsonbOptions & { nullable: false } & TypedDefault<string>,
  ): ColumnDef<T>;
  jsonb<T = unknown>(
    options?: ColJsonbOptions & TypedDefault<string>,
  ): ColumnDef<T | null>;

  /**
   * UUID column. Auto-generates a UUID if no value is provided on insert.
   * Type: `string` (nullable-aware). Only `serialize` is exposed.
   */
  uuid<O extends ColUuidOptions = ColUuidOptions>(
    options?: O &
      TypedSerialize<NullableColumn<string, O>> &
      TypedDefault<string>,
  ): ColumnDef<NullableColumn<string, O>>;

  /**
   * ULID column. Auto-generates a ULID if no value is provided on insert.
   * Type: `string` (nullable-aware). Only `serialize` is exposed.
   */
  ulid<O extends ColUlidOptions = ColUlidOptions>(
    options?: O &
      TypedSerialize<NullableColumn<string, O>> &
      TypedDefault<string>,
  ): ColumnDef<NullableColumn<string, O>>;

  /**
   * Binary/blob column.
   * Type: `Buffer | Uint8Array | string` (nullable-aware).
   * Supports typed `serialize` and `prepare`.
   */
  binary<
    T extends Buffer | Uint8Array | string = Buffer | Uint8Array | string,
    O extends ColBinaryOptions = ColBinaryOptions,
  >(
    options?: O &
      TypedSerialize<NullableColumn<T, O>> &
      TypedPrepare<NullableColumn<T, O>> &
      TypedDefault<string>,
  ): ColumnDef<NullableColumn<T, O>>;

  /**
   * Enum column constrained to the given values array.
   * Type: `values[number]` (nullable-aware).
   *
   * ```ts
   * col.enum(["active", "inactive"] as const)               // "active" | "inactive" | null
   * col.enum(["active", "inactive"] as const, { nullable: false }) // "active" | "inactive"
   * ```
   */
  enum<
    const V extends readonly string[],
    O extends ColEnumOptions = ColEnumOptions,
  >(
    values: V,
    options?: O &
      TypedSerialize<NullableColumn<V[number], O>> &
      TypedPrepare<NullableColumn<V[number], O>> &
      TypedDefault<V[number]>,
  ): ColumnDef<NullableColumn<V[number], O>>;

  /**
   * CHAR column (fixed-length string). Accepts an optional `length` option.
   * Type: `string` (nullable-aware).
   *
   * ```ts
   * col.char({ length: 10, nullable: false }) // string
   * col.char({ length: 2 })                   // string | null
   * ```
   */
  char<O extends ColCharOptions = ColCharOptions>(
    options?: O &
      TypedSerialize<NullableColumn<string, O>> &
      TypedPrepare<NullableColumn<string, O>> &
      TypedDefault<string>,
  ): ColumnDef<NullableColumn<string, O>>;

  /**
   * VARBINARY column. Accepts an optional `length` option.
   * Type: `Buffer | Uint8Array | string` (nullable-aware).
   *
   * ```ts
   * col.varbinary({ length: 255, nullable: false }) // Buffer | Uint8Array | string
   * col.varbinary()                                  // Buffer | Uint8Array | string | null
   * ```
   */
  varbinary<O extends ColVarbinaryOptions = ColVarbinaryOptions>(
    options?: O &
      TypedSerialize<NullableColumn<Buffer | Uint8Array | string, O>> &
      TypedPrepare<NullableColumn<Buffer | Uint8Array | string, O>> &
      TypedDefault<string>,
  ): ColumnDef<NullableColumn<Buffer | Uint8Array | string, O>>;

  /**
   * TINYINT column.
   * Type: `number` (nullable-aware). Only `prepare` is exposed.
   */
  tinyint<O extends ColTinyIntOptions = ColTinyIntOptions>(
    options?: O &
      TypedPrepare<NullableColumn<number, O>> &
      TypedDefault<number>,
  ): ColumnDef<NullableColumn<number, O>>;

  /**
   * SMALLINT column.
   * Type: `number` (nullable-aware). Only `prepare` is exposed.
   */
  smallint<O extends ColSmallIntOptions = ColSmallIntOptions>(
    options?: O &
      TypedPrepare<NullableColumn<number, O>> &
      TypedDefault<number>,
  ): ColumnDef<NullableColumn<number, O>>;

  /**
   * MEDIUMINT column.
   * Type: `number` (nullable-aware). Only `prepare` is exposed.
   */
  mediumint<O extends ColMediumIntOptions = ColMediumIntOptions>(
    options?: O &
      TypedPrepare<NullableColumn<number, O>> &
      TypedDefault<number>,
  ): ColumnDef<NullableColumn<number, O>>;

  /** Encryption column helpers. */
  encryption: {
    /**
     * Symmetric encryption column (AES). Requires `key` in options.
     * Type: `string` (nullable-aware). No `serialize` or `prepare` exposed.
     */
    symmetric<O extends ColSymmetricOptions = ColSymmetricOptions>(
      options: O,
    ): ColumnDef<NullableColumn<string, O>>;

    /**
     * Asymmetric encryption column (RSA). Requires `publicKey` and
     * `privateKey` in options.
     * Type: `string` (nullable-aware). No `serialize` or `prepare` exposed.
     */
    asymmetric<O extends ColAsymmetricOptions = ColAsymmetricOptions>(
      options: O,
    ): ColumnDef<NullableColumn<string, O>>;
  };
}

// ---------------------------------------------------------------------------
// Index / Unique / Check definition types (user-facing)
// ---------------------------------------------------------------------------

export type IndexDefinition<K extends string = string> =
  | K[]
  | { columns: K[]; name?: string };

export type UniqueDefinition<K extends string = string> =
  | K[]
  | { columns: K[]; name?: string };

export type CheckDefinition = string | { expression: string; name?: string };

// ---------------------------------------------------------------------------
// Hooks definition
// ---------------------------------------------------------------------------

export type HooksDefinition<T = any, M extends Model = any> = {
  beforeFetch?: (queryBuilder: ModelQueryBuilder<M>) => Promise<void> | void;
  afterFetch?: (data: T[]) => Promise<T[]> | T[];
  beforeInsert?: (data: Partial<T>) => Promise<void> | void;
  beforeInsertMany?: (data: Partial<T>[]) => Promise<void> | void;
  beforeUpdate?: (queryBuilder: ModelQueryBuilder<M>) => Promise<void> | void;
  beforeDelete?: (queryBuilder: ModelQueryBuilder<M>) => Promise<void> | void;
};

// ---------------------------------------------------------------------------
// Model options
// ---------------------------------------------------------------------------

export type DefineModelOptions<K extends string = string> = {
  modelCaseConvention?: CaseConvention;
  databaseCaseConvention?: CaseConvention;
  softDeleteColumn?: K;
  softDeleteValue?: boolean | string;
};

// ---------------------------------------------------------------------------
// Type inference helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the primary key column type from a columns definition.
 * Looks for columns defined with `PrimaryColumnDef` (col.primary, col.increment, col.bigIncrement).
 * Falls back to `string | number` if no PK column is found.
 */
type ExtractPKType<C extends Record<string, ColumnDef>> = {
  [K in keyof C]: C[K] extends PrimaryColumnDef<infer T> ? T : never;
}[keyof C];

export type InferPK<C extends Record<string, ColumnDef>> = [
  ExtractPKType<C>,
] extends [never]
  ? string | number
  : ExtractPKType<C>;

type InferColumns<C extends Record<string, ColumnDef>> = {
  [K in keyof C]: C[K] extends ColumnDef<infer T> ? T : never;
};

type InferRelations<R extends Record<string, RelationDef>> = {
  [K in keyof R]: R[K] extends RelationDef<infer V> ? V : never;
};

/**
 * Infers the instance type of a model defined with `defineModel`.
 * Includes a phantom `__tableName` property carrying the literal table name
 * for use in table-prefixed column key inference.
 */
export type InferModel<
  T extends string,
  C extends Record<string, ColumnDef>,
  R extends Record<string, RelationDef>,
> = { readonly __tableName: T } & InferColumns<C> & InferRelations<R>;

// ---------------------------------------------------------------------------
// Full model definition
// ---------------------------------------------------------------------------

export type ModelDefinition<
  T extends string = string,
  C extends Record<string, ColumnDef> = Record<string, ColumnDef>,
> = {
  columns: C;
  indexes?: IndexDefinition<keyof C & string>[];
  uniques?: UniqueDefinition<keyof C & string>[];
  checks?: CheckDefinition[];
  hooks?: HooksDefinition<
    InferColumns<C>,
    { readonly __tableName: T } & InferColumns<C> & Model
  >;
  options?: DefineModelOptions<keyof C & string>;
};

/**
 * Public statics of `typeof Model` without the abstract constructor flag.
 */
export type ConcreteModelStatics = {
  [K in keyof typeof Model]: (typeof Model)[K];
};

/**
 * Static methods and properties hidden from the public `DefinedModel` type.
 * These are still present at runtime but not accessible through the type system.
 */
type HiddenModelStatics =
  // Query methods
  | "query"
  | "all"
  | "first"
  | "find"
  | "findOneOrFail"
  | "findOne"
  | "findBy"
  | "findOneBy"
  | "findOneByPrimaryKey"
  | "refresh"
  | "sync"
  // Mutation methods
  | "insert"
  | "insertMany"
  | "updateRecord"
  | "firstOrInsert"
  | "upsert"
  | "upsertMany"
  | "deleteRecord"
  | "save"
  | "softDelete"
  | "truncate"
  // Internal methods
  | "sqlInstance"
  // Schema introspection (now through sql instance)
  | "getTableInfo"
  | "getIndexInfo"
  | "getTableSchema"
  // Hook declarations (set via defineModel options, not accessed directly)
  | "beforeFetch"
  | "afterFetch"
  | "beforeInsert"
  | "beforeInsertMany"
  | "beforeUpdate"
  | "beforeDelete"
  // Table (overridden with readonly literal)
  | "table";

/**
 * Union type that accepts both decorator-based model classes (`typeof Model`
 * subclasses) and programmatic models created via `defineModel`.
 *
 * Includes metadata methods needed by internal infrastructure.
 * Internal code needing full Model statics (query, insert, etc.) should cast to `typeof Model`.
 */
export type AnyModelConstructor =
  | typeof Model
  | ({
      table: string;
      primaryKey?: string;
      softDeleteColumn?: string;
      softDeleteValue?: boolean | string;
      modelCaseConvention?: CaseConvention;
      databaseCaseConvention?: CaseConvention;
      getColumns(): ColumnType[];
      getRelations(): LazyRelationType[];
      getIndexes(): IndexType[];
      getUniques(): UniqueType[];
      getChecks(): CheckType[];
    } & (new (...args: any[]) => Model));

/**
 * The return type of `defineModel` – a metadata descriptor that carries
 * the table name, column types, and relation types.
 *
 * All query and mutation methods are hidden; use `sql.from(Model)` instead.
 * Internally still a Model subclass for engine compatibility.
 */
export type DefinedModel<
  T extends string,
  C extends Record<string, ColumnDef>,
  R extends Record<string, RelationDef>,
> = Omit<ConcreteModelStatics, HiddenModelStatics> & {
  readonly table: T;
  new (): InferModel<T, C, R> & Model;
  // Typed lifecycle hooks (override the `any`-typed hooks from Model)
  beforeFetch?: (
    queryBuilder: ModelQueryBuilder<
      { readonly __tableName: T } & InferColumns<C> & Model
    >,
  ) => Promise<void> | void;
  afterFetch?: (
    data: InferColumns<C>[],
  ) => Promise<InferColumns<C>[]> | InferColumns<C>[];
  beforeInsert?: (data: Partial<InferColumns<C>>) => Promise<void> | void;
  beforeInsertMany?: (data: Partial<InferColumns<C>>[]) => Promise<void> | void;
  beforeUpdate?: (
    queryBuilder: ModelQueryBuilder<
      { readonly __tableName: T } & InferColumns<C> & Model
    >,
  ) => Promise<void> | void;
  beforeDelete?: (
    queryBuilder: ModelQueryBuilder<
      { readonly __tableName: T } & InferColumns<C> & Model
    >,
  ) => Promise<void> | void;
};

// ---------------------------------------------------------------------------
// Schema relation definition types (for defineRelations + createSchema)
// ---------------------------------------------------------------------------

/**
 * Runtime relation descriptor returned by `defineRelations` helpers.
 * Carries enough info for `createSchema` to call the appropriate decorator.
 */
export interface SchemaRelDef<
  _Kind extends "hasOne" | "hasMany" | "belongsTo" | "manyToMany" =
    | "hasOne"
    | "hasMany"
    | "belongsTo"
    | "manyToMany",
  _Target extends AnyModelConstructor = AnyModelConstructor,
> {
  readonly _kind: _Kind;
  readonly _target: _Target;
  readonly _foreignKey: string;
  readonly _throughModel?: string | (() => AnyModelConstructor);
  readonly _throughModelKeys?: {
    leftForeignKey: string;
    rightForeignKey: string;
  };
  readonly _constraintOptions?: RelationConstraintOptions;
  readonly _phantom: unknown;
}

export type HasOneRelDef<T extends AnyModelConstructor> = SchemaRelDef<
  "hasOne",
  T
>;
export type HasManyRelDef<T extends AnyModelConstructor> = SchemaRelDef<
  "hasMany",
  T
>;
export type BelongsToRelDef<T extends AnyModelConstructor> = SchemaRelDef<
  "belongsTo",
  T
>;
export type ManyToManyRelDef<T extends AnyModelConstructor> = SchemaRelDef<
  "manyToMany",
  T
>;

/**
 * Structural constraint for a defined model — avoids variance issues with
 * `DefinedModel<any, any, any>` (contravariant hooks).
 */
type DefinedModelLike = { readonly table: string; new (...args: any[]): Model };

/**
 * Typed helpers passed to the `defineRelations` callback.
 * Foreign keys are type-checked against the appropriate model's columns.
 */
export interface RelationHelpers<Source extends DefinedModelLike> {
  hasOne<Target extends AnyModelConstructor>(
    target: Target,
    opts: {
      foreignKey: ModelKey<InstanceType<Target> & Model> | (string & {});
    },
  ): HasOneRelDef<Target>;

  hasMany<Target extends AnyModelConstructor>(
    target: Target,
    opts: {
      foreignKey: ModelKey<InstanceType<Target> & Model> | (string & {});
    },
  ): HasManyRelDef<Target>;

  belongsTo<Target extends AnyModelConstructor>(
    target: Target,
    opts: {
      foreignKey: ModelKey<InstanceType<Source> & Model> | (string & {});
    } & RelationConstraintOptions,
  ): BelongsToRelDef<Target>;

  manyToMany<
    Target extends AnyModelConstructor,
    Through extends AnyModelConstructor,
  >(
    target: Target,
    opts: {
      through: Through;
      leftForeignKey: ModelKey<InstanceType<Through> & Model> | (string & {});
      rightForeignKey: ModelKey<InstanceType<Through> & Model> | (string & {});
    } & RelationConstraintOptions,
  ): ManyToManyRelDef<Target>;
  manyToMany<Target extends AnyModelConstructor>(
    target: Target,
    opts: {
      through: string;
      leftForeignKey: string;
      rightForeignKey: string;
    } & RelationConstraintOptions,
  ): ManyToManyRelDef<Target>;
}

/**
 * Return type of `defineRelations` — carries the source model type
 * so `createSchema` can validate model↔relation matching.
 */
export type RelationDefinitions<
  _Source extends DefinedModelLike = DefinedModelLike,
  R extends Record<string, SchemaRelDef> = Record<string, SchemaRelDef>,
> = {
  readonly _source: _Source;
  readonly _defs: R;
};

// ---------------------------------------------------------------------------
// createSchema type resolution
// ---------------------------------------------------------------------------

/**
 * Find the key in model record `M` whose model has table name `TN`.
 */
export type SchemaKeyByTable<M, TN extends string> = {
  [K in keyof M]: M[K] extends { readonly table: TN } ? K : never;
}[keyof M];

/**
 * Look up the augmented model from schema for a given target model.
 * If not found in the schema, returns the target model itself.
 */
export type AugmentedModelByRef<
  M extends Record<string, AnyModelConstructor>,
  R extends Partial<Record<keyof M, RelationDefinitions<any, any>>>,
  Target extends AnyModelConstructor,
> = Target extends { readonly table: infer TN extends string }
  ? SchemaKeyByTable<M, TN> extends infer K extends keyof M
    ? AugmentedModelByKey<M, R, K & string>
    : Target
  : Target;

/**
 * Augment a single model from the schema (by key) with its resolved relations.
 */
export type AugmentedModelByKey<
  M extends Record<string, AnyModelConstructor>,
  R extends Partial<Record<keyof M, RelationDefinitions<any, any>>>,
  K extends keyof M & string,
> =
  M[K] extends DefinedModel<infer T, infer C, any>
    ? K extends keyof R
      ? R[K] extends RelationDefinitions<any, infer Defs>
        ? DefinedModel<T, C, AugmentedRelationDefs<M, R, Defs>>
        : M[K]
      : M[K]
    : M[K];

/**
 * Map raw `SchemaRelDef` records into `RelationDef` records with resolved types.
 */
export type AugmentedRelationDefs<
  M extends Record<string, AnyModelConstructor>,
  R extends Partial<Record<keyof M, RelationDefinitions<any, any>>>,
  Defs extends Record<string, SchemaRelDef>,
> = {
  [K in keyof Defs]: AugmentedRelationDef<M, R, Defs[K]>;
};

/**
 * Resolve a single `SchemaRelDef` to a typed `RelationDef`.
 */
export type AugmentedRelationDef<
  M extends Record<string, AnyModelConstructor>,
  R extends Partial<Record<keyof M, RelationDefinitions<any, any>>>,
  Def extends SchemaRelDef,
> =
  Def extends SchemaRelDef<"hasMany", infer Target>
    ? RelationDef<InstanceType<AugmentedModelByRef<M, R, Target>>[]>
    : Def extends SchemaRelDef<"hasOne", infer Target>
      ? RelationDef<InstanceType<AugmentedModelByRef<M, R, Target>> | null>
      : Def extends SchemaRelDef<"belongsTo", infer Target>
        ? RelationDef<InstanceType<AugmentedModelByRef<M, R, Target>> | null>
        : Def extends SchemaRelDef<"manyToMany", infer Target>
          ? RelationDef<InstanceType<AugmentedModelByRef<M, R, Target>>[]>
          : RelationDef;

/**
 * Result of `createSchema(models, relations)` — each model augmented with resolved relation types.
 */
export type CreateSchemaResult<
  M extends Record<string, AnyModelConstructor>,
  R extends Partial<Record<keyof M, RelationDefinitions<any, any>>>,
> = {
  [K in keyof M]: AugmentedModelByKey<M, R, K & string>;
};

/**
 * Finds the augmented model in a schema record by table name.
 * Falls back to the original model when no schema is provided.
 */
export type FindByTable<
  Schema extends Record<string, AnyModelConstructor>,
  TN extends string,
> =
  SchemaKeyByTable<Schema, TN> extends infer K extends keyof Schema
    ? Schema[K]
    : never;

/**
 * Used by `SqlDataSource.from()` to resolve a plain model reference to its
 * schema-augmented version (when a schema is registered).
 * When no schema is provided (`Schema = {}`), falls back to the model itself.
 */
export type SchemaLookup<
  Schema extends Record<string, AnyModelConstructor>,
  M extends AnyModelConstructor,
> = M extends { readonly table: infer TN extends string }
  ? FindByTable<Schema, TN> extends infer Found
    ? [Found] extends [never]
      ? M
      : Found extends AnyModelConstructor
        ? Found
        : M
    : M
  : M;

// ---------------------------------------------------------------------------
// View definition
// ---------------------------------------------------------------------------

/**
 * Definition object for `defineView`.
 * Views are read-only — no relations, indexes, uniques, checks, or mutation hooks.
 */
export type ViewDefinition<
  C extends Record<string, ColumnDef> = Record<string, ColumnDef>,
> = {
  columns: C;
  statement: (query: ModelQueryBuilder<any>) => void;
  hooks?: Pick<HooksDefinition<InferColumns<C>>, "beforeFetch" | "afterFetch">;
  options?: Pick<
    DefineModelOptions<keyof C & string>,
    "modelCaseConvention" | "databaseCaseConvention"
  >;
};

/**
 * Statics hidden from a view model (views are read-only, no mutations).
 */
type HiddenViewStatics = HiddenModelStatics;

/**
 * Return type of `defineView` — a read-only model backed by a SQL view statement.
 */
export type DefinedView<
  T extends string,
  C extends Record<string, ColumnDef>,
> = Omit<ConcreteModelStatics, HiddenViewStatics> & {
  readonly table: T;
  new (): InferModel<T, C, {}> & Model;
};
