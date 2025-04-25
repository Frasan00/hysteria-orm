import { HysteriaError } from "../../errors/hysteria_error";
import {
  DateFormat,
  Timezone,
  getDate,
  parseDate,
} from "../../utils/date_utils";
import crypto from "node:crypto";
import { Model } from "./model";
import { BelongsTo } from "./relations/belongs_to";
import { HasMany } from "./relations/has_many";
import { HasOne } from "./relations/has_one";
import { ManyToMany } from "./relations/many_to_many";
import { Relation, RelationEnum } from "./relations/relation";

type LazyRelationType = {
  type: RelationEnum;
  columnName: string;
  model: () => typeof Model;
  foreignKey: string;

  // Only for many to many
  manyToManyOptions?: {
    throughModel: string;
  };
};

type DateColumnOptions = {
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
   * @default false
   */
  autoUpdate?: boolean;
  /**
   * @description Whether to automatically set the timestamp on record creation, uses timezone and format from the dateColumn options
   * @default false
   */
  autoCreate?: boolean;
} & ColumnOptions;

/**
 * columns
 * @description Options for the column decorator
 */
export interface ColumnOptions {
  /**
   * @description Whether the column is the primary key, composite primary keys are not supported
   * @warning Only one primary key is allowed per model
   * @throws {HysteriaError} if more than one primary key is defined
   * @default false
   */
  primaryKey?: boolean;
  /**
   * @description Called on the value returned from the database before it is returned from the model
   */
  serialize?: (value: any) => any | Promise<any>;
  /**
   * @description Called on the value before it is inserted or updated in the database
   * @warning This will not be called on massive update operations since it's not possible to know which values are being updated, so you must pass the value you want to update in the payload
   */
  prepare?: (value: any) => any | Promise<any>;
  /**
   * @description Whether the column is returned in the serialization output
   * @default false
   */
  hidden?: boolean;
  /**
   * @description If true, the prepare function will always be called on update regardless of whether the value has been provided in the update payload
   * @default false
   */
  autoUpdate?: boolean;
}

export interface ColumnType {
  columnName: string;
  serialize?: (value: any) => any | Promise<any>;
  prepare?: (value: any) => any | Promise<any>;
  hidden?: boolean;
  autoUpdate?: boolean;
}

const COLUMN_METADATA_KEY = Symbol("columns");
const PRIMARY_KEY_METADATA_KEY = Symbol("primaryKey");
const RELATION_METADATA_KEY = Symbol("relations");

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

    const column: ColumnType = {
      columnName: propertyKey as string,
      serialize: options.serialize,
      prepare: options.prepare,
      hidden: options.hidden,
      autoUpdate: options.autoUpdate,
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

/**
 * @description Decorator to define a uuid column in the model
 * @description This will automatically generate a uuid if no value is provided
 */
function uuidColumn(options: ColumnOptions = {}): PropertyDecorator {
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
 * @description Decorator to define a boolean column in the model
 * @description This will automatically convert the boolean to the correct format for the database, useful for mysql since it stores booleans as tinyint(1)
 */
function booleanColumn(options: ColumnOptions = {}): PropertyDecorator {
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
function dateColumn(options: DateColumnOptions = {}): PropertyDecorator {
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
function jsonColumn(options: ColumnOptions = {}): PropertyDecorator {
  return column({
    ...options,
    serialize: (value) => JSON.parse(value),
    prepare: (value) => JSON.stringify(value),
  });
}

export function getModelColumns(target: typeof Model): {
  columnName: string;
  serialize?: (value: any) => any;
  prepare?: (value: any) => any;
  hidden?: boolean;
  autoUpdate?: boolean;
}[] {
  return Reflect.getMetadata(COLUMN_METADATA_KEY, target.prototype) || [];
}

/**
 * relations
 */

/**
 * @description Establishes a belongs to relation with the given model
 */
export function belongsTo(
  model: () => typeof Model,
  foreignKey: string,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
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
 */
export function hasOne(
  model: () => typeof Model,
  foreignKey: string,
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
 */
export function hasMany(
  model: () => typeof Model,
  foreignKey: string,
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
  foreignKey: string,
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
    switch (type) {
      case RelationEnum.belongsTo:
        return new BelongsTo(model(), columnName, foreignKey);
      case RelationEnum.hasOne:
        return new HasOne(model(), columnName, foreignKey);
      case RelationEnum.hasMany:
        return new HasMany(model(), columnName, foreignKey);
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
          relation.foreignKey,
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
