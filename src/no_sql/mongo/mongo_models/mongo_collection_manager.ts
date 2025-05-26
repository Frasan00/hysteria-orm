import * as mongodb from "mongodb";
import { MongoDataSource } from "../mongo_data_source";
import { serializeCollection } from "../mongo_serializer";
import {
  FetchHooks,
  MongoQueryBuilder,
} from "../query_builder/mongo_query_builder";
import { Collection } from "./mongo_collection";
import {
  MongoCollectionKey,
  ModelKeyOrAny,
  ModelKeyOrAnySort,
} from "./mongo_collection_types";
import { HysteriaError } from "../../../errors/hysteria_error";

export type MongoFindOneOptions<T extends Collection> = {
  ignoreHooks?: FetchHooks[];
  select?: MongoCollectionKey<T>[];
  where?: ModelKeyOrAny<T>;
};

export type UnrestrictedMongoFindOneOptions<T extends Collection> = {
  ignoreHooks?: FetchHooks[];
  select?: string[];
  where?: ModelKeyOrAny<T>;
};

export type MongoFindManyOptions<T extends Collection> =
  MongoFindOneOptions<T> & {
    sort?: ModelKeyOrAnySort<T>;
    limit?: number;
    offset?: number;
  };

export type MongoUnrestrictedFindManyOptions<T extends Collection> =
  UnrestrictedMongoFindOneOptions<T> & {
    sort?: Record<string, 1 | -1>;
    limit?: number;
    offset?: number;
  };

export class CollectionManager<T extends Collection> {
  protected logs: boolean;
  protected collection: typeof Collection;
  protected mongoClient: mongodb.MongoClient;
  protected mongoDataSource: MongoDataSource;
  protected collectionInstance: mongodb.Collection;
  protected session?: mongodb.ClientSession;

  constructor(
    _collection: typeof Collection,
    mongoDataSource: MongoDataSource,
    session?: mongodb.ClientSession,
    logs: boolean = false,
  ) {
    this.logs = logs;
    this.session = session;
    this.mongoDataSource = mongoDataSource;
    this.collection = Collection;
    this.mongoClient = this.mongoDataSource.getCurrentConnection();
    this.collectionInstance = this.mongoClient
      .db()
      .collection(this.collection.collection);
  }

  /**
   * @description Finds all records that match the input
   */
  async find(
    options?: MongoUnrestrictedFindManyOptions<T> | MongoFindManyOptions<T>,
  ): Promise<T[]> {
    const queryBuilder = this.query<T>();
    if (!options) {
      return queryBuilder.many();
    }

    if (options.select) {
      queryBuilder.select(options.select as string[]);
    }

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        queryBuilder.where(key, value);
      });
    }

    if (options.sort) {
      queryBuilder.sort(options.sort);
    }

    if (options.limit) {
      queryBuilder.limit(options.limit);
    }

    if (options.offset) {
      queryBuilder.offset(options.offset);
    }

    return queryBuilder.many({ ignoreHooks: options.ignoreHooks });
  }

  /**
   * @description Finds the first record that matches the input
   */
  async findOne(
    options: UnrestrictedMongoFindOneOptions<T> | MongoFindOneOptions<T>,
  ): Promise<T | null> {
    const queryBuilder = this.query<T>();
    if (!options) {
      return queryBuilder.oneOrFail();
    }

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        queryBuilder.where(key, value);
      });
    }

    return queryBuilder.one({ ignoreHooks: options.ignoreHooks });
  }

  /**
   * @description Finds the first record that matches the input or throws an error
   */
  async findOneOrFail(
    options: (UnrestrictedMongoFindOneOptions<T> | MongoFindOneOptions<T>) & {
      customError?: Error;
    },
  ): Promise<T> {
    const queryBuilder = this.query<T>();
    if (!options) {
      return queryBuilder.oneOrFail();
    }

    if (options.select) {
      queryBuilder.select(options.select as string[]);
    }

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        queryBuilder.where(key, value);
      });
    }

    const result = await queryBuilder.one({ ignoreHooks: options.ignoreHooks });
    if (result === null) {
      if (options.customError) {
        throw options.customError;
      }

      throw new HysteriaError(
        "CollectionManager::findOneOrFail No record found",
        "ROW_NOT_FOUND",
      );
    }

    return result;
  }

  /**
   * @description Starts a query builder chain
   */
  query<T extends Collection>() {
    return new MongoQueryBuilder<T>(
      this.collection,
      this.mongoDataSource,
      this.session,
      this.logs,
    );
  }

  /**
   * @description Finds a record by its primary key
   */
  async insert(
    modelData: ModelKeyOrAny<T>,
    options: { ignoreHooks?: boolean } = {},
  ): Promise<T> {
    if (!options.ignoreHooks) {
      this.collection.beforeInsert(modelData);
    }

    const result = await this.collectionInstance.insertOne(
      modelData as mongodb.OptionalId<mongodb.BSON.Document>,
    );
    const insertedId = result.insertedId;
    const record = await this.collectionInstance.findOne(
      {
        _id: insertedId,
      },
      { session: this.session },
    );

    return (await serializeCollection(this.collection, record)) as T;
  }

  /**
   * @description Creates multiple records
   */
  async insertMany(
    modelData: ModelKeyOrAny<T>[],
    options: { ignoreHooks?: boolean } = {},
  ): Promise<T[]> {
    if (!options.ignoreHooks) {
      modelData.forEach((data) => {
        this.collection.beforeInsert(data);
      });
    }

    const result = await this.collectionInstance.insertMany(
      modelData as mongodb.OptionalId<mongodb.BSON.Document>[],
    );
    const insertedIds = result.insertedIds;
    const insertedDocuments = await this.collectionInstance
      .find(
        {
          _id: { $in: Object.values(insertedIds) },
        },
        { session: this.session },
      )
      .toArray();

    return await Promise.all(
      insertedDocuments.map(async (document) => {
        return (await serializeCollection(this.collection, document)) as T;
      }),
    );
  }

  /**
   * @description Updates a record
   */
  async updateRecord(modelData: T): Promise<T> {
    const id = modelData.id;
    if (!id) {
      throw new HysteriaError(
        "CollectionManager::updateRecord",
        "ROW_NOT_FOUND",
      );
    }

    const result = await this.collectionInstance.updateOne(
      { _id: new mongodb.ObjectId(id) },
      { $set: modelData },
    );

    if (result.modifiedCount === 0) {
      throw new HysteriaError(
        "CollectionManager::updateRecord",
        "ROW_NOT_FOUND",
      );
    }

    const updatedDocument = await this.collectionInstance.findOne(
      {
        _id: new mongodb.ObjectId(id),
      },
      { session: this.session },
    );

    return (await serializeCollection(this.collection, updatedDocument)) as T;
  }

  /**
   * @description Deletes a record
   */
  async deleteRecord(model: T): Promise<T> {
    const id = model.id;
    if (!id) {
      throw new HysteriaError(
        "CollectionManager::deleteRecord",
        "ROW_NOT_FOUND",
      );
    }

    await this.collectionInstance.deleteOne(
      {
        _id: new mongodb.ObjectId(id),
      },
      { session: this.session },
    );
    return model;
  }
}
