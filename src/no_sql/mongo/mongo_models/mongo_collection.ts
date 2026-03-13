import { Entity } from "../../../entity";
import { property } from "./mongo_collection_decorators";

export function getBaseCollectionInstance<T extends Collection>(): T {
  return { $annotations: {} } as T;
}

export class Collection extends Entity {
  declare $annotations: Record<string, any>;

  /**
   * @description Used in order to override the collection name
   */
  static _collection: string;

  /**
   * @description Collection name getter
   */
  static get collection(): string {
    if (!this._collection) {
      throw new Error(
        `Collection name not set for ${this.name}. Use defineCollection() to create collections.`,
      );
    }
    return this._collection;
  }

  /**
   * @description The id of the record, maps to MongoDB _id
   */
  @property()
  declare id: string;

  /**
   * @description Adds a beforeFetch clause to the collection
   */
  static beforeFetch(queryBuilder: any): void {
    queryBuilder;
  }

  /**
   * @description Adds a beforeInsert clause to the collection
   */
  static beforeInsert(data: any): void {
    return data;
  }

  /**
   * @description Adds a beforeUpdate clause to the collection
   */
  static beforeUpdate(queryBuilder: any): void {
    queryBuilder;
  }

  /**
   * @description Adds a beforeDelete clause to the collection
   */
  static beforeDelete(queryBuilder: any): void {
    queryBuilder;
  }

  /**
   * @description Adds a afterFetch clause to the collection
   */
  static async afterFetch(data: any[]): Promise<Collection[]> {
    return data;
  }
}
