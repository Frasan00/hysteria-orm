import { MongoDataSource } from "./no_sql/mongo/mongo_data_source";
import { Collection } from "./no_sql/mongo/mongo_models/mongo_collection";
import {
  getCollectionProperties,
  property,
} from "./no_sql/mongo/mongo_models/mongo_collection_decorators";
import { RedisDataSource as Redis } from "./no_sql/redis/redis_data_source";
import { Migration } from "./sql/migrations/migration";
import { defineMigrator } from "./sql/migrations/migrator";
import { ModelQueryBuilder } from "./sql/model_query_builder/model_query_builder";
import { Model } from "./sql/models/model";
import {
  belongsTo,
  column,
  dateColumn,
  getModelColumns,
  getPrimaryKey,
  getRelations,
  hasMany,
  hasOne,
  manyToMany,
} from "./sql/models/model_decorators";
import { createModelFactory } from "./sql/models/model_factory";
import { QueryBuilder } from "./sql/query_builder/query_builder";
import { SqlDataSource } from "./sql/sql_data_source";
import { UserWithUuid } from "../test/sql/test_models/uuid/user_uuid";
import logger from "./utils/logger";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  await SqlDataSource.connect({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "root",
    password: "root",
    database: "test",
    logs: true,
  });
  const users = await UserWithUuid.query()
    .where("name", "1")
    .orWhere("name", "2")
    .whereBuilder((qb) => {
      qb.where("name", "1")
        .orWhere("name", "2")
        .orWhereSubQuery("id", "IN", (qb) => {
          qb.select("id").from("users").where("name", "1");
        });
    })
    .toQuery();
  console.log(users);
  await SqlDataSource.disconnect();
})();

export default {
  // decorators
  belongsTo,
  Collection,
  column,
  property,
  dateColumn,
  hasMany,
  hasOne,
  manyToMany,
  // logger
  logger,

  // utils
  getCollectionProperties,
  getModelColumns,
  getPrimaryKey,
  getRelations,

  // migrations
  Migration,
  defineMigrator,

  // sql
  Model,
  ModelQueryBuilder,
  SqlDataSource,
  QueryBuilder,

  // mongo
  MongoDataSource,

  // redis
  Redis,

  // factory
  createModelFactory,
};
