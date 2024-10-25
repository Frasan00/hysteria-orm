import "reflect-metadata";
import { DataSourceInput } from "./data_source";
import { Migration } from "./sql/migrations/migration";
import { Model } from "./sql/models/model";
import {
  belongsTo,
  hasOne,
  hasMany,
  column,
  getRelations,
  getModelColumns,
  dynamicColumn,
} from "./sql/models/model_decorators";
import { Relation } from "./sql/models/relations/relation";
import { ModelQueryBuilder } from "./sql/query_builder/query_builder";
import { SqlDataSource } from "./sql/sql_data_source";
import { getPrimaryKey } from "./sql/models/model_decorators";
import { CaseConvention } from "./utils/case_utils";
import { PaginatedData, PaginationMetadata } from "./sql/pagination";
import { RedisOptions } from "ioredis";
import {
  RedisDataSource as Redis,
  RedisGiveable,
  RedisStorable,
} from "./no_sql/redis/redis_data_source";
import { MongoDataSource } from "./no_sql/mongo/mongo_data_source";
import { Collection } from "./no_sql/mongo/mongo_models/mongo_collection";
import { StandaloneQueryBuilder } from "./sql/standalone_query_builder/standalone_sql_query_builder";
import {
  property,
  dynamicProperty,
  getMongoDynamicProperties,
  getCollectionProperties,
} from "./no_sql/mongo/mongo_models/mongo_collection_decorators";
import { User } from "../test/User";

(async () => {
  await SqlDataSource.connect();
  await User.insert({
    name: "test",
    email: "test",
    signupSource: "test",
    isActive: true,
  });

  console.log(await User.all());
  await SqlDataSource.disconnect();
})();

export default {
  // sql
  Model,
  column,
  belongsTo,
  hasOne,
  hasMany,
  Relation,
  SqlDataSource: SqlDataSource,
  Migration,
  getRelations,
  getModelColumns,
  getPrimaryKey,

  // redis
  Redis,

  // mongo
  MongoDataSource,
  Collection,
  property,
  dynamicColumn,
};

export {
  // sql
  Model,
  column,
  belongsTo,
  hasOne,
  hasMany,
  Relation,
  SqlDataSource,
  DataSourceInput,
  ModelQueryBuilder,
  StandaloneQueryBuilder,
  Migration,
  CaseConvention,
  PaginatedData,
  PaginationMetadata,
  getRelations,
  getModelColumns,
  getPrimaryKey,

  // redis
  Redis,
  RedisGiveable,
  RedisStorable,
  RedisOptions,

  // mongo
  MongoDataSource,
  Collection,
  property,
  dynamicProperty,
  getMongoDynamicProperties,
  getCollectionProperties,
};
