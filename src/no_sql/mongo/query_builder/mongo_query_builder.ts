import { MongoDataSource } from "../mongo_data_source";
import { MongoModel } from "../mongo_models/mongo_model"
import selectMongoTemplate from "../resources/SELECT";

export type FetchHooks = "beforeFetch" | "afterFetch";

export type OneOptions = {
  throwErrorOnNull?: boolean;
  ignoreHooks?: FetchHooks[];
};

export type ManyOptions = {
  ignoreHooks?: FetchHooks[];
};

export class MongoQueryBuilder<T extends MongoModel> {
  protected selectQuery: string;
  protected joinQuery: string;
  protected relations: string[];
  protected dynamicColumns: string[];
  protected groupByQuery: string;
  protected orderByQuery: string;
  protected limitQuery: string;
  protected offsetQuery: string;
  protected selectTemplate: ReturnType<typeof selectMongoTemplate>;
  protected mongoDataSource: MongoDataSource;
  protected collection: string;
  protected model: typeof MongoModel;
  protected logs: boolean;

  protected constructor(
    model: typeof MongoModel,
    mongoDataSource: MongoDataSource,
    logs: boolean,
  ) {
    this.model = model;
    this.collection = model.collection;
    this.mongoDataSource = mongoDataSource;
    this.selectQuery = selectMongoTemplate(
      this.collection,
    ).selectAll;
    this.selectTemplate = selectMongoTemplate(
      this.collection,
    );
    this.joinQuery = "";
    this.relations = [];
    this.dynamicColumns = [];
    this.groupByQuery = "";
    this.orderByQuery = "";
    this.limitQuery = "";
    this.offsetQuery = "";
    this.logs = logs;
  }
}