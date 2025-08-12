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
import { Model } from "../model";
import { ModelKey } from "../model_manager/model_manager_types";
import { BelongsTo } from "../relations/belongs_to";
import { HasMany } from "../relations/has_many";
import { HasOne } from "../relations/has_one";
import { ManyToMany } from "../relations/many_to_many";
import { Relation, RelationEnum } from "../relations/relation";
import {
  COLUMN_METADATA_KEY,
  PRIMARY_KEY_METADATA_KEY,
  RELATION_METADATA_KEY,
  getDefaultForeignKey,
} from "./model_decorators_constants";
import type {
  AsymmetricEncryptionOptions,
  ColumnOptions,
  ColumnType,
  DateColumnOptions,
  LazyRelationType,
  ManyToManyOptions,
  SymmetricEncryptionOptions,
  ThroughModel,
} from "./model_decorators_types";

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
      autoUpdate: options.autoUpdate,
      databaseName,
      openApiDescription: options.openApiDescription,
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
column.encryption = {
  symmetric,
  asymmetric,
};

function primaryKeyColumn(
  options: Omit<ColumnOptions, "primaryKey"> = {},
): PropertyDecorator {
  return column({
    ...options,
    primaryKey: true,
  });
}

/**
 * @description Decorator to define a integer column in the model, this will automatically convert the integer to the correct format for the database
 * @description Useful in databases like postgres where the integer is returned as a string by the driver
 */
function integerColumn(
  options: Omit<ColumnOptions, "serialize"> = {},
): PropertyDecorator {
  return column({
    ...options,
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

      return Number(value);
    },
  });
}

/**
 * @description Decorator to define a uuid column in the model
 * @description This will automatically generate a uuid if no value is provided
 */
function uuidColumn(
  options: Omit<ColumnOptions, "prepare"> = {},
): PropertyDecorator {
  return column({
    ...options,
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
 */
function ulidColumn(
  options: Omit<ColumnOptions, "prepare"> = {},
): PropertyDecorator {
  return column({
    ...options,
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
    ...options,
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
    ...options,
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
 */
function booleanColumn(
  options: Omit<ColumnOptions, "prepare" | "serialize"> = {},
): PropertyDecorator {
  return column({
    ...options,
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
    ...rest,
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
 */
function jsonColumn(
  options: Omit<ColumnOptions, "prepare" | "serialize"> = {},
): PropertyDecorator {
  return column({
    ...options,
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
 */
export function belongsTo<R extends typeof Model>(
  model: () => R,
  foreignKey?: string,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    foreignKey ||= getDefaultForeignKey(
      (target.constructor as typeof Model).table,
    );

    const relation = {
      type: RelationEnum.belongsTo,
      columnName: propertyKey as string,
      model,
      foreignKey,
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
    foreignKey ||= getDefaultForeignKey(model().table) as ModelKey<
      InstanceType<T>
    >;

    const relation = {
      type: RelationEnum.hasOne,
      columnName: propertyKey as string,
      model,
      foreignKey,
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
    foreignKey ||= getDefaultForeignKey(model().table) as ModelKey<
      InstanceType<T>
    >;

    const relation = {
      type: RelationEnum.hasMany,
      columnName: propertyKey,
      model,
      foreignKey,
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
  throughModelKeys: ManyToManyOptions<T, TM>,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const { leftForeignKey, rightForeignKey } = throughModelKeys;
    const throughModelTable =
      typeof throughModel === "string" ? throughModel : throughModel().table;

    const primaryModel = (target.constructor as typeof Model).table;
    const relation: LazyRelationType = {
      type: RelationEnum.manyToMany,
      columnName: propertyKey as string,
      model,
      foreignKey: leftForeignKey as string,
      manyToManyOptions: {
        primaryModel: primaryModel,
        throughModel: throughModelTable,
        leftForeignKey: leftForeignKey as string,
        rightForeignKey: rightForeignKey as string,
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

    const lazyLoadedModel = model();
    switch (type) {
      case RelationEnum.belongsTo:
        return new BelongsTo(lazyLoadedModel, columnName, foreignKey);
      case RelationEnum.hasOne:
        return new HasOne(lazyLoadedModel, columnName, foreignKey);
      case RelationEnum.hasMany:
        return new HasMany(lazyLoadedModel, columnName, foreignKey);
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
          throughModel: relation.manyToManyOptions.throughModel,
          leftForeignKey:
            relation.manyToManyOptions.leftForeignKey ??
            getDefaultForeignKey(relation.manyToManyOptions.primaryModel),
          rightForeignKey:
            relation.manyToManyOptions.rightForeignKey ??
            getDefaultForeignKey(relation.manyToManyOptions.primaryModel),
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
