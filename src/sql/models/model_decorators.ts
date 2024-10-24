import { Model as Entity } from "./model";
import { BelongsTo } from "./relations/belongs_to";
import { HasMany } from "./relations/has_many";
import { HasOne } from "./relations/has_one";
import { RelationEnum, RelationOptions, Relation } from "./relations/relation";

type LazyRelationEnum = {
  type: RelationEnum;
  columnName: string;
  model: () => typeof Entity;
  foreignKey: string;
  options?: RelationOptions;
};

/**
 * columns
 */

interface ColumnOptions {
  booleanColumn?: boolean;
  primaryKey?: boolean;
}

const COLUMN_METADATA_KEY = Symbol("columns");
const DYNAMIC_COLUMN_METADATA_KEY = Symbol("dynamicColumns");
const PRIMARY_KEY_METADATA_KEY = Symbol("primaryKey");
const BOOLEAN_COLUMN_METADATA_KEY = Symbol("booleanColumns");
const RELATION_METADATA_KEY = Symbol("relations");

/**
 * @description Decorator to define a column in the model
 * @param options - Options for the column
 * @returns
 */
export function column(
  options: ColumnOptions = { primaryKey: false, booleanColumn: false },
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    if (options.primaryKey) {
      const primaryKey = Reflect.getMetadata(PRIMARY_KEY_METADATA_KEY, target);
      if (primaryKey) {
        throw new Error("Multiple primary keys are not allowed");
      }
      Reflect.defineMetadata(PRIMARY_KEY_METADATA_KEY, propertyKey, target);
    }

    if (options.booleanColumn) {
      const booleanColumns =
        Reflect.getMetadata(BOOLEAN_COLUMN_METADATA_KEY, target) || [];
      booleanColumns.push(propertyKey);
      Reflect.defineMetadata(
        BOOLEAN_COLUMN_METADATA_KEY,
        booleanColumns,
        target,
      );
    }

    const existingColumns =
      Reflect.getMetadata(COLUMN_METADATA_KEY, target) || [];
    existingColumns.push(propertyKey);
    Reflect.defineMetadata(COLUMN_METADATA_KEY, existingColumns, target);
  };
}

/**
 * @description Defines a dynamic calculated column that is not defined inside the Table, it must be added to a query in order to be retrieved
 * @param columnName that will be filled inside the dynamicColumn field
 * @returns
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
 * @param target Model
 * @returns
 */
export function getModelColumns(target: typeof Entity): string[] {
  return Reflect.getMetadata(COLUMN_METADATA_KEY, target.prototype) || [];
}

/**
 * @description Returns the boolean columns of the model
 * @param target Model
 * @returns
 */
export function getModelBooleanColumns(target: typeof Entity): string[] {
  return (
    Reflect.getMetadata(BOOLEAN_COLUMN_METADATA_KEY, target.prototype) || []
  );
}

/**
 * relations
 */

/**
 * @description Establishes a belongs to relation with the given model
 * @param model - callback that returns the related model
 * @param foreignKey - the foreign key in the current model that defines the relation
 * @param options - Options for the relation
 * @returns
 */
export function belongsTo(
  model: () => typeof Entity,
  foreignKey: string,
  options?: RelationOptions,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const relation = {
      type: RelationEnum.belongsTo,
      columnName: propertyKey as string,
      model,
      foreignKey,
      options,
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}

/**
 * @description Establishes a has one relation with the given model
 * @param model - callback that returns the related model
 * @param foreignKey - the foreign key in the relation model that defines the relation
 * @param options - Options for the relation
 * @returns
 */
export function hasOne(
  model: () => typeof Entity,
  foreignKey: string,
  options?: RelationOptions,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const relation = {
      type: RelationEnum.hasOne,
      columnName: propertyKey as string,
      model,
      foreignKey,
      options,
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}

/**
 * @description Establishes a has many relation with the given model
 * @param model - callback that returns the related model
 * @param foreignKey - the foreign key in the relation model that defines the relation
 * @param options - Options for the relation
 * @returns
 */
export function hasMany(
  model: () => typeof Entity,
  foreignKey: string,
  options?: RelationOptions,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const relation = {
      type: RelationEnum.hasMany,
      columnName: propertyKey,
      model,
      foreignKey,
      options,
    };
    const relations = Reflect.getMetadata(RELATION_METADATA_KEY, target) || [];
    relations.push(relation);
    Reflect.defineMetadata(RELATION_METADATA_KEY, relations, target);
  };
}

/**
 * @description Returns the relations of the model
 * @param target Model
 * @returns
 */
export function getRelations(target: typeof Entity): Relation[] {
  const relations =
    Reflect.getMetadata(RELATION_METADATA_KEY, target.prototype) || [];
  return relations.map((relation: LazyRelationEnum) => {
    const { type, model, columnName, foreignKey, options } = relation;
    switch (type) {
      case RelationEnum.belongsTo:
        return new BelongsTo(model(), columnName, foreignKey, options);
      case RelationEnum.hasOne:
        return new HasOne(model(), columnName, foreignKey, options);
      case RelationEnum.hasMany:
        return new HasMany(model(), columnName, foreignKey, options);
      default:
        throw new Error(`Unknown relation type: ${type}`);
    }
  });
}

/**
 * @description Returns the primary key of the model
 * @param target Model
 * @returns
 */
export function getPrimaryKey(target: typeof Entity): string {
  return Reflect.getMetadata(PRIMARY_KEY_METADATA_KEY, target.prototype);
}

/**
 * @description Returns every dynamicColumn definition
 */
export function getDynamicColumns(target: typeof Entity): {
  columnName: string;
  functionName: string;
  dynamicColumnFn: (...args: any[]) => any;
}[] {
  return Reflect.getMetadata(DYNAMIC_COLUMN_METADATA_KEY, target.prototype);
}
