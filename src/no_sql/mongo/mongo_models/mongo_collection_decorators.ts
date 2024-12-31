import { Collection } from "./mongo_collection";

const MONGO_PROPERTY_METADATA_KEY = Symbol("mongoProperties");
const MONGO_DYNAMIC_PROPERTY_METADATA_KEY = Symbol("mongoDynamicProperties");

/**
 * @description Defines a property that will be used in the model
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
 * @description Defines a dynamic property that will be used in the model that is not part of the model schema
 */
export function dynamicProperty(propertyName: string): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const dynamicProperty = {
      propertyName,
      functionName: propertyKey,
      dynamicPropertyFn: target.constructor.prototype[propertyKey],
    };

    const existingDynamicProperties =
      Reflect.getMetadata(MONGO_DYNAMIC_PROPERTY_METADATA_KEY, target) || [];
    existingDynamicProperties.push(dynamicProperty);
    Reflect.defineMetadata(
      MONGO_DYNAMIC_PROPERTY_METADATA_KEY,
      existingDynamicProperties,
      target,
    );
  };
}

/**
 * @description Returns the properties of the model, properties must be decorated with the property decorator
 */
export function getCollectionProperties(target: typeof Collection): string[] {
  return (
    Reflect.getMetadata(MONGO_PROPERTY_METADATA_KEY, target.prototype) || []
  );
}

/**
 * @description Returns every dynamicProperty definition
 */
export function getCollectionDynamicProperties(target: typeof Collection): {
  propertyName: string;
  functionName: string | symbol;
  dynamicPropertyFn: (...args: any[]) => any;
}[] {
  return (
    Reflect.getMetadata(
      MONGO_DYNAMIC_PROPERTY_METADATA_KEY,
      target.prototype,
    ) || []
  );
}
