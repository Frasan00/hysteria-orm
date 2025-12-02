import { Reflect } from "../../../utils/reflect_metadata";
import { Collection } from "./mongo_collection";

const MONGO_PROPERTY_METADATA_KEY = Symbol("mongoProperties");

/**
 * @description Defines a property that will be used in the model
 */
export function property(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const existingProperties =
      Reflect.getMetadata<(string | symbol)[]>(
        MONGO_PROPERTY_METADATA_KEY,
        target,
      ) || [];

    existingProperties.push(propertyKey);
    Reflect.defineMetadata(
      MONGO_PROPERTY_METADATA_KEY,
      existingProperties,
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
