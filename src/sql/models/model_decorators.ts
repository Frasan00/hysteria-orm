import { Model } from "./model";
import { BelongsTo } from "./relations/belongs_to";
import { HasMany } from "./relations/has_many";
import { HasOne } from "./relations/has_one";
import { ManyToMany } from "./relations/many_to_many";
import { RelationEnum, Relation } from "./relations/relation";

type LazyRelationEnum = {
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
 * @param primaryKey: boolean - If the column is the primary key
 * @param serialize: (value: any) => any - Function to serialize the value after it is retrieved from the database
 * @param prepare: (value: any) => any - Function to prepare the value before it is inserted or updated in the database
 */
export interface ColumnOptions {
  primaryKey?: boolean;
  serialize?: (value: any) => void;
  prepare?: (value: any) => void;
  hidden?: boolean;
}

const COLUMN_METADATA_KEY = Symbol("columns");
const DYNAMIC_COLUMN_METADATA_KEY = Symbol("dynamicColumns");
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
        throw new Error("Multiple primary keys are not allowed");
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
 * @description Defines a dynamic calculated column that is not defined inside the Table, it must be added to a query in order to be retrieved
 */
export function dynamicColumn(columnName: string): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const dynamicColumn = {
      columnName: columnName,
      functionName: propertyKey,
      dynamicColumnFn: target.constructor.prototype[propertyKey],
    };

    const existingColumns =
      Reflect.getMetadata(DYNAMIC_COLUMN_METADATA_KEY, target) || [];
    existingColumns.push(dynamicColumn);
    Reflect.defineMetadata(
      DYNAMIC_COLUMN_METADATA_KEY,
      existingColumns,
      target,
    );
  };
}

/**
 * @description Returns the columns of the model, columns must be decorated with the column decorator
 */
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

    const relation: LazyRelationEnum = {
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
  return relations.map((relation: LazyRelationEnum) => {
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
          throw new Error("Many to many relation must have a through model");
        }

        return new ManyToMany(
          model(),
          columnName,
          relation.manyToManyOptions.throughModel,
          relation.foreignKey,
        );
      default:
        throw new Error(`Unknown relation type: ${type}`);
    }
  });
}

/**
 * @description Returns the primary key of the model
 */
export function getPrimaryKey(target: typeof Model): string {
  return Reflect.getMetadata(PRIMARY_KEY_METADATA_KEY, target.prototype);
}

/**
 * @description Returns every dynamicColumn definition
 */
export function getDynamicColumns(target: typeof Model): {
  columnName: string;
  functionName: string;
  dynamicColumnFn: (...args: any[]) => any;
}[] {
  return Reflect.getMetadata(DYNAMIC_COLUMN_METADATA_KEY, target.prototype);
}
