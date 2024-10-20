import { MongoDataSource } from "../mongo_data_source";
import { Collection } from "../mongo_models/mongo_collection";
import * as mongodb from "mongodb";
import {
  ModelKeyOrAny,
  ModelKeyOrAnySort,
} from "../mongo_models/mongo_collection_types";
import { serializeCollection, serializeCollections } from "../mongo_serializer";
import {
  DynamicColumnType,
  SelectableType,
} from "../../../sql/models/model_manager/model_manager_types";

export type FetchHooks = "beforeFetch" | "afterFetch";

export type OneOptions = {
  throwErrorOnNull?: boolean;
  ignoreHooks?: FetchHooks[];
};

export type ManyOptions = {
  ignoreHooks?: FetchHooks[];
};

export class MongoQueryBuilder<T extends Collection> {
  protected dynamicColumns: string[];
  protected selectObject?: Record<string, 1>;
  protected selectFields?: string[];
  protected whereObject: mongodb.Filter<mongodb.BSON.Document>;
  protected sortObject?: mongodb.Sort;
  protected limitNumber?: number;
  protected offsetNumber?: number;
  protected mongoDataSource: MongoDataSource;
  protected collection: mongodb.Collection;
  protected model: typeof Collection;
  protected logs: boolean;

  protected session?: mongodb.ClientSession;

  public constructor(
    model: typeof Collection,
    mongoDataSource: MongoDataSource,
    session?: mongodb.ClientSession,
    logs: boolean = false,
  ) {
    this.model = model;
    this.dynamicColumns = [];
    this.whereObject = {};
    this.logs = logs;
    this.session;

    this.mongoDataSource = mongoDataSource;
    this.collection = this.mongoDataSource
      .getCurrentConnection()
      .db()
      .collection(this.model.collection);
  }

  async one(
    options: OneOptions = { throwErrorOnNull: false },
  ): Promise<T | null> {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }

    const result = await this.collection.findOne(this.whereObject, {
      projection: this.selectObject,
      limit: 1,
      session: this.session,
    });

    const serializedModel = await serializeCollection(
      this.model,
      result,
      this.selectFields,
      this.dynamicColumns,
    );

    return !options.ignoreHooks?.includes("afterFetch")
      ? ((await this.model.afterFetch([serializedModel]))[0] as T)
      : (serializedModel as T);
  }

  async oneOrFail(
    options: OneOptions = { throwErrorOnNull: true },
  ): Promise<T> {
    const result = await this.one(options);
    if (!result) {
      throw new Error("ROW_NOT_FOUND");
    }

    return result;
  }

  async many(options: ManyOptions = {}): Promise<T[]> {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }

    const result = await this.collection
      .find(this.whereObject, {
        projection: this.selectFields,
        sort: this.sortObject,
        limit: this.limitNumber,
        skip: this.offsetNumber,
        session: this.session,
      })
      .toArray();

    const serializedModels = await serializeCollections(
      this.model,
      result,
      this.selectFields,
      this.dynamicColumns,
    );

    return !options.ignoreHooks?.includes("afterFetch")
      ? ((await this.model.afterFetch(serializedModels)) as T[])
      : (serializedModels as T[]);
  }

  /**
   * @Massive Updates all the documents that match the query
   * @param modelData
   * @returns
   */
  async update(
    modelData: ModelKeyOrAny<T>,
    options: { ignoreHooks?: boolean } = {},
  ): Promise<T[]> {
    if (!options.ignoreHooks) {
      this.model.beforeUpdate(this);
    }

    const result = await this.collection.updateMany(this.whereObject, {
      $set: modelData,
    });

    if (result.modifiedCount === 0) {
      return [];
    }

    const updatedDocuments = await this.collection
      .find(this.whereObject, { projection: this.selectFields })
      .toArray();

    return await serializeCollections(
      this.model,
      updatedDocuments,
      this.selectFields,
      this.dynamicColumns,
    );
  }

  /**
   * @Massive Deletes all the documents that match the query
   * @returns
   */
  async delete(options: { ignoreHooks?: boolean } = {}): Promise<void> {
    if (!options.ignoreHooks) {
      this.model.beforeDelete(this);
    }

    await this.collection.deleteMany(this.whereObject);
  }

  /**
   * @description Fetches the count of the query
   * @returns - The count of the query
   */
  async count(options: { ignoreHooks?: boolean } = {}): Promise<number> {
    if (!options.ignoreHooks) {
      this.model.beforeFetch(this);
    }

    return this.collection.countDocuments(this.whereObject);
  }

  addDynamicColumn(dynamicColumns: DynamicColumnType<T>[]): this {
    this.dynamicColumns = dynamicColumns as string[];
    return this;
  }

  /**
   * @description Only fetches the provided fields
   * @param fields - Fields to select
   */
  select(fields: SelectableType<T>[]): this;
  select(fields: string[]): this;
  select(fields: (SelectableType<T> | string)[]): this {
    this.selectFields = fields as string[];
    this.selectObject = fields.reduce(
      (acc, field) => {
        acc[field as string] = 1;
        return acc;
      },
      {} as Record<string, 1>,
    );
    return this;
  }

  /**
   * @description Adds a where clause to the query
   * @param whereObject - The where clause
   */
  where(whereObject: ModelKeyOrAny<T>): this {
    const _id = whereObject.id
      ? new mongodb.ObjectId(whereObject.id)
      : undefined;
    delete whereObject.id;
    const andCondition = Object.keys(whereObject).map((key) => {
      return { [key]: whereObject[key] };
    });

    this.whereObject = {
      _id: _id,
      $and: [...(this.whereObject.$and || []), ...andCondition],
    };

    this.parseWhereCondition(!!_id);
    return this;
  }

  /**
   * @description Adds a where clause to the query - alias for where
   * @param whereObject - The where clause
   */
  andWhere(whereObject: ModelKeyOrAny<T>): this {
    const _id = whereObject.id
      ? new mongodb.ObjectId(whereObject.id)
      : undefined;
    delete whereObject.id;
    const andCondition = Object.keys(whereObject).map((key) => {
      return { [key]: whereObject[key] };
    });

    this.whereObject = {
      _id: _id,
      $and: [...(this.whereObject.$and || []), ...andCondition],
    };

    this.parseWhereCondition(!!_id);
    return this;
  }

  /**
   * @description Adds an or where clause to the query
   * @param whereObject - The where clause
   * @returns
   */
  orWhere(whereObject: ModelKeyOrAny<T>): this {
    if (!this.whereObject) {
      return this.where(whereObject);
    }

    const _id = whereObject.id
      ? new mongodb.ObjectId(whereObject.id)
      : undefined;
    delete whereObject.id;
    const orCondition = Object.keys(whereObject).map((key) => {
      return { [key]: whereObject[key] };
    });

    this.whereObject = {
      _id: _id,
      $or: [...(this.whereObject.$or || []), ...orCondition],
    };

    this.parseWhereCondition(!!_id);
    return this;
  }

  /**
   * @description Adds a sort to the query
   * @param sortBy - The sort criteria, which can be a number, string, object, or array of these types
   * @returns The current instance for chaining
   */
  sort(sortBy: 1 | -1): this;
  sort(sortBy: SelectableType<T>): this;
  sort(sortBy: SelectableType<T>[]): this;
  sort(sortBy: string): this;
  sort(sortBy: string[]): this;
  sort(sortBy: ModelKeyOrAnySort<T>): this;
  sort(
    sortBy:
      | 1
      | -1
      | SelectableType<T>
      | SelectableType<T>[]
      | string
      | string[]
      | ModelKeyOrAnySort<T>,
  ): this {
    if (typeof sortBy === "number") {
      this.sortObject = { _id: sortBy as mongodb.SortDirection };
      return this;
    }

    if (typeof sortBy === "string") {
      this.sortObject = { [sortBy]: 1 };
      return this;
    }

    if (Array.isArray(sortBy)) {
      this.sortObject = sortBy.reduce((acc: Record<string, number>, sort) => {
        if (typeof sort === "string") {
          acc[sort] = 1;
          return acc;
        }
        const key = Object.keys(sort)[0] as keyof mongodb.Sort;
        const value = Object.values(sort)[0] as mongodb.SortDirection;
        acc[key] = +value;
        return acc;
      }, {}) as mongodb.Sort;
      return this;
    }

    this.sortObject = sortBy as mongodb.Sort;
    return this;
  }

  /**
   * @description Adds a limit to the query
   * @param limit - The limit to set
   * @returns
   */
  limit(limit: number): this {
    this.limitNumber = limit;
    return this;
  }

  /**
   * @description Adds an offset to the query
   * @param offset - The offset to set
   * @returns
   */
  offset(offset: number): this {
    this.offsetNumber = offset;
    return this;
  }

  private parseWhereCondition(containsId: boolean = false) {
    if (this.whereObject.$or && !this.whereObject.$or.length) {
      delete this.whereObject.$or;
    }

    if (this.whereObject.$and && !this.whereObject.$and.length) {
      delete this.whereObject.$and;
    }

    if (containsId) {
      return;
    }

    delete this.whereObject._id;
  }
}
