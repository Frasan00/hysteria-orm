import { OpenApiModelPropertyType } from "../../../openapi/openapi_types";
import { DateFormat, Timezone } from "../../../utils/date_utils";
import { CreateTableBuilder } from "../../migrations/schema/create_table";
import { OnUpdateOrDelete } from "../../migrations/schema/schema_types";
import type { AnyModelConstructor } from "../define_model_types";
import { ModelKey } from "../model_manager/model_manager_types";
import { RelationEnum } from "../relations/relation";

type BaseColumnDataType = Exclude<
  keyof CreateTableBuilder,
  "enum" | "rawColumn" | "custom"
>;

/**
 * Column data type - supports built-in types with intellisense and custom string types.
 * Built-in types get autocomplete, custom types pass through as-is for extensions like pgvector.
 * @example
 * col<string>({ type: "varchar", length: 255 }) // built-in
 * col<string>({ type: "vector", length: 1536 })  // custom (pgvector)
 */
type ColumnDataType = BaseColumnDataType | (string & {}) | readonly string[];

export type ColumnDataTypeOptionWithLength = {
  type?:
    | "char"
    | "varchar"
    | "string"
    | "uuid"
    | "ulid"
    | "varbinary"
    | "integer"
    | "tinyint"
    | "smallint"
    | "mediumint"
    | "bigint"
    | "increment"
    | "bigIncrement";
  length?: number;
};

export type ColumnDataTypeOptionWithEnum = {
  type?: readonly string[];
};

export type ColumnDataTypeOptionWithPrecision = {
  type?: "float" | "double" | "real";
  precision?: number;
};

export type ColumnDataTypeOptionWithScaleAndPrecision = {
  type?: "decimal" | "numeric";
  precision?: number;
  scale?: number;
};

export type ColumnDataTypeOptionWithText = {
  type?: "text" | "longtext" | "mediumtext" | "tinytext";
};

export type ColumnDataTypeOptionWithBinary = {
  type?: "binary" | "blob" | "tinyblob" | "mediumblob" | "longblob";
};

export type ColumnDataTypeOptionWithDatePrecision = {
  type?: "date" | "time" | "datetime" | "timestamp";
  precision?: number;
  withTimezone?: boolean;
};

export type ColumnDataTypeOptionSimple = {
  type?: "year" | "boolean" | "json" | "jsonb";
};

/**
 * Custom column type for database extensions (e.g., pgvector).
 * The type string is passed through as-is to the SQL interpreter.
 * @example
 * col<string>({ type: "vector", length: 1536 }) // PostgreSQL pgvector
 * col<string>({ type: "geometry" })              // PostGIS
 */
export type ColumnDataTypeOptionCustom = {
  /**
   * Custom database column type. Passes through as-is to SQL.
   * Supports extensions like pgvector, PostGIS, etc.
   */
  type?: string & {};
  /**
   * Optional length for custom types (e.g., vector(1536)).
   */
  length?: number;
};

export type ColumnDataTypeOption =
  | ColumnDataTypeOptionWithLength
  | ColumnDataTypeOptionWithPrecision
  | ColumnDataTypeOptionWithScaleAndPrecision
  | ColumnDataTypeOptionWithText
  | ColumnDataTypeOptionWithBinary
  | ColumnDataTypeOptionWithDatePrecision
  | ColumnDataTypeOptionWithEnum
  | ColumnDataTypeOptionSimple
  | ColumnDataTypeOptionCustom;

export type LazyRelationType = {
  type?: RelationEnum;
  columnName: string;
  model: () => AnyModelConstructor;
  foreignKey: string | (() => string);
  constraintName: string | (() => string);
  onDelete?: OnUpdateOrDelete;
  onUpdate?: OnUpdateOrDelete;

  /**
   * @description Only for many to many relations
   */
  manyToManyOptions?: {
    primaryModel: string;
    throughModel: string | (() => string);
    leftForeignKey: string | (() => string);
    rightForeignKey: string | (() => string);
    wasModelProvided: boolean;
  };
};

/**
 * Callback type for autoCreate/autoUpdate hooks on date columns.
 * Returns `Date` when used with date-mode columns (e.g. `col.datetime()`),
 * returns `string` when used with string-mode columns (e.g. `col.datetime.string()`).
 */
export type DateAutoHook = (() => Date) | (() => string);

export type DateColumnOptions = {
  /**
   * @description The format to store dates in ('ISO' or 'TIMESTAMP')
   * @default "ISO"
   */
  format?: DateFormat;
  /**
   * @description The timezone to use ('UTC' or 'LOCAL')
   * @default "UTC"
   */
  timezone?: Timezone;
  /**
   * @description Whether to automatically update the timestamp on record updates, uses timezone and format from the dateColumn options
   * @description If true, uses the default implementation (current date). If a callback, calls it to get the value.
   * @warning This is a code wise implementation it does not generate a trigger in the database, works with bulk updates too
   * @default false
   */
  autoUpdate?: boolean | DateAutoHook;
  /**
   * @description Whether to automatically set the timestamp on record creation, uses timezone and format from the dateColumn options
   * @description If true, uses the default implementation (current date). If a callback, calls it to get the value.
   * @warning This is a code wise implementation it does not generate a trigger in the database, works with bulk creations too
   * @default false
   */
  autoCreate?: boolean | DateAutoHook;
} & Omit<ColumnOptions, "serialize" | "prepare" | "autoUpdate">;

/**
 * @description Options for @column.datetime and @column.timestamp decorators.
 * Extends DateColumnOptions with date-specific options (precision, withTimezone).
 * If `timezone` is provided, `withTimezone` defaults to true in migration generation
 * unless explicitly overridden with `withTimezone: false`.
 */
export type DatetimeColumnOptions = Omit<DateColumnOptions, "format"> &
  Pick<ColumnDataTypeOptionWithDatePrecision, "withTimezone" | "precision">;

export type SymmetricEncryptionOptions = {
  /**
   * @description The key to use for the symmetric encryption
   */
  key: string;
} & ColumnOptions;

export type AsymmetricEncryptionOptions = {
  /**
   * @description The public key to use for the asymmetric encryption
   */
  publicKey: string;
  /**
   * @description The private key to use for the asymmetric encryption
   */
  privateKey: string;
} & ColumnOptions;

/**
 * columns
 * @description Options for the column decorator
 */
export type ColumnOptions = {
  /**
   * @description Whether the column is the primary key, composite primary keys are not supported
   * @warning Only one primary key is allowed per model
   * @throws {HysteriaError} if more than one primary key is defined
   * @default false
   */
  primaryKey?: boolean;
  /**
   * @description The name of the primary key constraint in the database for automatic migrations
   */
  primaryKeyConstraintName?: string;
  /**
   * @description Called on the value returned from the database before it is returned from the model
   */
  serialize?: (value: any) => any;
  /**
   * @description Called on the value before it is inserted or updated in the database
   * @warning This will not be called on massive update operations since it's not possible to know which values are being updated, so you must pass the value you want to update in the payload
   */
  prepare?: (value: any) => any;
  /**
   * @description If true, the prepare function will always be called on update regardless of whether the value has been provided in the update payload
   * @default false
   */
  autoUpdate?: boolean;
  /**
   * @description The name of the column in the database, can be used to specify the column name in the database
   * @default The name of the property following the model case convention
   */
  databaseName?: string;
  /**
   * @description Custom OpenAPI schema for the column, if omitted, the column type will be inferred from the other options in best effort
   */
  openApi?: OpenApiModelPropertyType & { required?: boolean };
  /**
   * @description Whether the column can be null in the database
   * @migration Only affects auto-generated migrations
   */
  nullable?: boolean;
  /**
   * @description The default value for the column in the database.
   * @migration Only affects auto-generated migrations (CREATE TABLE / ALTER TABLE). Does NOT set a default value during insert operations — use `prepare` for that.
   */
  default?: string | number | null | boolean;
} &
  /**
   * @description The data type of the column
   * @migration Only affects auto-generated migrations
   */
  ColumnDataTypeOption;

export type ColumnType = {
  columnName: string;
  databaseName: string;
  serialize?: (value: any) => any | Promise<any>;
  prepare?: (value: any) => any | Promise<any>;
  autoUpdate?: boolean;
  isPrimary: boolean;
  openApi?: OpenApiModelPropertyType & { required?: boolean };
  /** Database specific data for migrations, must be provided or it'll be ignored for auto-generated migrations */
  primaryKeyConstraintName?: string;
  type?: ColumnDataType;
  length?: number;
  precision?: number;
  scale?: number;
  withTimezone?: boolean;
  unsigned?: boolean;
  zerofill?: boolean;
  constraints?: {
    nullable?: boolean;
    default?: string | number | null | boolean;
  };
};

type ThroughModelCallback<T extends AnyModelConstructor> = () => T;
type ThroughModelString = string;
export type ThroughModel<T extends AnyModelConstructor> =
  | ThroughModelCallback<T>
  | ThroughModelString;

type ExtractModelFromTM<TM extends ThroughModel<any>> =
  TM extends ThroughModelCallback<infer T> ? T : never;

export type ManyToManyOptions<
  T extends AnyModelConstructor,
  TM extends ThroughModel<T>,
> = {
  /**
   * @description The foreign key of current model on the Pivot table
   * @example If the current model is User and the through model is UserAddress, the leftForeignKey will be "userId"
   */
  leftForeignKey?: TM extends ThroughModelString
    ? string
    : ModelKey<InstanceType<ExtractModelFromTM<TM>>>;

  /**
   * @description The foreign key of the related model on the Pivot table
   * @example If the current model is User and the through model is UserAddress, the rightForeignKey will be "addressId"
   */
  rightForeignKey?: TM extends ThroughModelString
    ? string
    : ModelKey<InstanceType<ExtractModelFromTM<TM>>>;
};

export type ManyToManyStringOptions = {
  leftForeignKey?: string;
  rightForeignKey?: string;
};

export type IndexType = {
  columns: string[];
  name: string;
};

export type UniqueType = {
  columns: string[];
  name: string;
};

export type CheckType = {
  expression: string;
  name: string;
};

/**
 * @description A property decorator that constrains the decorated property to type V.
 * TypeScript infers K from the property name and T from the class, then checks
 * that the property at key K is assignable to V.
 */
export type TypedPropertyDecorator<V> = <
  K extends string,
  T extends Record<K, V>,
>(
  target: T,
  propertyKey: K,
) => void;
