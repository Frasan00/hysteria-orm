import type { ColumnType } from "./decorators/model_decorators_types";

type ModelConstructor = abstract new (...args: any) => any;

/**
 * Holds all column metadata caches keyed on Model class constructor.
 */
export class ModelColumnCache {
  static readonly columns = new WeakMap<ModelConstructor, ColumnType[]>();
  static readonly byName = new WeakMap<
    ModelConstructor,
    Map<string, ColumnType>
  >();
  static readonly byDatabaseName = new WeakMap<
    ModelConstructor,
    Map<string, ColumnType>
  >();
}
