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
  ManyToManyOptions,
} from "./decorators/model_decorators_types";

/**
 * Phantom-typed descriptor for a model column.
 * `T` carries the TypeScript type the column resolves to at the instance level.
 */
export interface ColumnDef<T = any> {
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

export type ColOptions = Omit<ColumnOptions, "primaryKey">;
export type ColPrimaryOptions = Omit<ColumnOptions, "primaryKey">;
export type ColStringOptions = Omit<ColumnOptions, "type"> & {
  length?: number;
};
export type ColTextOptions = Omit<ColumnOptions, "type">;
export type ColIntegerOptions = Omit<ColumnOptions, "serialize">;
export type ColBigIntegerOptions = Omit<ColumnOptions, "serialize">;
export type ColFloatOptions = Omit<ColumnOptions, "serialize">;
export type ColDecimalOptions = Omit<ColumnOptions, "serialize"> & {
  precision?: number;
  scale?: number;
};
export type ColIncrementOptions = Omit<
  ColumnOptions,
  "serialize" | "primaryKey" | "nullable"
>;
export type ColBigIncrementOptions = Omit<
  ColumnOptions,
  "serialize" | "primaryKey" | "nullable"
>;
export type ColBooleanOptions = Omit<ColumnOptions, "prepare" | "serialize">;
export type ColDateOptions = Omit<DateColumnOptions, "format">;
export type ColDatetimeOptions = DatetimeColumnOptions;
export type ColTimestampOptions = DatetimeColumnOptions;
export type ColTimeOptions = Omit<DateColumnOptions, "format">;
export type ColJsonOptions = Omit<ColumnOptions, "prepare" | "serialize">;
export type ColUuidOptions = Omit<ColumnOptions, "prepare">;
export type ColUlidOptions = Omit<ColumnOptions, "prepare">;
export type ColBinaryOptions = Omit<ColumnOptions, "type">;
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
  onDelete?: OnUpdateOrDelete;
  onUpdate?: OnUpdateOrDelete;
  constraintName?: string;
};

// ---------------------------------------------------------------------------
// col namespace type
// ---------------------------------------------------------------------------

export interface ColNamespace {
  (options?: ColumnOptions): ColumnDef<any>;

  primary(options?: ColPrimaryOptions): ColumnDef<any>;
  string(options?: ColStringOptions): ColumnDef<string | null | undefined>;
  text(options?: ColTextOptions): ColumnDef<string | null | undefined>;
  integer(options?: ColIntegerOptions): ColumnDef<number | null | undefined>;
  bigInteger(
    options?: ColBigIntegerOptions,
  ): ColumnDef<number | bigint | null | undefined>;
  float(options?: ColFloatOptions): ColumnDef<number | null | undefined>;
  decimal(options?: ColDecimalOptions): ColumnDef<number | null | undefined>;
  increment(
    options?: ColIncrementOptions,
  ): ColumnDef<number | null | undefined>;
  bigIncrement(
    options?: ColBigIncrementOptions,
  ): ColumnDef<number | null | undefined>;
  boolean(options?: ColBooleanOptions): ColumnDef<boolean | null | undefined>;
  date(options?: ColDateOptions): ColumnDef<Date | string | null | undefined>;
  datetime(
    options?: ColDatetimeOptions,
  ): ColumnDef<Date | string | null | undefined>;
  timestamp(
    options?: ColTimestampOptions,
  ): ColumnDef<Date | string | null | undefined>;
  time(options?: ColTimeOptions): ColumnDef<Date | string | null | undefined>;
  json(options?: ColJsonOptions): ColumnDef<unknown>;
  uuid(options?: ColUuidOptions): ColumnDef<string | null | undefined>;
  ulid(options?: ColUlidOptions): ColumnDef<string | null | undefined>;
  binary(
    options?: ColBinaryOptions,
  ): ColumnDef<Buffer | Uint8Array | string | null | undefined>;
  enum<const V extends readonly string[]>(
    values: V,
    options?: Omit<ColumnOptions, "type">,
  ): ColumnDef<V[number] | null | undefined>;
  encryption: {
    symmetric(
      options: ColSymmetricOptions,
    ): ColumnDef<string | null | undefined>;
    asymmetric(
      options: ColAsymmetricOptions,
    ): ColumnDef<string | null | undefined>;
  };
}

// ---------------------------------------------------------------------------
// rel namespace type
// ---------------------------------------------------------------------------

type AnyModelClass = abstract new (...args: any[]) => Model;

export interface RelNamespace {
  hasOne<M extends AnyModelClass>(
    model: () => M,
    foreignKey?: string,
  ): RelationDef<InstanceType<M> | null | undefined>;

  hasMany<M extends AnyModelClass>(
    model: () => M,
    foreignKey?: string,
  ): RelationDef<InstanceType<M>[] | null | undefined>;

  belongsTo<M extends AnyModelClass>(
    model: () => M,
    foreignKey?: string,
    options?: RelationConstraintOptions,
  ): RelationDef<InstanceType<M> | null | undefined>;

  manyToMany<
    M extends AnyModelClass,
    T extends typeof Model = typeof Model,
    TM extends ThroughModel<T> = ThroughModel<T>,
  >(
    model: () => M,
    throughModel: TM,
    throughModelKeys?: TM extends string
      ? ManyToManyStringOptions
      : ManyToManyOptions<T, TM>,
    options?: RelationConstraintOptions,
  ): RelationDef<InstanceType<M>[] | null | undefined>;
}

// ---------------------------------------------------------------------------
// Index / Unique / Check definition types (user-facing)
// ---------------------------------------------------------------------------

export type IndexDefinition = string[] | { columns: string[]; name?: string };

export type UniqueDefinition = string[] | { columns: string[]; name?: string };

export type CheckDefinition = string | { expression: string; name?: string };

// ---------------------------------------------------------------------------
// Hooks definition
// ---------------------------------------------------------------------------

export type HooksDefinition = {
  beforeFetch?: (queryBuilder: ModelQueryBuilder<any>) => Promise<void> | void;
  afterFetch?: (data: any[]) => Promise<any[]> | any[];
  beforeInsert?: (data: any) => Promise<void> | void;
  beforeInsertMany?: (data: any[]) => Promise<void> | void;
  beforeUpdate?: (queryBuilder: ModelQueryBuilder<any>) => Promise<void> | void;
  beforeDelete?: (queryBuilder: ModelQueryBuilder<any>) => Promise<void> | void;
};

// ---------------------------------------------------------------------------
// Model options
// ---------------------------------------------------------------------------

export type DefineModelOptions = {
  modelCaseConvention?: CaseConvention;
  databaseCaseConvention?: CaseConvention;
  softDeleteColumn?: string;
  softDeleteValue?: boolean | string;
};

// ---------------------------------------------------------------------------
// Full model definition
// ---------------------------------------------------------------------------

export type ModelDefinition<
  C extends Record<string, ColumnDef> = Record<string, ColumnDef>,
  R extends Record<string, RelationDef> = Record<string, RelationDef>,
> = {
  columns: C;
  relations?: R;
  indexes?: IndexDefinition[];
  uniques?: UniqueDefinition[];
  checks?: CheckDefinition[];
  hooks?: HooksDefinition;
  options?: DefineModelOptions;
};

// ---------------------------------------------------------------------------
// Type inference helpers
// ---------------------------------------------------------------------------

type InferColumns<C extends Record<string, ColumnDef>> = {
  [K in keyof C]: C[K] extends ColumnDef<infer T> ? T : never;
};

type InferRelations<R extends Record<string, RelationDef>> = {
  [K in keyof R]: R[K] extends RelationDef<infer T> ? T : never;
};

/**
 * Infers the instance type of a model defined with `defineModel`.
 */
export type InferModel<
  C extends Record<string, ColumnDef>,
  R extends Record<string, RelationDef>,
> = InferColumns<C> & InferRelations<R>;

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
