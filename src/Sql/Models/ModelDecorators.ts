import { Model } from "./Model";
import { BelongsTo } from "./Relations/BelongsTo";
import { HasMany } from "./Relations/HasMany";
import { HasOne } from "./Relations/HasOne";
import { Relation, RelationOptions, RelationType } from "./Relations/Relation";

type LazyRelationType = {
  type: RelationType;
  columnName: string;
  model: () => typeof Model;
  foreignKey: string;
  options?: RelationOptions;
};

/**
 * Columns
 */

interface ColumnOptions {
  booleanColumn: boolean;
}

const COLUMN_METADATA_KEY = Symbol("columns");
const BOOLEAN_COLUMN_METADATA_KEY = Symbol("booleanColumns");
const RELATION_METADATA_KEY = Symbol("relations");

export function column(
  options: ColumnOptions = { booleanColumn: false },
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
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

export function getModelColumns(target: typeof Model): string[] {
  return Reflect.getMetadata(COLUMN_METADATA_KEY, target.prototype) || [];
}

export function getModelBooleanColumns(target: typeof Model): string[] {
  return (
    Reflect.getMetadata(BOOLEAN_COLUMN_METADATA_KEY, target.prototype) || []
  );
}

/**
 * Relations
 */

/**
 * @description Establishes a belongs to relation with the given model
 * @param model - callback that returns the related model
 * @param foreignKey - the foreign key in the current model that defines the relation
 * @param options - Options for the relation
 * @returns
 */
export function belongsTo(
  model: () => typeof Model,
  foreignKey: string,
  options?: RelationOptions,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const relation = {
      type: RelationType.belongsTo,
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
  model: () => typeof Model,
  foreignKey: string,
  options?: RelationOptions,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const relation = {
      type: RelationType.hasOne,
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
  model: () => typeof Model,
  foreignKey: string,
  options?: RelationOptions,
): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const relation = {
      type: RelationType.hasMany,
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

export function getRelations(target: typeof Model): Relation[] {
  const relations =
    Reflect.getMetadata(RELATION_METADATA_KEY, target.prototype) || [];
  return relations.map((relation: LazyRelationType) => {
    const { type, model, columnName, foreignKey, options } = relation;
    switch (type) {
      case RelationType.belongsTo:
        return new BelongsTo(model(), columnName, foreignKey, options);
      case RelationType.hasOne:
        return new HasOne(model(), columnName, foreignKey, options);
      case RelationType.hasMany:
        return new HasMany(model(), columnName, foreignKey, options);
      default:
        throw new Error(`Unknown relation type: ${type}`);
    }
  });
}
