import { HysteriaError } from "../../errors/hysteria_error";
import { Model } from "./model";
import { BelongsTo } from "./relations/belongs_to";
import { HasMany } from "./relations/has_many";
import { HasOne } from "./relations/has_one";
import { ManyToMany } from "./relations/many_to_many";
import { RelationEnum, Relation } from "./relations/relation";

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

/**
 * columns
 * @description Options for the column decorator
 */
export interface ColumnOptions {
  primaryKey?: boolean;
  serialize?: (value: any) => void;
  prepare?: (value: any) => void;
  hidden?: boolean;
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
  return (target: Object, propertyKey: string | symbol) => {
    if (options.primaryKey) {
      const primaryKey = Reflect.getMetadata(PRIMARY_KEY_METADATA_KEY, target);
      if (primaryKey) {
        throw new HysteriaError(
          "ModelDecorator::column",
          "MULTIPLE_PRIMARY_KEYS_NOT_ALLOWED",
        );
      }
      Reflect.defineMetadata(PRIMARY_KEY_METADATA_KEY, propertyKey, target);
    }

    const column = {
      columnName: propertyKey,
      serialize: options.serialize,
      prepare: options.prepare,
      hidden: options.hidden,
    };

    const existingColumns =
      Reflect.getMetadata(COLUMN_METADATA_KEY, target) || [];
    existingColumns.push(column);
    Reflect.defineMetadata(COLUMN_METADATA_KEY, existingColumns, target);
  };
}

/**
 * @description Decorator to define a date column in the model, uses built in Date javascript object
 * @description This will automatically convert the date to the correct format for the database
 * @description the format is YYYY-MM-DD HH:MM:SS
 * @description This will also automatically convert the date to the correct format when fetching from the database
 */
export function dateColumn(options: ColumnOptions = {}): PropertyDecorator {
  return column({
    ...options,
    prepare: (value: Date) =>
      value.toISOString().slice(0, 19).replace("T", " "),
    serialize: (value: string) => new Date(value),
  });
}

export function getModelColumns(target: typeof Model): {
  columnName: string;
  serialize?: (value: any) => any;
  prepare?: (value: any) => any;
  hidden?: boolean;
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
