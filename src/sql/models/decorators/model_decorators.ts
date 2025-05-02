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
  SymmetricEncryptionOptions,
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
    };

    const existingColumns =
      Reflect.getMetadata(COLUMN_METADATA_KEY, target) || [];
    existingColumns.push(column);
    Reflect.defineMetadata(COLUMN_METADATA_KEY, existingColumns, target);
  };
}

column.date = dateColumn;
column.boolean = booleanColumn;
column.json = jsonColumn;
column.uuid = uuidColumn;
column.ulid = ulidColumn;
column.encryption = {
  symmetric,
  asymmetric,
};

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
    prepare: (value: Date | string) => {
      if (!value) {
        if (autoCreate) {
          return getDate(new Date(), format, timezone);
        }

        return null;
      }

      if (autoUpdate) {
        return getDate(parseDate(value)!, format, timezone);
      }

      return value;
    },
    serialize: (value: string | Date) => {
      if (value === undefined) {
        return;
      }

      if (value === null) {
        return null;
      }

      return value;
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
 * @example Post that has a user will have foreignKey "post_id"
 */
export function belongsTo(
  model: () => typeof Model,
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
 * @example User will have foreignKey "user_id"
 */
export function hasOne<T extends typeof Model>(
  model: () => T,
  foreignKey?: ModelKey<InstanceType<T>>,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
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
 * @example User will have foreignKey "user_id"
 */
export function hasMany(
  model: () => typeof Model,
  foreignKey?: string,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
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
 */
export function manyToMany(
  model: () => typeof Model,
  throughModel: (() => typeof Model) | string,
  foreignKey?: string,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    if (!(typeof throughModel === "string")) {
      throughModel = throughModel().table;
    }

    const relation: LazyRelationType = {
      type: RelationEnum.manyToMany,
      columnName: propertyKey as string,
      model,
      foreignKey,
      manyToManyOptions: {
        throughModel,
      },
    };

    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
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
    const loadedForeignKey =
      relation.foreignKey ?? getDefaultForeignKey(lazyLoadedModel.table);

    switch (type) {
      case RelationEnum.belongsTo:
        return new BelongsTo(lazyLoadedModel, columnName, loadedForeignKey);
      case RelationEnum.hasOne:
        return new HasOne(lazyLoadedModel, columnName, loadedForeignKey);
      case RelationEnum.hasMany:
        return new HasMany(lazyLoadedModel, columnName, loadedForeignKey);
      case RelationEnum.manyToMany:
        if (!relation.manyToManyOptions) {
          throw new HysteriaError(
            "ModelDecorator::getRelations",
            "MANY_TO_MANY_RELATION_MUST_HAVE_A_THROUGH_MODEL",
          );
        }

        return new ManyToMany(
          model(),
          columnName,
          relation.manyToManyOptions.throughModel,
          loadedForeignKey,
        );
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
