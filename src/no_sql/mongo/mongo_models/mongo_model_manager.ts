import { MongoDataSource } from "../mongo_data_source";
import { MongoModel } from "./mongo_model";
import { serializeMongoModel } from "../mongo_serializer";
import { ModelKeyOrAny } from "./mongo_model_types";
import * as mongodb from "mongodb";

export class MongoModelManager<T extends MongoModel> {
  protected logs: boolean;
  protected model: typeof MongoModel;
  protected mongoClient: mongodb.MongoClient;
  protected mongoDataSource: MongoDataSource;
  protected collection: mongodb.Collection;

  constructor(
    mongoModel: typeof MongoModel,
    mongoDataSource: MongoDataSource,
    logs: boolean = false,
  ) {
    this.logs = logs;
    this.mongoDataSource = mongoDataSource;
    this.model = mongoModel;
    this.mongoClient = this.mongoDataSource.getCurrentConnection();
    this.collection = this.mongoClient.db().collection(this.model.collection);
  }

  // TODO: Implement the following methods
  async find(): Promise<T[]> {
    return [];
  }

  async findOne(): Promise<T | null> {
    return null;
  }

  async query() {}

  // Insert actual select methods
  async insert(modelData: ModelKeyOrAny<T>): Promise<T> {
    const result = await this.collection.insertOne(
      modelData as mongodb.OptionalId<mongodb.BSON.Document>,
    );
    const insertedId = result.insertedId;
    const insertedDocument = await this.collection.findOne({
      _id: insertedId,
    });

    return (await serializeMongoModel(this.model, insertedDocument)) as T;
  }

  async insertMany(modelData: ModelKeyOrAny<T>[]): Promise<T[]> {
    const result = await this.collection.insertMany(
      modelData as mongodb.OptionalId<mongodb.BSON.Document>[],
    );
    const insertedIds = result.insertedIds;
    const insertedDocuments = await this.collection
      .find({
        _id: { $in: Object.values(insertedIds) },
      })
      .toArray();

    return await Promise.all(
      insertedDocuments.map(async (document) => {
        return (await serializeMongoModel(this.model, document)) as T;
      }),
    );
  }
}
