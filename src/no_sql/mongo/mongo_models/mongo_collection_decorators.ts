import "reflect-metadata";
import { Collection } from "./mongo_collection";

const MONGO_PROPERTY_METADATA_KEY = Symbol("mongoProperties");
const MONGO_DYNAMIC_PROPERTY_METADATA_KEY = Symbol("mongoDynamicProperties");

/**
 * @description Defines a property that will be used in the model
 * @returns
 */
export function property(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const existingProperties =
      Reflect.getMetadata(MONGO_PROPERTY_METADATA_KEY, target) || [];

    existingProperties.push(propertyKey);
    Reflect.defineMetadata(
      MONGO_PROPERTY_METADATA_KEY,
      existingProperties,
      target,
    );
  };
}

/**
 * @description Defines a dynamic calculated property that is not defined inside the Table, it must be added to a query in order to be retrieved
 * @param propertyName that will be filled inside the dynamicProperty field
 * @returns
 */
export function dynamicProperty(propertyName: string): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const dynamicColumn = {
      propertyName: propertyName,
      functionName: propertyKey,
      dynamicColumnFn: target.constructor.prototype[propertyKey],
    };

    const existingColumns =
      Reflect.getMetadata(MONGO_DYNAMIC_PROPERTY_METADATA_KEY, target) || [];
    existingColumns.push(dynamicColumn);
    Reflect.defineMetadata(
      MONGO_DYNAMIC_PROPERTY_METADATA_KEY,
      existingColumns,
      target,
    );
  };
}

/**
 * @description Returns the propertys of the model, propertys must be decorated with the property decorator
 * @param target Model
 * @returns
 */
export function getCollectionProperties(target: typeof Collection): string[] {
  return (
    Reflect.getMetadata(MONGO_PROPERTY_METADATA_KEY, target.prototype) || []
  );
}

/**
 * @description Returns every dynamicProperty definition
 */
export function getMongoDynamicProperties(target: typeof Collection): {
  propertyName: string;
  functionName: string;
  dynamicPropertyFn: (...args: any[]) => any;
}[] {
  return Reflect.getMetadata(
    MONGO_DYNAMIC_PROPERTY_METADATA_KEY,
    target.prototype,
  );
}
