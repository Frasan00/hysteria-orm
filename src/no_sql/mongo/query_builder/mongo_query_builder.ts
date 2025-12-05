import type { MongoClientImport } from "../../../drivers/driver_types";
import { HysteriaError } from "../../../errors/hysteria_error";
import logger from "../../../utils/logger";
import { MongoDataSource } from "../mongo_data_source";
import { Collection } from "../mongo_models/mongo_collection";
import type {
  ModelKeyOrAny,
  ModelKeyOrAnySort,
  MongoCollectionKey,
} from "../mongo_models/mongo_collection_types";
import { serializeCollection, serializeCollections } from "../mongo_serializer";
import type {
  Collection as DriverCollection,
  OptionalUnlessRequiredId,
  Filter,
} from "mongodb";

export type FetchHooks = "beforeFetch" | "afterFetch";
type BinaryOperatorType =
  | "$eq"
  | "$ne"
  | "$gt"
  | "$gte"
  | "$lt"
  | "$lte"
  | "$in"
  | "$nin";
type BaseValues =
  | string
  | number
  | boolean
  | Date
  | Array<string | number | boolean | Date>;

export type OneOptions = {
  throwErrorOnNull?: boolean;
  ignoreHooks?: FetchHooks[];
};

export type ManyOptions = {
  ignoreHooks?: FetchHooks[];
};

export class MongoQueryBuilder<T extends Collection> {
  protected idObject: MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["filter"];
  protected selectObject?: Record<string, 1>;
  protected selectFields?: string[];
  protected whereObject: MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["filter"];
  protected sortObject?: MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["sort"];
  protected limitNumber?: number;
  protected offsetNumber?: number;
  protected mongoDataSource: MongoDataSource;
  protected collection: DriverCollection<T>;
  protected model: typeof Collection;
  protected logs: boolean;

  protected session?: ReturnType<MongoDataSource["startSession"]>;

  constructor(
    model: typeof Collection,
    mongoDataSource: MongoDataSource,
    _session?: ReturnType<MongoDataSource["startSession"]>,
    logs: boolean = false,
  ) {
    this.model = model;
    this.idObject = {};
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

    const queryPayload: MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["filter"] =
      {
        ...this.whereObject,
      };

    if (Object.keys(this.idObject).length) {
      queryPayload._id = this.idObject;
    }

    const result = await this.collection.findOne(queryPayload, {
      projection: this.selectObject,
      limit: 1,
      session: this.session,
    });

    const serializedModel = await serializeCollection(
      this.model,
      result,
      this.selectFields,
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
      throw new HysteriaError("MongoQueryBuilder::oneOrFail", "ROW_NOT_FOUND");
    }

    return result;
  }

  async many(options: ManyOptions = {}): Promise<T[]> {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }

    const queryPayload: MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["filter"] =
      {
        ...this.whereObject,
      };

    if (Object.keys(this.idObject).length) {
      queryPayload._id = this.idObject;
    }

    const result = await this.collection
      .find(queryPayload, {
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
    );

    return !options.ignoreHooks?.includes("afterFetch")
      ? ((await this.model.afterFetch(serializedModels)) as T[])
      : (serializedModels as T[]);
  }

  /**
   * @description Inserts a new document into the collection
   * @param options.returning - If true, the inserted document will be returned, else only the inserted id from mongodb will be returned
   */
  async insert<O extends ModelKeyOrAny<T>>(
    modelData: O,
    options: { ignoreHooks?: boolean; returning?: boolean } = {},
  ): Promise<O & { id: string }> {
    if (!options.ignoreHooks) {
      this.model.beforeInsert(modelData);
    }

    const result = await this.collection.insertOne(
      modelData as unknown as OptionalUnlessRequiredId<T>,
      {
        session: this.session,
      },
    );

    if (!options.returning) {
      return {
        id: result.insertedId.toString(),
      } as O & { id: string };
    }

    const insertedDocument = await this.collection.findOne({
      _id: result.insertedId,
    } as unknown as Filter<T>);

    return (await serializeCollection(
      this.model,
      insertedDocument,
      this.selectFields,
    )) as O & { id: string };
  }

  /**
   * @description Inserts multiple documents into the collection
   * @param modelData
   * @param options
   * @returns
   */
  async insertMany<O extends ModelKeyOrAny<T>>(
    modelData: O[],
    options: { ignoreHooks?: boolean; returning?: boolean } = {},
  ): Promise<(O & { id: string })[]> {
    if (!options.ignoreHooks) {
      this.model.beforeInsert(modelData);
    }

    const result = await this.collection.insertMany(
      modelData as unknown as OptionalUnlessRequiredId<T>[],
      {
        session: this.session,
      },
    );

    if (!options.returning) {
      return Object.values(result.insertedIds).map(
        (id) =>
          ({
            id: id.toString(),
          }) as O & { id: string },
      ) as (O & { id: string })[];
    }

    const insertedDocuments = await this.collection
      .find({
        _id: {
          $in: Object.values(result.insertedIds),
        },
      } as unknown as Filter<T>)
      .toArray();

    return (await serializeCollections(
      this.model,
      insertedDocuments,
      this.selectFields,
    )) as (O & { id: string })[];
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

    const result = await this.collection.updateMany(
      {
        _id: this.idObject,
        ...this.whereObject,
      },
      {
        $set: modelData,
        session: this.session,
      },
    );

    if (result.modifiedCount === 0) {
      return [];
    }

    const updatedDocuments = await this.collection
      .find(
        {
          _id: Object.keys(this.idObject).length ? this.idObject : undefined,
          ...this.whereObject,
        },
        { projection: this.selectFields },
      )
      .toArray();

    return await serializeCollections(
      this.model,
      updatedDocuments,
      this.selectFields,
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

    await this.collection.deleteMany(this.whereObject, {
      session: this.session,
    });
  }

  /**
   * @description Fetches the count of the query
   * @returns - The count of the query
   */
  async count(options: { ignoreHooks?: boolean } = {}): Promise<number> {
    if (!options.ignoreHooks) {
      this.model.beforeFetch(this);
    }

    return this.collection.countDocuments(this.whereObject, {
      session: this.session,
    });
  }

  /**
   * @description Only fetches the provided fields
   * @param fields - Fields to select
   */
  select(fields: MongoCollectionKey<T>[]): this;
  select(fields: string[]): this;
  select(fields: (MongoCollectionKey<T> | string)[]): this {
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
   */
  where(
    property: MongoCollectionKey<T>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  where(
    property: string,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  where(property: MongoCollectionKey<T> | string, value: BaseValues): this;
  where(
    property: MongoCollectionKey<T> | string,
    operatorOrValue: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: BinaryOperatorType = "$eq";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value !== undefined) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "$eq";
    }

    const mongo = require("mongodb");
    if (property === "id") {
      this.idObject = { $eq: new mongo.ObjectId(actualValue as string) };
      return this;
    }

    const condition = { [property as string]: { [operator]: actualValue } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
    } else {
      if (!this.whereObject.$and) {
        this.whereObject.$and = [];
      }
      this.whereObject.$and.push(condition);
    }

    return this;
  }

  /**
   * @description Adds a where clause to the query - alias for where
   */
  andWhere(
    property: MongoCollectionKey<T>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  andWhere(
    property: string,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  andWhere(property: MongoCollectionKey<T> | string, value: BaseValues): this;
  andWhere(
    property: MongoCollectionKey<T> | string,
    operatorOrValue: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: BinaryOperatorType = "$eq";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value !== undefined) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "$eq";
    }

    const mongo = require("mongodb");
    const condition = { [property as string]: { [operator]: actualValue } };
    if (property === "id") {
      this.idObject = { $eq: new mongo.ObjectId(actualValue as string) };
      return this;
    }

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
    } else {
      if (!this.whereObject.$and) {
        this.whereObject.$and = [];
      }
      this.whereObject.$and.push(condition);
    }

    return this;
  }

  /**
   * @description Adds an or where clause to the query
   */
  orWhere(
    property: MongoCollectionKey<T>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  orWhere(
    property: string,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  orWhere(property: MongoCollectionKey<T> | string, value: BaseValues): this;
  orWhere(
    property: MongoCollectionKey<T> | string,
    operatorOrValue: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: BinaryOperatorType = "$eq";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value !== undefined) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "$eq";
    }

    const mongo = require("mongodb");
    const condition = { [property as string]: { [operator]: actualValue } };
    if (property === "id") {
      this.idObject = { $eq: new mongo.ObjectId(actualValue as string) };
      return this;
    }

    if (!this.whereObject) {
      this.whereObject = { $or: [condition] };
    } else {
      if (!this.whereObject.$or) {
        this.whereObject.$or = [];
      }
      this.whereObject.$or.push(condition);
    }

    return this;
  }

  /**
   * @description Adds a where exists clause to the query
   */
  whereExists(property: MongoCollectionKey<T>): this;
  whereExists(property: string): this;
  whereExists(property: MongoCollectionKey<T> | string): this {
    const condition = { [property as string]: { $exists: true } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an and where exists clause to the query
   */
  andWhereExists(property: MongoCollectionKey<T>): this;
  andWhereExists(property: string): this;
  andWhereExists(property: MongoCollectionKey<T> | string): this {
    const condition = { [property as string]: { $exists: true } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an or where exists clause to the query
   */
  orWhereExists(property: MongoCollectionKey<T>): this;
  orWhereExists(property: string): this;
  orWhereExists(property: MongoCollectionKey<T> | string): this {
    const condition = { [property as string]: { $exists: true } };

    if (!this.whereObject) {
      this.whereObject = { $or: [condition] };
      return this;
    }

    if (!this.whereObject.$or) {
      this.whereObject.$or = [condition];
      return this;
    }

    this.whereObject.$or.push(condition);
    return this;
  }

  /**
   * @description Adds a where not exists clause to the query
   */
  whereNotExists(property: MongoCollectionKey<T>): this;
  whereNotExists(property: string): this;
  whereNotExists(property: MongoCollectionKey<T> | string): this {
    const condition = { [property as string]: { $exists: false } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an and where not exists clause to the query
   */
  andWhereNotExists(property: MongoCollectionKey<T>): this;
  andWhereNotExists(property: string): this;
  andWhereNotExists(property: MongoCollectionKey<T> | string): this {
    const condition = { [property as string]: { $exists: false } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an or where not exists clause to the query
   */
  orWhereNotExists(property: MongoCollectionKey<T>): this;
  orWhereNotExists(property: string): this;
  orWhereNotExists(property: MongoCollectionKey<T> | string): this {
    const condition = { [property as string]: { $exists: false } };

    if (!this.whereObject) {
      this.whereObject = { $or: [condition] };
      return this;
    }

    if (!this.whereObject.$or) {
      this.whereObject.$or = [condition];
      return this;
    }

    this.whereObject.$or.push(condition);
    return this;
  }

  /**
   * @description Adds a where not clause to the query
   */
  whereNot(property: MongoCollectionKey<T>, value: BaseValues): this;
  whereNot(property: string, value: BaseValues): this;
  whereNot(property: MongoCollectionKey<T> | string, value: BaseValues): this {
    const condition = { [property as string]: { $ne: value } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an and where not clause to the query
   */
  andWhereNot(property: MongoCollectionKey<T>, value: BaseValues): this;
  andWhereNot(property: string, value: BaseValues): this;
  andWhereNot(
    property: MongoCollectionKey<T> | string,
    value: BaseValues,
  ): this {
    const condition = { [property as string]: { $ne: value } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an or where not clause to the query
   */
  orWhereNot(property: MongoCollectionKey<T>, value: BaseValues): this;
  orWhereNot(property: string, value: BaseValues): this;
  orWhereNot(
    property: MongoCollectionKey<T> | string,
    value: BaseValues,
  ): this {
    const condition = { [property as string]: { $ne: value } };

    if (!this.whereObject) {
      this.whereObject = { $or: [condition] };
      return this;
    }

    if (!this.whereObject.$or) {
      this.whereObject.$or = [condition];
      return this;
    }

    this.whereObject.$or.push(condition);
    return this;
  }

  /**
   * @description Adds a where like clause to the query
   */
  whereLike(property: MongoCollectionKey<T>, value: string): this;
  whereLike(property: string, value: string): this;
  whereLike(property: MongoCollectionKey<T> | string, value: string): this {
    const condition = { [property as string]: { $regex: value } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an and where like clause to the query
   */
  andWhereLike(property: MongoCollectionKey<T>, value: string): this;
  andWhereLike(property: string, value: string): this;
  andWhereLike(property: MongoCollectionKey<T> | string, value: string): this {
    const condition = { [property as string]: { $regex: value } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an or where like clause to the query
   */
  orWhereLike(property: MongoCollectionKey<T>, value: string): this;
  orWhereLike(property: string, value: string): this;
  orWhereLike(property: MongoCollectionKey<T> | string, value: string): this {
    const condition = { [property as string]: { $regex: value } };

    if (!this.whereObject) {
      this.whereObject = { $or: [condition] };
      return this;
    }

    if (!this.whereObject.$or) {
      this.whereObject.$or = [condition];
      return this;
    }

    this.whereObject.$or.push(condition);
    return this;
  }

  /**
   * @description Adds a where not like clause to the query
   */
  whereNotLike(property: MongoCollectionKey<T>, value: string): this;
  whereNotLike(property: string, value: string): this;
  whereNotLike(property: MongoCollectionKey<T> | string, value: string): this {
    const condition = { [property as string]: { $not: { $regex: value } } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an and where not like clause to the query
   */
  andWhereNotLike(property: MongoCollectionKey<T>, value: string): this;
  andWhereNotLike(property: string, value: string): this;
  andWhereNotLike(
    property: MongoCollectionKey<T> | string,
    value: string,
  ): this {
    const condition = { [property as string]: { $not: { $regex: value } } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an or where not like clause to the query
   */
  orWhereNotLike(property: MongoCollectionKey<T>, value: string): this;
  orWhereNotLike(property: string, value: string): this;
  orWhereNotLike(
    property: MongoCollectionKey<T> | string,
    value: string,
  ): this {
    const condition = { [property as string]: { $not: { $regex: value } } };

    if (!this.whereObject) {
      this.whereObject = { $or: [condition] };
      return this;
    }

    if (!this.whereObject.$or) {
      this.whereObject.$or = [condition];
      return this;
    }

    this.whereObject.$or.push(condition);
    return this;
  }

  /**
   * @description Adds a where in clause to the query
   */
  whereIn(property: MongoCollectionKey<T>, values: BaseValues[]): this;
  whereIn(property: string, values: BaseValues[]): this;
  whereIn(
    property: MongoCollectionKey<T> | string,
    values: BaseValues[],
  ): this {
    const mongo = require("mongodb");
    if (property === "id") {
      const valuesObject = values.map(
        (value) => new mongo.ObjectId(value as string),
      );
      this.idObject = { $in: valuesObject };
      return this;
    }

    const condition = { [property as string]: { $in: values } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an and where in clause to the query
   */
  andWhereIn(property: MongoCollectionKey<T>, values: BaseValues[]): this;
  andWhereIn(property: string, values: BaseValues[]): this;
  andWhereIn(
    property: MongoCollectionKey<T> | string,
    values: BaseValues[],
  ): this {
    const mongo = require("mongodb");
    if (property === "id") {
      const valuesObject = values.map(
        (value) => new mongo.ObjectId(value as string),
      );
      this.idObject = { $in: valuesObject };
      return this;
    }

    const condition = { [property as string]: { $in: values } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an or where in clause to the query
   */
  orWhereIn(property: MongoCollectionKey<T>, values: BaseValues[]): this;
  orWhereIn(property: string, values: BaseValues[]): this;
  orWhereIn(
    property: MongoCollectionKey<T> | string,
    values: BaseValues[],
  ): this {
    const mongo = require("mongodb");
    if (property === "id") {
      const valuesObject = values.map(
        (value) => new mongo.ObjectId(value as string),
      );
      this.idObject = { $in: valuesObject };
      return this;
    }

    const condition = { [property as string]: { $in: values } };

    if (!this.whereObject) {
      this.whereObject = { $or: [condition] };
      return this;
    }

    if (!this.whereObject.$or) {
      this.whereObject.$or = [condition];
      return this;
    }

    this.whereObject.$or.push(condition);
    return this;
  }

  /**
   * @description Adds a where not in clause to the query
   */
  whereNotIn(property: MongoCollectionKey<T>, values: BaseValues[]): this;
  whereNotIn(property: string, values: BaseValues[]): this;
  whereNotIn(
    property: MongoCollectionKey<T> | string,
    values: BaseValues[],
  ): this {
    const mongo = require("mongodb");
    if (property === "id") {
      const valuesObject = values.map(
        (value) => new mongo.ObjectId(value as string),
      );
      this.idObject = { $nin: valuesObject };
      return this;
    }

    const condition = { [property as string]: { $nin: values } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an and where not in clause to the query
   */
  andWhereNotIn(property: MongoCollectionKey<T>, values: BaseValues[]): this;
  andWhereNotIn(property: string, values: BaseValues[]): this;
  andWhereNotIn(
    property: MongoCollectionKey<T> | string,
    values: BaseValues[],
  ): this {
    const mongo = require("mongodb");
    if (property === "id") {
      const valuesObject = values.map(
        (value) => new mongo.ObjectId(value as string),
      );
      this.idObject = { $nin: valuesObject };
      return this;
    }

    const condition = { [property as string]: { $nin: values } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an or where not in clause to the query
   */
  orWhereNotIn(property: MongoCollectionKey<T>, values: BaseValues[]): this;
  orWhereNotIn(property: string, values: BaseValues[]): this;
  orWhereNotIn(
    property: MongoCollectionKey<T> | string,
    values: BaseValues[],
  ): this {
    const mongo = require("mongodb");
    if (property === "id") {
      const valuesObject = values.map(
        (value) => new mongo.ObjectId(value as string),
      );
      this.idObject = { $nin: valuesObject };
      return this;
    }

    const condition = { [property as string]: { $nin: values } };

    if (!this.whereObject) {
      this.whereObject = { $or: [condition] };
      return this;
    }

    if (!this.whereObject.$or) {
      this.whereObject.$or = [condition];
      return this;
    }

    this.whereObject.$or.push(condition);
    return this;
  }

  /**
   * @description Adds a where null clause to the query
   */
  whereNull(property: MongoCollectionKey<T>): this;
  whereNull(property: string): this;
  whereNull(property: MongoCollectionKey<T> | string): this {
    if (property === "id") {
      logger.warn("Id cannot be null");
      return this;
    }

    const condition = { [property as string]: null };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an and where null clause to the query
   */
  andWhereNull(property: MongoCollectionKey<T>): this;
  andWhereNull(property: string): this;
  andWhereNull(property: MongoCollectionKey<T> | string): this {
    if (property === "id") {
      logger.warn("Id cannot be null");
      return this;
    }

    const condition = { [property as string]: null };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an or where null clause to the query
   */
  orWhereNull(property: MongoCollectionKey<T>): this;
  orWhereNull(property: string): this;
  orWhereNull(property: MongoCollectionKey<T> | string): this {
    if (property === "id") {
      logger.warn("Id cannot be null");
      return this;
    }

    const condition = { [property as string]: null };

    if (!this.whereObject) {
      this.whereObject = { $or: [condition] };
      return this;
    }

    if (!this.whereObject.$or) {
      this.whereObject.$or = [condition];
      return this;
    }

    this.whereObject.$or.push(condition);
    return this;
  }

  /**
   * @description Adds a where not null clause to the query
   */
  whereNotNull(property: MongoCollectionKey<T>): this;
  whereNotNull(property: string): this;
  whereNotNull(property: MongoCollectionKey<T> | string): this {
    if (property === "id") {
      logger.warn("Id cannot be null");
      return this;
    }

    const condition = { [property as string]: { $ne: null } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an and where not null clause to the query
   */
  andWhereNotNull(property: MongoCollectionKey<T>): this;
  andWhereNotNull(property: string): this;
  andWhereNotNull(property: MongoCollectionKey<T> | string): this {
    if (property === "id") {
      logger.warn("Id cannot be null");
      return this;
    }

    const condition = { [property as string]: { $ne: null } };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an or where not null clause to the query
   */
  orWhereNotNull(property: MongoCollectionKey<T>): this;
  orWhereNotNull(property: string): this;
  orWhereNotNull(property: MongoCollectionKey<T> | string): this {
    if (property === "id") {
      logger.warn("Id cannot be null");
      return this;
    }

    const condition = { [property as string]: { $ne: null } };

    if (!this.whereObject) {
      this.whereObject = { $or: [condition] };
      return this;
    }

    if (!this.whereObject.$or) {
      this.whereObject.$or = [condition];
      return this;
    }

    this.whereObject.$or.push(condition);
    return this;
  }

  /**
   * @description Adds a where between clause to the query
   */
  whereBetween(
    property: MongoCollectionKey<T>,
    values: [BaseValues, BaseValues],
  ): this;
  whereBetween(property: string, values: [BaseValues, BaseValues]): this;
  whereBetween(
    property: MongoCollectionKey<T> | string,
    values: [BaseValues, BaseValues],
  ): this {
    const mongo = require("mongodb");
    if (property === "id") {
      const valuesObject = values.map(
        (value) => new mongo.ObjectId(value as string),
      );
      this.idObject = { $nin: valuesObject };
      return this;
    }

    const condition = {
      [property as string]: { $gte: values[0], $lte: values[1] },
    };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an and where between clause to the query
   */
  andWhereBetween(
    property: MongoCollectionKey<T>,
    values: [BaseValues, BaseValues],
  ): this;
  andWhereBetween(property: string, values: [BaseValues, BaseValues]): this;
  andWhereBetween(
    property: MongoCollectionKey<T> | string,
    values: [BaseValues, BaseValues],
  ): this {
    const mongo = require("mongodb");
    if (property === "id") {
      const valuesObject = values.map(
        (value) => new mongo.ObjectId(value as string),
      );
      this.idObject = { $nin: valuesObject };
      return this;
    }

    const condition = {
      [property as string]: { $gte: values[0], $lte: values[1] },
    };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an or where between clause to the query
   */
  orWhereBetween(
    property: MongoCollectionKey<T>,
    values: [BaseValues, BaseValues],
  ): this;
  orWhereBetween(property: string, values: [BaseValues, BaseValues]): this;
  orWhereBetween(
    property: MongoCollectionKey<T> | string,
    values: [BaseValues, BaseValues],
  ): this {
    const mongo = require("mongodb");
    if (property === "id") {
      const valuesObject = values.map(
        (value) => new mongo.ObjectId(value as string),
      );
      this.idObject = { $nin: valuesObject };
      return this;
    }

    const condition = {
      [property as string]: { $gte: values[0], $lte: values[1] },
    };

    if (!this.whereObject) {
      this.whereObject = { $or: [condition] };
      return this;
    }

    if (!this.whereObject.$or) {
      this.whereObject.$or = [condition];
      return this;
    }

    this.whereObject.$or.push(condition);
    return this;
  }

  /**
   * @description Adds a where not between clause to the query
   */
  whereNotBetween(
    property: MongoCollectionKey<T>,
    values: [BaseValues, BaseValues],
  ): this;
  whereNotBetween(property: string, values: [BaseValues, BaseValues]): this;
  whereNotBetween(
    property: MongoCollectionKey<T> | string,
    values: [BaseValues, BaseValues],
  ): this {
    const mongo = require("mongodb");
    if (property === "id") {
      const valuesObject = values.map(
        (value) => new mongo.ObjectId(value as string),
      );
      this.idObject = { $nin: valuesObject };
      return this;
    }

    const condition = {
      [property as string]: { $lt: values[0], $gt: values[1] },
    };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an and where not between clause to the query
   */
  andWhereNotBetween(
    property: MongoCollectionKey<T>,
    values: [BaseValues, BaseValues],
  ): this;
  andWhereNotBetween(property: string, values: [BaseValues, BaseValues]): this;
  andWhereNotBetween(
    property: MongoCollectionKey<T> | string,
    values: [BaseValues, BaseValues],
  ): this {
    const mongo = require("mongodb");
    if (property === "id") {
      const valuesObject = values.map(
        (value) => new mongo.ObjectId(value as string),
      );
      this.idObject = { $nin: valuesObject };
      return this;
    }

    const condition = {
      [property as string]: { $lt: values[0], $gt: values[1] },
    };

    if (!this.whereObject) {
      this.whereObject = { $and: [condition] };
      return this;
    }

    if (!this.whereObject.$and) {
      this.whereObject.$and = [condition];
      return this;
    }

    this.whereObject.$and.push(condition);
    return this;
  }

  /**
   * @description Adds an or where not between clause to the query
   */
  orWhereNotBetween(
    property: MongoCollectionKey<T>,
    values: [BaseValues, BaseValues],
  ): this;
  orWhereNotBetween(property: string, values: [BaseValues, BaseValues]): this;
  orWhereNotBetween(
    property: MongoCollectionKey<T> | string,
    values: [BaseValues, BaseValues],
  ): this {
    const mongo = require("mongodb");
    if (property === "id") {
      const valuesObject = values.map(
        (value) => new mongo.ObjectId(value as string),
      );
      this.idObject = { $nin: valuesObject };
      return this;
    }

    const condition = {
      [property as string]: { $lt: values[0], $gt: values[1] },
    };

    if (!this.whereObject) {
      this.whereObject = { $or: [condition] };
      return this;
    }

    if (!this.whereObject.$or) {
      this.whereObject.$or = [condition];
      return this;
    }

    this.whereObject.$or.push(condition);
    return this;
  }

  /**
   * @description Gives the possibility to add a raw where clause using the mongodb.Filter type
   */
  whereRaw(
    whereObject: MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["filter"],
  ): this {
    this.whereObject = {
      ...this.whereObject,
      ...whereObject,
    };
    return this;
  }

  /**
   * @description Gives the possibility to add a raw where clause using the mongodb.Filter type
   */
  andRawWhere(
    whereObject: MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["filter"],
  ): this {
    this.whereObject = {
      ...this.whereObject,
      ...whereObject,
    };

    return this;
  }

  /**
   * @description Gives the possibility to add a raw where clause using the mongodb.Filter type
   */
  orRawWhere(
    whereObject: MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["filter"],
  ): this {
    if (!this.whereObject.$or) {
      this.whereObject.$or = [];
    }

    this.whereObject.$or.push(whereObject);
    return this;
  }

  /**
   * @description Adds a sort to the query for the id
   * @param sortBy - The sort criteria, which can be a number, string, object, or array of these types
   * @returns
   */
  sortById(sortBy: 1 | -1): this {
    this.sortObject = {
      _id: sortBy as MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["sort"],
    };
    return this;
  }

  /**
   * @description Adds a sort to the query, do not use this method if you want to sort by id use the sortById method
   * @param sortBy - The sort criteria, which can be a number, string, object, or array of these types
   * @returns The current instance for chaining
   */
  sort(sortBy: 1 | -1): this;
  sort(sortBy: MongoCollectionKey<T>): this;
  sort(sortBy: MongoCollectionKey<T>[]): this;
  sort(sortBy: string): this;
  sort(sortBy: string[]): this;
  sort(sortBy: ModelKeyOrAnySort<T>): this;
  sort(
    sortBy:
      | 1
      | -1
      | MongoCollectionKey<T>
      | MongoCollectionKey<T>[]
      | string
      | string[]
      | ModelKeyOrAnySort<T>,
  ): this {
    if (typeof sortBy === "number") {
      this.sortObject = {
        _id: sortBy as MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["sort"],
      };
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
        const key = Object.keys(
          sort,
        )[0] as keyof MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["sort"];
        const value = Object.values(
          sort,
        )[0] as MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["sort"];
        acc[key as string] = +value;
        return acc;
      }, {}) as MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["sort"];
      return this;
    }

    this.sortObject =
      sortBy as MongoClientImport["Collection"]["prototype"]["find"]["prototype"]["sort"];
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
}
