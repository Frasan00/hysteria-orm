import "reflect-metadata";
import { Entity } from "../../../entity";
import { MongoDataSource } from "../mongo_data_source";
import { MongoQueryBuilder } from "../query_builder/mongo_query_builder";
import { property } from "./mongo_collection_decorators";
import {
  CollectionManager,
  MongoFindManyOptions,
  MongoFindOneOptions,
  MongoUnrestrictedFindManyOptions,
  UnrestrictedMongoFindOneOptions,
} from "./mongo_collection_manager";
import {
  BaseModelMethodOptions,
  getBaseCollectionName,
  ModelKeyOrAny,
} from "./mongo_collection_types";

const collectionMap = new Map<typeof Collection, string>();

export function getBaseCollectionInstance<T extends Collection>(): T {
  return { $additional: {} } as T;
}

export class Collection extends Entity {
  /**
   * @description The sql sqlInstance generated by SqlDataSource.connect
   */
  static mongoInstance: MongoDataSource;

  /**
   * @description Collection name for the model, if not set it will be the plural snake case of the model name given that is in PascalCase (es. User -> users)
   */
  static collectionName: string;

  /**
   * @description Static getter for collection;
   * @internal
   */
  static get collection(): string {
    if (!collectionMap.has(this)) {
      collectionMap.set(
        this,
        this.collectionName || getBaseCollectionName(this),
      );
    }

    return collectionMap.get(this)!;
  }

  /**
   * @description The id of the record, this will be used to interact with the _id field in the database, every model has an id by default
   */
  @property()
  declare id: string;

  /**
   * @description Gets the main query builder for the model
   * @param options - The options to get the model manager
   * @returns {MongoQueryBuilder<T>}
   */
  static query<T extends Collection>(
    this: new () => T | typeof Collection,
    options: BaseModelMethodOptions = {},
  ): MongoQueryBuilder<T> {
    const typeofModel = this as unknown as typeof Collection;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return modelManager.query();
  }

  /**
   * @description Finds records in the collection, to use for simple queries
   * @param this
   * @param options
   */
  static async find<T extends Collection>(
    this: new () => T | typeof Collection,
    options?: MongoFindManyOptions<T> & BaseModelMethodOptions,
  ): Promise<T[]>;
  static async find<T extends Collection>(
    this: new () => T | typeof Collection,
    options?: MongoUnrestrictedFindManyOptions<T> & BaseModelMethodOptions,
  ): Promise<T[]>;
  static async find<T extends Collection>(
    this: new () => T | typeof Collection,
    options?: (MongoUnrestrictedFindManyOptions<T> | MongoFindManyOptions<T>) &
      BaseModelMethodOptions,
  ): Promise<T[]> {
    const typeofModel = this as unknown as typeof Collection;
    const modelManager = typeofModel.dispatchModelManager<T>({
      session: options?.session,
      useConnection: options?.useConnection,
    });
    return await modelManager.find(options);
  }

  /**
   * @description Finds a record in the collection, to use for simple queries
   * @param this
   * @param options
   */
  static async findOne<T extends Collection>(
    this: new () => T | typeof Collection,
    options: MongoFindOneOptions<T> & BaseModelMethodOptions,
  ): Promise<T | null>;
  static async findOne<T extends Collection>(
    this: new () => T | typeof Collection,
    options: UnrestrictedMongoFindOneOptions<T> & BaseModelMethodOptions,
  ): Promise<T | null>;
  static async findOne<T extends Collection>(
    this: new () => T | typeof Collection,
    options: (UnrestrictedMongoFindOneOptions<T> | MongoFindOneOptions<T>) &
      BaseModelMethodOptions,
  ): Promise<T | null> {
    const typeofModel = this as unknown as typeof Collection;
    const modelManager = typeofModel.dispatchModelManager<T>({
      session: options?.session,
      useConnection: options?.useConnection,
    });
    return await modelManager.findOne(options);
  }

  /**
   * @description Finds a record in the collection, to use for simple queries
   * @param this
   * @param options
   * @throws {Error} - If the record could not be found
   * @returns {Promise<T>}
   */
  static async findOneOrFail<T extends Collection>(
    this: new () => T | typeof Collection,
    options: MongoFindOneOptions<T> & BaseModelMethodOptions,
  ): Promise<T>;
  static async findOneOrFail<T extends Collection>(
    this: new () => T | typeof Collection,
    options: UnrestrictedMongoFindOneOptions<T> & BaseModelMethodOptions,
  ): Promise<T>;
  static async findOneOrFail<T extends Collection>(
    this: new () => T | typeof Collection,
    options: (UnrestrictedMongoFindOneOptions<T> | MongoFindOneOptions<T>) &
      BaseModelMethodOptions,
  ): Promise<T> {
    const typeofModel = this as unknown as typeof Collection;
    const modelManager = typeofModel.dispatchModelManager<T>({
      session: options?.session,
      useConnection: options?.useConnection,
    });
    return await modelManager.findOneOrFail(options);
  }

  /**
   * @description Saves a new record to the collection
   * @param model
   * @param {Model} modelData - The data to be saved
   * @param {BaseModelMethodOptions} options - The options to get the model manager
   * @returns {Promise<T>}
   */
  static async insert<T extends Collection>(
    this: new () => T | typeof Collection,
    modelData: ModelKeyOrAny<T>,
    options: BaseModelMethodOptions = {},
  ): Promise<T> {
    const typeofModel = this as unknown as typeof Collection;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return await modelManager.insert(modelData);
  }

  /**
   * @description Saves multiple records to the collection
   * @param {Model} modelData - The data to be fetched
   * @param {BaseModelMethodOptions} options - The options to get the model manager
   * @returns {Promise<T>}
   */
  static async insertMany<T extends Collection>(
    this: new () => T | typeof Collection,
    modelData: ModelKeyOrAny<T>[],
    options: BaseModelMethodOptions = {},
  ): Promise<T[]> {
    const typeofModel = this as unknown as typeof Collection;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return await modelManager.insertMany(modelData);
  }

  /**
   * @description Updates a record in the collection using it's id
   * @param {Model} modelData - The data to be updated
   * @param {BaseModelMethodOptions} options - The options to get the model manager
   * @returns {Promise<T>} - The updated record refreshed from the database
   */
  static async updateRecord<T extends Collection>(
    this: new () => T | typeof Collection,
    model: T,
    options: BaseModelMethodOptions = {},
  ): Promise<T> {
    const typeofModel = this as unknown as typeof Collection;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    return await modelManager.updateRecord(model);
  }

  /**
   * @description Deletes a record in the collection using it's id
   * @param {BaseModelMethodOptions} options - The options to get the model manager
   * @returns {Promise<void>}
   * @throws {Error} - If the record could not be deleted
   */
  static async deleteRecord<T extends Collection>(
    this: new () => T | typeof Collection,
    model: T,
    options: BaseModelMethodOptions = {},
  ): Promise<void> {
    const typeofModel = this as unknown as typeof Collection;
    const modelManager = typeofModel.dispatchModelManager<T>(options);
    await modelManager.deleteRecord(model);
  }

  /**
   * @description Gets the main connection from the mongoInstance
   */
  private static establishConnection(): void {
    const mongo = MongoDataSource.getInstance();
    if (!mongo) {
      throw new Error(
        "mongo mongoInstance not initialized, did you defined it in MongoDataSource.connect static method?",
      );
    }

    this.mongoInstance = mongo;
  }

  /**
   * @description Gives the correct model manager with the correct connection based on the options provided
   * @param this
   * @param options - The options to get the model manager
   * @returns
   */
  private static dispatchModelManager<T extends Collection>(
    this: typeof Collection,
    options: BaseModelMethodOptions,
  ): CollectionManager<T> {
    if (options.useConnection) {
      return options.useConnection.getModelManager<T>(
        this,
        options.useConnection,
      );
    }

    if (options.session) {
      return this.mongoInstance.getModelManager<T>(
        this,
        this.mongoInstance,
        options.session,
      );
    }

    const typeofModel = this as unknown as typeof Collection;
    typeofModel.establishConnection();
    return typeofModel.mongoInstance.getModelManager<T>(
      typeofModel,
      typeofModel.mongoInstance,
    );
  }

  /**
   * @description Adds a beforeFetch clause to the model, adding the ability to modify the query before fetching the data
   * @param queryBuilder
   */
  static beforeFetch(queryBuilder: MongoQueryBuilder<any>): void {
    queryBuilder;
  }

  /**
   * @description Adds a beforeInsert clause to the model, adding the ability to modify the data after fetching the data
   * @param data
   * @returns {T}
   */
  static beforeInsert(data: any): void {
    return data;
  }

  /**
   * @description Adds a beforeUpdate clause to the model, adding the ability to modify the query before updating the data
   * @param data
   */
  static beforeUpdate(queryBuilder: MongoQueryBuilder<any>): void {
    queryBuilder;
  }

  /**
   * @description Adds a beforeDelete clause to the model, adding the ability to modify the query before deleting the data
   * @param data
   */
  static beforeDelete(queryBuilder: MongoQueryBuilder<any>): void {
    queryBuilder;
  }

  // JS Static methods

  /**
   * @description Adds a property to the model, adding the ability to modify the data after fetching the data
   * @javascript
   */
  static property(propertyName: string): void {
    property()(this.prototype, propertyName);
  }

  /**
   * @description Adds a afterFetch clause to the model, adding the ability to modify the data after fetching the data
   * @param data
   * @returns {T}
   */
  static async afterFetch(data: any[]): Promise<Collection[]> {
    return data;
  }
}
