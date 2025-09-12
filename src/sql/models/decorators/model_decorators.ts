import crypto from "node:crypto";
import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import { getDate, parseDate } from "../../../utils/date_utils";
import {
  decryptAsymmetric,
  decryptSymmetric,
  encryptAsymmetric,
  encryptSymmetric,
} from "../../../utils/encryption";
import { generateULID } from "../../../utils/ulid";
import { OnUpdateOrDelete } from "../../migrations/schema/schema_types";
import { getColumnValue } from "../../resources/utils";
import { Model } from "../model";
import { ModelKey } from "../model_manager/model_manager_types";
import { ModelQueryBuilder } from "../model_query_builder/model_query_builder";
import { BelongsTo } from "../relations/belongs_to";
import { HasMany } from "../relations/has_many";
import { HasOne } from "../relations/has_one";
import { ManyToMany } from "../relations/many_to_many";
import { Relation, RelationEnum } from "../relations/relation";
import {
  COLUMN_METADATA_KEY,
  INDEX_METADATA_KEY,
  PRIMARY_KEY_METADATA_KEY,
  RELATION_METADATA_KEY,
  UNIQUE_METADATA_KEY,
  getDefaultFkConstraintName,
  getDefaultForeignKey,
  getDefaultIndexName,
  getDefaultPrimaryKeyConstraintName,
  getDefaultUniqueConstraintName,
} from "./model_decorators_constants";
import type {
  AsymmetricEncryptionOptions,
  ColumnDataTypeOptionWithDatePrecision,
  ColumnDataTypeOptionWithLength,
  ColumnDataTypeOptionWithPrecision,
  ColumnDataTypeOptionWithScaleAndPrecision,
  ColumnOptions,
  ColumnType,
  DateColumnOptions,
  IndexType,
  LazyRelationType,
  ManyToManyOptions,
  SymmetricEncryptionOptions,
  ThroughModel,
  UniqueType,
} from "./model_decorators_types";

export type BaseModelRelationType = {
  onDelete?: OnUpdateOrDelete;
  onUpdate?: OnUpdateOrDelete;
  constraintName?: string;
};

/**
 * @description Class decorator to define indexes on the model
 * @description If no indexName is provided, the index name will be the model name plus the columns joined by underscores
 * @example User will have an index named "user_name_index" on the "name" column
 * @example User will have an index named "user_name_email_index" on the "name" and "email" columns
 * ```ts
 * @index(["name", "email"], "user_name_email_index")
 * class User extends Model {
 *   @column()
 *   name!: string;
 * }
 *
 * @index(["name", "email"])
 * class User extends Model {
 *   @column()
 *   name!: string;
 * }
 * ```
 */
export function index(
  indexes: string | string[],
  indexName?: string,
): ClassDecorator {
  return (target: Function) => {
    const newIndexes = Array.isArray(indexes) ? indexes : [indexes];
    const existingIndexes =
      Reflect.getMetadata(INDEX_METADATA_KEY, target.prototype) || [];
    existingIndexes.push({
      columns: newIndexes,
      name:
        indexName ??
        getDefaultIndexName(
          (target as typeof Model).table,
          newIndexes.join("_"),
        ),
    });
    Reflect.defineMetadata(
      INDEX_METADATA_KEY,
      existingIndexes,
      target.prototype,
    );
  };
}

export function unique(
  columns: string | string[],
  constraintName?: string,
): ClassDecorator {
  return (target: Function) => {
    const newColumns = Array.isArray(columns) ? columns : [columns];
    const existingUniques =
      Reflect.getMetadata(UNIQUE_METADATA_KEY, target.prototype) || [];
    existingUniques.push({
      columns: newColumns,
      name:
        constraintName ??
        getDefaultUniqueConstraintName(
          (target as typeof Model).table,
          newColumns.join("_"),
        ),
    });
    Reflect.defineMetadata(
      UNIQUE_METADATA_KEY,
      existingUniques,
      target.prototype,
    );
  };
}

/**
 * @description Decorator to define a view on the model
 * @description This will automatically create a view on the database with the given statement
 * @description Since a view is intended to get data from other tables, a migration is not necessary
 * @example
 * ```ts
 * @view((query) => {
 *   query.select("*").from("users");
 * })
 * class User extends Model {
 *   @column()
 *   name!: string;
 * }
 * ```
 */
export function view(
  statement: (query: ModelQueryBuilder<any>) => void,
): ClassDecorator {
  return (target: Function) => {
    const targetClass = target as typeof Model;
    const originalQuery = targetClass.query;
    targetClass.query = function (...args: Parameters<typeof originalQuery>) {
      const query = originalQuery.bind(this).call(this, ...args);
      statement(query);
      return query;
    } as typeof originalQuery;
  };
}

/**
 * @description Decorator to define a column in the model
 */
export function column(
  options: ColumnOptions = {
    primaryKey: false,
  },
): PropertyDecorator {
  const isPrimaryKey = options?.primaryKey ?? false;
  return (target: Object, propertyKey: string | symbol) => {
    const targetModel = target.constructor as typeof Model;
    if (isPrimaryKey) {
      const primaryKey = Reflect.getMetadata(PRIMARY_KEY_METADATA_KEY, target);
      if (primaryKey) {
        throw new HysteriaError(
          "ModelDecorator::column",
          "MULTIPLE_PRIMARY_KEYS_NOT_ALLOWED",
        );
      }
      Reflect.defineMetadata(PRIMARY_KEY_METADATA_KEY, propertyKey, target);
    }
    const databaseName =
      options.databaseName ??
      convertCase(propertyKey as string, targetModel.databaseCaseConvention);
    const column: ColumnType = {
      columnName: propertyKey as string,
      serialize: options.serialize,
      prepare: options.prepare,
      hidden: options.hidden,
      isPrimary: isPrimaryKey,
      primaryKeyConstraintName:
        options.primaryKeyConstraintName ??
        getDefaultPrimaryKeyConstraintName(
          targetModel.table,
          propertyKey as string,
        ),
      autoUpdate: options.autoUpdate,
      databaseName,
      openApiDescription: options.openApiDescription,
      type: options.type,
      length: (options as ColumnDataTypeOptionWithLength)?.length,
      precision: (options as ColumnDataTypeOptionWithPrecision)?.precision,
      scale: (options as ColumnDataTypeOptionWithScaleAndPrecision)?.scale,
      withTimezone: (options as ColumnDataTypeOptionWithDatePrecision)
        ?.withTimezone,
      constraints: {
        nullable: options.nullable,
        default: options.default,
      },
    };
    const existingColumns =
      Reflect.getMetadata(COLUMN_METADATA_KEY, target) || [];
    existingColumns.push(column);
    Reflect.defineMetadata(COLUMN_METADATA_KEY, existingColumns, target);
  };
}

column.primary = primaryKeyColumn;
column.date = dateColumn;
column.boolean = booleanColumn;
column.json = jsonColumn;
column.uuid = uuidColumn;
column.ulid = ulidColumn;
column.integer = integerColumn;
column.float = floatColumn;
column.encryption = {
  symmetric,
  asymmetric,
};

function primaryKeyColumn(
  options: Omit<ColumnOptions, "primaryKey"> = {},
): PropertyDecorator {
  return column({
    ...(options as ColumnOptions),
    primaryKey: true,
  });
}

function floatColumn(
  options: Omit<ColumnOptions, "serialize"> = {},
): PropertyDecorator {
  return column({
    type: "float",
    ...(options as ColumnOptions),
    serialize: (value) => {
      if (value === undefined) {
        return;
      }

      if (value === null) {
        return null;
      }

      if (typeof value === "number") {
        return value;
      }

      if (typeof value === "string") {
        return +value;
      }

      return Number.parseFloat(value);
    },
  });
}

/**
 * @description Decorator to define a integer column in the model, this will automatically convert the integer to the correct format for the database
 * @description Useful in databases like postgres where the integer is returned as a string by the driver
 * @description Defaults type to integer for migration generation
 */
function integerColumn(
  options: Omit<ColumnOptions, "serialize"> = {},
): PropertyDecorator {
  return column({
    type: "integer",
    ...(options as ColumnOptions),
    serialize: (value) => {
      if (value === undefined) {
        return;
      }

      if (value === null) {
        return null;
      }

      if (typeof value === "number") {
        return value;
      }

      if (typeof value === "string") {
        return +value;
      }

      return Number.parseInt(value);
    },
  });
}

/**
 * @description Decorator to define a uuid column in the model
 * @description This will automatically generate a uuid if no value is provided
 * @description Defaults type to uuid for migration generation
 */
function uuidColumn(
  options: Omit<ColumnOptions, "prepare"> = {},
): PropertyDecorator {
  return column({
    type: "uuid",
    ...(options as ColumnOptions),
    prepare: (value) => {
      if (!value) {
        return crypto.randomUUID();
      }

      return value;
    },
  });
}

/**
 * @description Decorator to define a ulid column in the model
 * @description This will automatically generate a ulid if no value is provided
 * @description Defaults type to ulid for migration generation
 */
function ulidColumn(
  options: Omit<ColumnOptions, "prepare"> = {},
): PropertyDecorator {
  return column({
    type: "ulid",
    ...(options as ColumnOptions),
    prepare: (value) => {
      if (!value) {
        return generateULID();
      }

      return value;
    },
  });
}

/**
 * @description Decorator to define a symmetric encrypted column in the model with a key
 * @description This will automatically encrypt the value before it is inserted or updated in the database and decrypt it when it is retrieved from the database
 * @description If no value is provided, the value will be returned as is
 */
function symmetric(
  options: Omit<SymmetricEncryptionOptions, "prepare" | "serialize">,
): PropertyDecorator {
  return column({
    ...(options as ColumnOptions),
    prepare: (value) => {
      if (!value) {
        return value;
      }

      return encryptSymmetric(options.key, value);
    },
    serialize: (value) => {
      if (!value) {
        return value;
      }

      return decryptSymmetric(options.key, value);
    },
  });
}

/**
 * @description Decorator to define a asymmetric encrypted column in the model with public and private keys
 * @description This will automatically encrypt the value before it is inserted or updated in the database and decrypt it when it is retrieved from the database
 * @description If no value is provided, the value will be returned as is
 */
function asymmetric(
  options: Omit<AsymmetricEncryptionOptions, "prepare" | "serialize">,
): PropertyDecorator {
  return column({
    ...(options as ColumnOptions),
    prepare: (value) => {
      if (!value) {
        return value;
      }

      return encryptAsymmetric(options.publicKey, value);
    },
    serialize: (value) => {
      if (!value) {
        return value;
      }

      return decryptAsymmetric(options.privateKey, value);
    },
  });
}

/**
 * @description Decorator to define a boolean column in the model
 * @description This will automatically convert the boolean to the correct format for the database, useful for mysql since it stores booleans as tinyint(1)
 * @description Defaults type to boolean for migration generation
 */
function booleanColumn(
  options: Omit<ColumnOptions, "prepare" | "serialize"> = {},
): PropertyDecorator {
  return column({
    type: "boolean",
    ...(options as ColumnOptions),
    serialize: (value) => Boolean(value),
    prepare: (value) => Boolean(value),
  });
}

/**
 * @description Decorator to define a date column in the model
 * @description This will automatically convert the date to the correct format for the database
 * @description Supports both ISO format (YYYY-MM-DD HH:mm:ss) and Unix timestamp
 * @description Handles timezone conversion between UTC and local time
 * @description Can automatically update/create timestamps
 * @param options Configuration options for the date column
 * @param options.format The format to store dates in ('ISO' or 'TIMESTAMP')
 * @param options.timezone The timezone to use ('UTC' or 'LOCAL')
 * @param options.autoUpdate Whether to automatically update the timestamp on record updates
 * @param options.autoCreate Whether to automatically set the timestamp on record creation
 */
function dateColumn(
  options: Omit<DateColumnOptions, "prepare" | "serialize"> = {},
): PropertyDecorator {
  const {
    format = "ISO",
    timezone = "UTC",
    autoUpdate = false,
    autoCreate = false,
    ...rest
  } = options;

  return column({
    type: "datetime",
    ...(rest as ColumnOptions),
    autoUpdate,
    prepare: (value?: Date | string | null): string | null | undefined => {
      if (!value) {
        if (autoCreate) {
          return getDate(new Date(), format, timezone);
        }

        return null;
      }

      if (autoUpdate) {
        return getDate(new Date(), format, timezone);
      }

      if (typeof value === "string") {
        return value;
      }

      return getDate(value, format, timezone);
    },
    serialize: (value?: Date | string | null): Date | null | undefined => {
      if (value === undefined) {
        return;
      }

      if (value === null) {
        return null;
      }

      return parseDate(value, format, timezone);
    },
  });
}

/**
 * @description Decorator to define a json column in the model
 * @description This will automatically convert the json to the correct format for the database
 * @throws json parse error if the value from the database is not valid json
 * @description Defaults type to jsonb for migration generation
 */
function jsonColumn(
  options: Omit<ColumnOptions, "prepare" | "serialize"> = {},
): PropertyDecorator {
  return column({
    type: "jsonb",
    ...(options as ColumnOptions),
    serialize: (value) => {
      if (typeof value === "string") {
        return JSON.parse(value);
      }

      return value;
    },
    prepare: (value) => {
      if (!(typeof value === "string")) {
        return JSON.stringify(value);
      }

      return value;
    },
  });
}

export function getModelColumns(target: typeof Model): ColumnType[] {
  try {
    return Reflect.getMetadata(COLUMN_METADATA_KEY, target.prototype) || [];
  } catch (error) {
    return [];
  }
}

/**
 * relations
 */

/**
 * @description Establishes a belongs to relation with the given model
 * @default foreignKey by default will be the singular of the model that establishes the relation name plus "_id"
 * @example Post that has a user will have foreignKey "user_id" on the  model
 * ```typescript
 * belongsTo<typeof Post>(() => User, 'userId')
 * ```
 */
export function belongsTo<
  M extends typeof Model = any,
  R extends typeof Model = any,
>(
  model: () => R,
  foreignKey?: ModelKey<InstanceType<M>>,
  options?: BaseModelRelationType,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const fallbackForeignKey = () =>
      getDefaultForeignKey(model().table as string);
    const fallbackConstraintName = () => {
      const targetTable = (target.constructor as typeof Model).table;
      const fkColumn = foreignKey || fallbackForeignKey();
      return getDefaultFkConstraintName(
        targetTable,
        fkColumn as string,
        model().table,
      );
    };

    const relation: LazyRelationType = {
      type: RelationEnum.belongsTo,
      columnName: propertyKey as string,
      model,
      foreignKey: foreignKey ? String(foreignKey) : fallbackForeignKey,
      constraintName: options?.constraintName ?? fallbackConstraintName,
      onUpdate: options?.onUpdate,
      onDelete: options?.onDelete,
    };

    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}

/**
 * @description Establishes a has one relation with the given model
 * @default foreignKey by default will be the singular of the model name plus "_id"
 * @example User will have foreignKey "user_id" on the Post model
 */
export function hasOne<T extends typeof Model>(
  model: () => T,
  foreignKey?: ModelKey<InstanceType<T>>,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const fallbackForeignKey = () =>
      getDefaultForeignKey((target.constructor as typeof Model).table);

    const relation: LazyRelationType = {
      type: RelationEnum.hasOne,
      columnName: propertyKey as string,
      model,
      constraintName: "None",
      foreignKey: foreignKey ? String(foreignKey) : fallbackForeignKey,
    };

    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}

/**
 * @description Establishes a has many relation with the given model
 * @default foreignKey by default will be the singular of the model name plus "_id"
 * @example User will have foreignKey "user_id" on the Post model
 */
export function hasMany<T extends typeof Model>(
  model: () => T,
  foreignKey?: ModelKey<InstanceType<T>>,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const fallbackForeignKey = () =>
      getDefaultForeignKey((target.constructor as typeof Model).table);

    const relation: LazyRelationType = {
      type: RelationEnum.hasMany,
      columnName: propertyKey as string,
      model,
      constraintName: "None",
      foreignKey: foreignKey ? String(foreignKey) : fallbackForeignKey,
    };

    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}

/**
 * @description Establishes a many to many relation with the given model
 * @default foreignKey by default will be the singular of the model that establishes the relation name plus "_id"
 * @param model The model that establishes the relation
 * @param throughModel The model that is used to join the two models
 * @param throughModelKeys The keys of the through model
 * @param throughModelKeys.leftForeignKey The foreign key of the through model from the primary model (where you are defining the many to many relation)
 * @param throughModelKeys.rightForeignKey The foreign key of the through model from the related model (the model you are joining to)
 * @example User will have foreignKey "user_id" on the Join table by default
 */
export function manyToMany<
  R extends typeof Model,
  T extends typeof Model,
  TM extends ThroughModel<T>,
>(
  model: () => R,
  throughModel: TM,
  throughModelKeys?: ManyToManyOptions<T, TM>,
  options?: BaseModelRelationType,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const { leftForeignKey, rightForeignKey } = throughModelKeys ?? {};
    const wasModelProvided = typeof throughModel !== "string";
    const throughModelTable =
      typeof throughModel === "string"
        ? throughModel
        : () => throughModel().table;

    const primaryModel = (target.constructor as typeof Model).table;
    const fallbackLeftForeignKey = () => getDefaultForeignKey(primaryModel);
    const fallbackRightForeignKey = () => getDefaultForeignKey(model().table);
    const fallbackConstraintName = () =>
      getDefaultFkConstraintName(
        getColumnValue(throughModelTable),
        leftForeignKey ? String(leftForeignKey) : fallbackLeftForeignKey(),
      );

    const relation: LazyRelationType = {
      type: RelationEnum.manyToMany,
      columnName: propertyKey as string,
      model,
      constraintName: options?.constraintName ?? fallbackConstraintName,
      foreignKey: leftForeignKey
        ? String(leftForeignKey)
        : fallbackLeftForeignKey,
      onDelete: options?.onDelete,
      onUpdate: options?.onUpdate,
      manyToManyOptions: {
        primaryModel: primaryModel,
        throughModel: throughModelTable,
        leftForeignKey: leftForeignKey
          ? String(leftForeignKey)
          : fallbackLeftForeignKey,
        rightForeignKey: rightForeignKey
          ? String(rightForeignKey)
          : fallbackRightForeignKey,
        wasModelProvided,
      },
    };

    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}

export function getRelationsMetadata(target: typeof Model): LazyRelationType[] {
  return Reflect.getMetadata(RELATION_METADATA_KEY, target.prototype) || [];
}

/**
 * @description Returns the relations of the model
 */
export function getRelations(target: typeof Model): Relation[] {
  const relations =
    Reflect.getMetadata(RELATION_METADATA_KEY, target.prototype) || [];
  return relations.map((relation: LazyRelationType) => {
    const { type, model, columnName, foreignKey } = relation;

    const resolvedForeignKey = getColumnValue(foreignKey);

    const lazyLoadedModel = model();
    switch (type) {
      case RelationEnum.belongsTo:
        return new BelongsTo(lazyLoadedModel, columnName, resolvedForeignKey);
      case RelationEnum.hasOne:
        return new HasOne(lazyLoadedModel, columnName, resolvedForeignKey);
      case RelationEnum.hasMany:
        return new HasMany(lazyLoadedModel, columnName, resolvedForeignKey);
      case RelationEnum.manyToMany:
        if (!relation.manyToManyOptions) {
          throw new HysteriaError(
            "ModelDecorator::getRelations",
            "MANY_TO_MANY_RELATION_MUST_HAVE_A_THROUGH_MODEL",
          );
        }

        const relatedModel = model();
        return new ManyToMany(relatedModel, columnName, {
          primaryModel: relation.manyToManyOptions.primaryModel,
          throughModel: getColumnValue(relation.manyToManyOptions.throughModel),
          leftForeignKey: getColumnValue(
            relation.manyToManyOptions.leftForeignKey,
          ),
          rightForeignKey: getColumnValue(
            relation.manyToManyOptions.rightForeignKey,
          ),
        });
      default:
        throw new HysteriaError(
          "ModelDecorator::getRelations",
          `UNKNOWN_RELATION_TYPE_${type}`,
        );
    }
  });
}

/**
 * @description Returns the primary key of the model
 */
export function getPrimaryKey(target: typeof Model): string {
  return Reflect.getMetadata(PRIMARY_KEY_METADATA_KEY, target.prototype);
}

export function getIndexes(target: typeof Model): IndexType[] {
  return Reflect.getMetadata(INDEX_METADATA_KEY, target.prototype) || [];
}

export function getUniques(target: typeof Model): UniqueType[] {
  return Reflect.getMetadata(UNIQUE_METADATA_KEY, target.prototype) || [];
}
