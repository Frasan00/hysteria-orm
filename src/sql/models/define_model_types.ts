import type { CaseConvention } from "../../utils/case_utils";
import type { OnUpdateOrDelete } from "../migrations/schema/schema_types";
import type { Model } from "./model";
import type { ModelQueryBuilder } from "./model_query_builder/model_query_builder";
import type {
  AsymmetricEncryptionOptions,
  ColumnOptions,
  DateColumnOptions,
  DatetimeColumnOptions,
  ManyToManyStringOptions,
  SymmetricEncryptionOptions,
  ThroughModel,
} from "./decorators/model_decorators_types";
import type { ModelKey } from "./model_manager/model_manager_types";
import { __selfBrand } from "../../globals";

/**
 * Phantom-typed descriptor for a model column.
 * `T` carries the TypeScript type the column resolves to at the instance level.
 */
export interface ColumnDef<T = unknown> {
  readonly _phantom: T;
  readonly _apply: (target: Object, propertyKey: string) => void;
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

export type ColOptions = Omit<
  ColumnOptions,
  "primaryKey" | "serialize" | "prepare"
>;
export type ColPrimaryOptions = Omit<
  ColumnOptions,
  "primaryKey" | "serialize" | "prepare"
>;
export type ColStringOptions = Omit<
  ColumnOptions,
  "type" | "serialize" | "prepare"
> & {
  length?: number;
};
export type ColTextOptions = Omit<
  ColumnOptions,
  "type" | "serialize" | "prepare"
>;
export type ColIntegerOptions = Omit<ColumnOptions, "serialize" | "prepare">;
export type ColBigIntegerOptions = Omit<ColumnOptions, "serialize" | "prepare">;
export type ColFloatOptions = Omit<ColumnOptions, "serialize" | "prepare">;
export type ColDecimalOptions = Omit<ColumnOptions, "serialize" | "prepare"> & {
  precision?: number;
  scale?: number;
};
export type ColIncrementOptions = Omit<
  ColumnOptions,
  "serialize" | "prepare" | "primaryKey" | "nullable"
>;
export type ColBigIncrementOptions = Omit<
  ColumnOptions,
  "serialize" | "prepare" | "primaryKey" | "nullable"
>;
export type ColBooleanOptions = Omit<ColumnOptions, "prepare" | "serialize">;
export type ColDateOptions = Omit<
  DateColumnOptions,
  "format" | "serialize" | "prepare"
>;
export type ColDatetimeOptions = Omit<
  DatetimeColumnOptions,
  "serialize" | "prepare"
>;
export type ColTimestampOptions = Omit<
  DatetimeColumnOptions,
  "serialize" | "prepare"
>;
export type ColTimeOptions = Omit<
  DateColumnOptions,
  "format" | "serialize" | "prepare"
>;
export type ColJsonOptions = Omit<ColumnOptions, "prepare" | "serialize">;
export type ColUuidOptions = Omit<ColumnOptions, "prepare" | "serialize">;
export type ColUlidOptions = Omit<ColumnOptions, "prepare" | "serialize">;
export type ColBinaryOptions = Omit<
  ColumnOptions,
  "type" | "serialize" | "prepare"
>;
export type ColEnumOptions = Omit<
  ColumnOptions,
  "type" | "serialize" | "prepare"
>;
export type ColSymmetricOptions = Omit<
  SymmetricEncryptionOptions,
  "prepare" | "serialize"
>;
export type ColAsymmetricOptions = Omit<
  AsymmetricEncryptionOptions,
  "prepare" | "serialize"
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
 * `Base | null | undefined`. This powers nullable-aware type inference
 * for `col.*()` methods.
 */
export type NullableColumn<Base, Opts> = Opts extends { nullable: false }
  ? Base
  : Base | null | undefined;

// ---------------------------------------------------------------------------
// Typed serialize / prepare callback helpers
// ---------------------------------------------------------------------------

export type TypedSerialize<T> = { serialize?: (value: any) => T };
export type TypedPrepare<T> = { prepare?: (value: T) => any };

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
    options?: ColOptions & TypedSerialize<T> & TypedPrepare<T>,
  ): ColumnDef<T>;

  /**
   * Generic primary key column. Defaults to `string | number`.
   * Override the generic when you know the exact type.
   *
   * ```ts
   * col.primary<number>({ nullable: false })
   * ```
   */
  primary<T = string | number>(
    options?: ColPrimaryOptions & TypedSerialize<T> & TypedPrepare<T>,
  ): ColumnDef<T>;

  /**
   * VARCHAR column. Accepts an optional `length` option.
   * Type: `string` (nullable-aware).
   *
   * ```ts
   * col.string({ length: 255, nullable: false }) // string
   * col.string()                                  // string | null | undefined
   * ```
   */
  string<O extends ColStringOptions = ColStringOptions>(
    options?: O &
      TypedSerialize<NullableColumn<string, O>> &
      TypedPrepare<NullableColumn<string, O>>,
  ): ColumnDef<NullableColumn<string, O>>;

  /**
   * LONGTEXT column for large text content.
   * Type: `string` (nullable-aware).
   */
  text<O extends ColTextOptions = ColTextOptions>(
    options?: O &
      TypedSerialize<NullableColumn<string, O>> &
      TypedPrepare<NullableColumn<string, O>>,
  ): ColumnDef<NullableColumn<string, O>>;

  /**
   * Integer column.
   * Type: `number` (nullable-aware). Only `prepare` is exposed (no `serialize`).
   */
  integer<O extends ColIntegerOptions = ColIntegerOptions>(
    options?: O & TypedPrepare<NullableColumn<number, O>>,
  ): ColumnDef<NullableColumn<number, O>>;

  /**
   * Big integer column for values exceeding 32-bit range.
   * Type: `number` (nullable-aware). Only `prepare` is exposed.
   */
  bigInteger<O extends ColBigIntegerOptions = ColBigIntegerOptions>(
    options?: O & TypedPrepare<NullableColumn<number, O>>,
  ): ColumnDef<NullableColumn<number, O>>;

  /**
   * Floating-point column.
   * Type: `number` (nullable-aware). Only `prepare` is exposed.
   */
  float<O extends ColFloatOptions = ColFloatOptions>(
    options?: O & TypedPrepare<NullableColumn<number, O>>,
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
    options?: O & TypedPrepare<NullableColumn<number, O>>,
  ): ColumnDef<NullableColumn<number, O>>;

  /**
   * Auto-incrementing integer primary key. Always non-nullable.
   * Type: `number`. Only `prepare` is exposed.
   */
  increment(
    options?: ColIncrementOptions & TypedPrepare<number>,
  ): ColumnDef<number>;

  /**
   * Auto-incrementing bigint primary key. Always non-nullable.
   * Type: `number`. Only `prepare` is exposed.
   */
  bigIncrement(
    options?: ColBigIncrementOptions & TypedPrepare<number>,
  ): ColumnDef<number>;

  /**
   * Boolean column.
   * Type: `boolean` (nullable-aware). No `serialize` or `prepare` exposed.
   */
  boolean<O extends ColBooleanOptions = ColBooleanOptions>(
    options?: O,
  ): ColumnDef<NullableColumn<boolean, O>>;

  /**
   * DATE column (YYYY-MM-DD). Defaults to `Date` because database drivers
   * return `Date` objects.
   *
   * To type as `string`, use `col.date<string>()` and provide a `serialize`
   * function that converts the driver `Date` into a string:
   *
   * ```ts
   * col.date<string>({ serialize: (raw) => raw.toISOString().split("T")[0] })
   * ```
   */
  date<T extends Date | string = Date>(
    options: ColDateOptions & { nullable: false } & TypedSerialize<T> &
      TypedPrepare<T>,
  ): ColumnDef<T>;
  date<T extends Date | string = Date>(
    options?: ColDateOptions &
      TypedSerialize<T | null | undefined> &
      TypedPrepare<T | null | undefined>,
  ): ColumnDef<T | null | undefined>;

  /**
   * DATETIME column. Defaults to `Date` because database drivers return
   * `Date` objects.
   *
   * To type as `string`, use `col.datetime<string>()` and provide a
   * `serialize` function that converts the driver `Date` into a string:
   *
   * ```ts
   * col.datetime<string>({ serialize: (raw) => new Date(raw).toISOString() })
   * ```
   */
  datetime<T extends Date | string = Date>(
    options: ColDatetimeOptions & { nullable: false } & TypedSerialize<T> &
      TypedPrepare<T>,
  ): ColumnDef<T>;
  datetime<T extends Date | string = Date>(
    options?: ColDatetimeOptions &
      TypedSerialize<T | null | undefined> &
      TypedPrepare<T | null | undefined>,
  ): ColumnDef<T | null | undefined>;

  /**
   * TIMESTAMP column. Defaults to `Date` because database drivers return
   * `Date` objects.
   *
   * To type as `string`, use `col.timestamp<string>()` and provide a
   * `serialize` function that converts the driver `Date` into a string:
   *
   * ```ts
   * col.timestamp<string>({ serialize: (raw) => new Date(raw).toISOString() })
   * ```
   */
  timestamp<T extends Date | string = Date>(
    options: ColTimestampOptions & { nullable: false } & TypedSerialize<T> &
      TypedPrepare<T>,
  ): ColumnDef<T>;
  timestamp<T extends Date | string = Date>(
    options?: ColTimestampOptions &
      TypedSerialize<T | null | undefined> &
      TypedPrepare<T | null | undefined>,
  ): ColumnDef<T | null | undefined>;

  /**
   * TIME column. Defaults to `Date` because database drivers return
   * `Date` objects.
   *
   * To type as `string`, use `col.time<string>()` and provide a
   * `serialize` function that converts the driver `Date` into a string:
   *
   * ```ts
   * col.time<string>({ serialize: (raw) => new Date(raw).toTimeString() })
   * ```
   */
  time<T extends Date | string = Date>(
    options: ColTimeOptions & { nullable: false } & TypedSerialize<T> &
      TypedPrepare<T>,
  ): ColumnDef<T>;
  time<T extends Date | string = Date>(
    options?: ColTimeOptions &
      TypedSerialize<T | null | undefined> &
      TypedPrepare<T | null | undefined>,
  ): ColumnDef<T | null | undefined>;

  /**
   * JSON/JSONB column. Defaults to `unknown`.
   * Pass a concrete type for structured JSON data: `col.json<MyType>()`.
   *
   * No `serialize` or `prepare` exposed — serialization is handled internally.
   *
   * ```ts
   * col.json<{ theme: string }>({ nullable: false }) // { theme: string }
   * col.json()                                        // unknown | null | undefined
   * ```
   */
  json<T = unknown>(
    options: ColJsonOptions & { nullable: false },
  ): ColumnDef<T>;
  json<T = unknown>(options?: ColJsonOptions): ColumnDef<T | null | undefined>;

  /**
   * UUID column. Auto-generates a UUID if no value is provided on insert.
   * Type: `string` (nullable-aware). Only `serialize` is exposed.
   */
  uuid<O extends ColUuidOptions = ColUuidOptions>(
    options?: O & TypedSerialize<NullableColumn<string, O>>,
  ): ColumnDef<NullableColumn<string, O>>;

  /**
   * ULID column. Auto-generates a ULID if no value is provided on insert.
   * Type: `string` (nullable-aware). Only `serialize` is exposed.
   */
  ulid<O extends ColUlidOptions = ColUlidOptions>(
    options?: O & TypedSerialize<NullableColumn<string, O>>,
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
      TypedPrepare<NullableColumn<T, O>>,
  ): ColumnDef<NullableColumn<T, O>>;

  /**
   * Enum column constrained to the given values array.
   * Type: `values[number]` (nullable-aware).
   *
   * ```ts
   * col.enum(["active", "inactive"] as const)               // "active" | "inactive" | null | undefined
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
      TypedPrepare<NullableColumn<V[number], O>>,
  ): ColumnDef<NullableColumn<V[number], O>>;

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
// rel namespace type
// ---------------------------------------------------------------------------

type AnyModelClass = abstract new (...args: any[]) => Model;

type SelfModelInstance = Model & { readonly [__selfBrand]: true };
type SelfToken = abstract new (...args: any[]) => SelfModelInstance;

/**
 * Model callback type for relation definitions.
 * Accepts either `() => OtherModel` or `(self) => self` for self-referencing
 * relations (tree structures, parent/child, etc.).
 */
export type RelModelCallback<M extends AnyModelClass> = (self: SelfToken) => M;

/**
 * Provides autocomplete for column keys of the related model while still accepting any string
 */
type ForeignKeyOf<M extends AnyModelClass> =
  | ModelKey<InstanceType<M> & Model>
  | (string & {});

/**
 * Extracts the Model instance type from a through-model callback.
 */
type InferThroughModelInstance<TM> = TM extends () => infer T
  ? T extends AnyModelClass
    ? InstanceType<T> & Model
    : Model
  : Model;

export interface RelNamespace {
  /**
   * One-to-one relation where the foreign key lives on the **related** model.
   * The `foreignKey` parameter autocompletes with column keys of `M`.
   *
   * Pass `{ nullable: false }` to type the relation as non-nullable.
   *
   * ```ts
   * rel.hasOne(() => Profile, "userId", { nullable: false }) // Profile
   * rel.hasOne(() => Profile, "userId")                      // Profile | null | undefined
   * ```
   *
   * @param model     Callback returning the related model class (or `(self) => self` for self-referencing).
   * @param foreignKey Column on the related model that references the current model's primary key.
   * @param options   `{ nullable: false }` to mark the relation as always present.
   */
  hasOne<M extends AnyModelClass>(
    model: RelModelCallback<M>,
    foreignKey: ForeignKeyOf<M> | undefined,
    options: { nullable: false },
  ): RelationDef<InstanceType<M>>;
  hasOne<M extends AnyModelClass>(
    model: RelModelCallback<M>,
    foreignKey?: ForeignKeyOf<M>,
    options?: RelationNullableOption,
  ): RelationDef<InstanceType<M> | null | undefined>;

  /**
   * One-to-many relation where the foreign key lives on the **related** model.
   * The `foreignKey` parameter autocompletes with column keys of `M`.
   *
   * Pass `{ nullable: false }` to type the relation as non-nullable (always
   * returns an array, never `null | undefined`).
   *
   * ```ts
   * rel.hasMany(() => Post, "authorId", { nullable: false }) // Post[]
   * rel.hasMany(() => Post, "authorId")                      // Post[] | null | undefined
   * ```
   *
   * @param model     Callback returning the related model class (or `(self) => self` for self-referencing).
   * @param foreignKey Column on the related model that references the current model's primary key.
   * @param options   `{ nullable: false }` to mark the relation as always present.
   */
  hasMany<M extends AnyModelClass>(
    model: RelModelCallback<M>,
    foreignKey: ForeignKeyOf<M> | undefined,
    options: { nullable: false },
  ): RelationDef<InstanceType<M>[]>;
  hasMany<M extends AnyModelClass>(
    model: RelModelCallback<M>,
    foreignKey?: ForeignKeyOf<M>,
    options?: RelationNullableOption,
  ): RelationDef<InstanceType<M>[] | null | undefined>;

  /**
   * Inverse one-to-one / many-to-one relation where the foreign key lives
   * on the **current** model.
   *
   * The `foreignKey` parameter autocompletes with column keys of the related
   * model `M` as a naming hint; any string is still accepted since the
   * actual column is on the current model.
   *
   * Pass `{ nullable: false }` (inside the constraint options) to type the
   * relation as non-nullable.
   *
   * ```ts
   * rel.belongsTo(() => User, "userId", { nullable: false }) // User
   * rel.belongsTo(() => User, "userId")                      // User | null | undefined
   * rel.belongsTo((self) => self, "parentId")                // self-referencing
   * ```
   *
   * @param model     Callback returning the related model class (or `(self) => self` for self-referencing).
   * @param foreignKey Column on the **current** model that references the related model's primary key.
   * @param options   Constraint options (`onDelete`, `onUpdate`, `constraintName`) and `{ nullable: false }`.
   */
  belongsTo<M extends AnyModelClass>(
    model: RelModelCallback<M>,
    foreignKey: ForeignKeyOf<M> | undefined,
    options: RelationConstraintOptions & { nullable: false },
  ): RelationDef<InstanceType<M>>;
  belongsTo<M extends AnyModelClass>(
    model: RelModelCallback<M>,
    foreignKey?: ForeignKeyOf<M>,
    options?: RelationConstraintOptions & RelationNullableOption,
  ): RelationDef<InstanceType<M> | null | undefined>;

  /**
   * Many-to-many relation through a pivot (join) table.
   *
   * - `throughModel`: either a string (pivot table name) or a callback
   *   returning a Model class (`() => PivotModel`).
   * - When a Model callback is provided:
   *   - `leftForeignKey` autocompletes with the **through model**'s column
   *     keys (the FK on the pivot table referencing the current model).
   *   - `rightForeignKey` autocompletes with the **related model** `M`'s
   *     column keys (the FK on the pivot table referencing the related model).
   * - When a plain string is provided, both keys accept any string.
   *
   * Pass `{ nullable: false }` to type the relation as non-nullable.
   *
   * ```ts
   * // Through model as callback — typed FK autocomplete
   * rel.manyToMany(() => Tag, () => PostTag, {
   *   leftForeignKey: "postId",  // autocompletes with PostTag keys
   *   rightForeignKey: "tagId",  // autocompletes with Tag keys
   * })
   *
   * // Through model as string — plain string FKs
   * rel.manyToMany(() => Tag, "post_tags", {
   *   leftForeignKey: "post_id",
   *   rightForeignKey: "tag_id",
   * })
   * ```
   *
   * @param model            Callback returning the related model class.
   * @param throughModel      Pivot model callback or table name string.
   * @param throughModelKeys  Foreign key mapping on the pivot table.
   * @param options          Constraint options and `{ nullable: false }`.
   */
  manyToMany<
    M extends AnyModelClass,
    T extends AnyModelConstructor = AnyModelConstructor,
    TM extends ThroughModel<T> = ThroughModel<T>,
  >(
    model: RelModelCallback<M>,
    throughModel: TM,
    throughModelKeys: TM extends string
      ? ManyToManyStringOptions
      : {
          leftForeignKey?:
            | ModelKey<InferThroughModelInstance<TM>>
            | (string & {});
          rightForeignKey?: ForeignKeyOf<M>;
        },
    options: RelationConstraintOptions & { nullable: false },
  ): RelationDef<InstanceType<M>[]>;
  manyToMany<
    M extends AnyModelClass,
    T extends AnyModelConstructor = AnyModelConstructor,
    TM extends ThroughModel<T> = ThroughModel<T>,
  >(
    model: RelModelCallback<M>,
    throughModel: TM,
    throughModelKeys?: TM extends string
      ? ManyToManyStringOptions
      : {
          leftForeignKey?:
            | ModelKey<InferThroughModelInstance<TM>>
            | (string & {});
          rightForeignKey?: ForeignKeyOf<M>;
        },
    options?: RelationConstraintOptions & RelationNullableOption,
  ): RelationDef<InstanceType<M>[] | null | undefined>;
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

export type HooksDefinition<T = any> = {
  beforeFetch?: (queryBuilder: ModelQueryBuilder<any>) => Promise<void> | void;
  afterFetch?: (data: T[]) => Promise<T[]> | T[];
  beforeInsert?: (data: Partial<T>) => Promise<void> | void;
  beforeInsertMany?: (data: Partial<T>[]) => Promise<void> | void;
  beforeUpdate?: (queryBuilder: ModelQueryBuilder<any>) => Promise<void> | void;
  beforeDelete?: (queryBuilder: ModelQueryBuilder<any>) => Promise<void> | void;
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

type InferColumns<C extends Record<string, ColumnDef>> = {
  [K in keyof C]: C[K] extends ColumnDef<infer T> ? T : never;
};

/**
 * Detects self-referencing relations (branded with `SelfModelInstance`) and
 * replaces them with the actual column types of the defining model.
 * Non-self relations pass through unchanged.
 */
type ResolveSelfRef<T, SelfType> = [T] extends [
  SelfModelInstance[] | null | undefined,
]
  ? SelfType[] | Extract<T, null | undefined>
  : [T] extends [SelfModelInstance | null | undefined]
    ? SelfType | Extract<T, null | undefined>
    : T;

type InferRelations<
  C extends Record<string, ColumnDef>,
  R extends Record<string, RelationDef>,
> = {
  [K in keyof R]: R[K] extends RelationDef<infer T>
    ? ResolveSelfRef<T, InferColumns<C> & Model>
    : never;
};

/**
 * Infers the instance type of a model defined with `defineModel`.
 */
export type InferModel<
  C extends Record<string, ColumnDef>,
  R extends Record<string, RelationDef>,
> = InferColumns<C> & InferRelations<C, R>;

// ---------------------------------------------------------------------------
// Full model definition
// ---------------------------------------------------------------------------

export type ModelDefinition<
  C extends Record<string, ColumnDef> = Record<string, ColumnDef>,
  R extends Record<string, RelationDef> = Record<string, RelationDef>,
> = {
  columns: C;
  relations?: R;
  indexes?: IndexDefinition<keyof C & string>[];
  uniques?: UniqueDefinition<keyof C & string>[];
  checks?: CheckDefinition[];
  hooks?: HooksDefinition<InferColumns<C>>;
  options?: DefineModelOptions<keyof C & string>;
};

/**
 * Public statics of `typeof Model` without the abstract constructor flag.
 */
export type ConcreteModelStatics = {
  [K in keyof typeof Model]: (typeof Model)[K];
};

/**
 * Union type that accepts both decorator-based model classes (`typeof Model`
 * subclasses) and programmatic models created via `defineModel`.
 *
 * Use this instead of `typeof Model` in any user-facing API that should
 * accept either kind of model.
 */
export type AnyModelConstructor =
  | typeof Model
  | (ConcreteModelStatics & (new (...args: any[]) => Model));

/**
 * The return type of `defineModel` – a concrete Model constructor whose
 * instances carry the inferred column + relation properties.
 *
 * Uses a mapped type over `typeof Model` so the abstract flag is stripped,
 * making the result instantiable while keeping all public static members.
 */
export type DefinedModel<
  C extends Record<string, ColumnDef>,
  R extends Record<string, RelationDef>,
> = ConcreteModelStatics & { new (): InferModel<C, R> & Model };
