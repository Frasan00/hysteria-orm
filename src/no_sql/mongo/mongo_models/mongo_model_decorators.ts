import { MongoModel } from ".";

const COLUMN_METADATA_KEY = Symbol("columns");
const DYNAMIC_COLUMN_METADATA_KEY = Symbol("dynamicColumns");

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
export function getMongoModelColumns(target: typeof MongoModel): string[] {
  return Reflect.getMetadata(COLUMN_METADATA_KEY, target.prototype) || [];
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
