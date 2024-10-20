import { MongoDataSource } from "../mongo_data_source";
import { MongoModel } from "../mongo_models/mongo_model";
import * as mongodb from "mongodb";
import { ModelKeyOrAny } from "../mongo_models/mongo_model_types";
import { serializeMongoModel, serializeMongoModels } from "../mongo_serializer";
import { SelectableType } from "../../../sql/models/model_manager/model_manager_types";

export type FetchHooks = "beforeFetch" | "afterFetch";

export type OneOptions = {
  throwErrorOnNull?: boolean;
  ignoreHooks?: FetchHooks[];
};

export type ManyOptions = {
  ignoreHooks?: FetchHooks[];
};

export class MongoQueryBuilder<T extends MongoModel> {
  protected dynamicColumns: string[];
  protected selectFields?: string[];
  protected whereObject: mongodb.Filter<mongodb.BSON.Document>;
  protected groupByObject: object;
  protected orderByObject: object;
  protected limitObject: object;
  protected offsetObject: object;
  // protected selectTemplate: ReturnType<typeof selectMongoTemplate>;
  protected mongoDataSource: MongoDataSource;
  protected collection: mongodb.Collection;
  protected model: typeof MongoModel;
  protected logs: boolean;

  public constructor(
    model: typeof MongoModel,
    mongoDataSource: MongoDataSource,
    logs: boolean,
  ) {
    this.model = model;
    this.dynamicColumns = [];
    this.whereObject = {};
    this.groupByObject = {};
    this.orderByObject = {};
    this.limitObject = {};
    this.offsetObject = {};
    this.logs = logs;

    this.mongoDataSource = mongoDataSource;
    this.collection = this.mongoDataSource
      .getCurrentConnection()
      .db()
      .collection(this.model.collection);
  }

  public async one(
    options: OneOptions = { throwErrorOnNull: false },
  ): Promise<T | null> {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }

    const result = await this.collection.findOne(this.whereObject, {
      projection: this.selectFields,
    });
    const serializedModel = await serializeMongoModel(
      this.model,
      result,
      this.selectFields,
      this.dynamicColumns,
    );
    return !options.ignoreHooks?.includes("afterFetch")
      ? ((await this.model.afterFetch([serializedModel]))[0] as T)
      : (serializedModel as T);
  }

  public async many(options: ManyOptions = {}): Promise<T[]> {
    if (!options.ignoreHooks?.includes("beforeFetch")) {
      this.model.beforeFetch(this);
    }

    const result = await this.collection
      .find(this.whereObject, { projection: this.selectFields })
      .toArray();
    const serializedModels = await serializeMongoModels(
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
   * @description Only fetches the provided fields
   * @param fields - Fields to select
   */
  public select(fields: SelectableType<T>[]): this;
  public select(fields: string[]): this;
  public select(
    // a list of fields to select
    fields: (SelectableType<T> | string)[],
  ): this {
    this.selectFields = fields as string[];
    return this;
  }

  private convertIdToObjectId(searchObject: any): ModelKeyOrAny<T> {
    if (searchObject.id) {
      searchObject["_id"] = searchObject.id;
      delete searchObject.id;
    }

    return searchObject;
  }
}
