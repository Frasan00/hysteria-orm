import { MongoModel } from "./mongo_model";

const MONGO_COLUMN_METADATA_KEY = Symbol("mongoColumns");
const DYNAMIC_COLUMN_METADATA_KEY = Symbol("dynamicColumns");

/**
 * @description Defines a column that will be used in the model
 * @returns
 */
export function mongoColumn(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const columns =
      Reflect.getMetadata(MONGO_COLUMN_METADATA_KEY, target) || [];
    columns.push(propertyKey);
    Reflect.defineMetadata(MONGO_COLUMN_METADATA_KEY, columns, target);
  };
}

/**
 * @description Returns the columns of the model, columns must be decorated with the column decorator
 * @param target Model
 * @returns
 */
export function getMongoModelColumns(target: typeof MongoModel): string[] {
  return Reflect.getMetadata(MONGO_COLUMN_METADATA_KEY, target.prototype) || [];
}

/**
 * @description Returns every dynamicColumn definition
 */
export function getMongoDynamicColumns(target: typeof MongoModel): {
  columnName: string;
  functionName: string;
  dynamicColumnFn: (...args: any[]) => any;
}[] {
  return Reflect.getMetadata(DYNAMIC_COLUMN_METADATA_KEY, target.prototype);
}
