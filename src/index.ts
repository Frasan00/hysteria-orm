import { MongoDataSource } from "./no_sql/mongo/mongo_data_source";
import { Collection } from "./no_sql/mongo/mongo_models/mongo_collection";
import {
  getCollectionProperties,
  property,
} from "./no_sql/mongo/mongo_models/mongo_collection_decorators";
import { RedisDataSource as Redis } from "./no_sql/redis/redis_data_source";
import { Migration } from "./sql/migrations/migration";
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
import { SqlDataSource } from "./sql/sql_data_source";
import { StandaloneQueryBuilder } from "./sql/standalone_query_builder/standalone_sql_query_builder";
import logger from "./utils/logger";

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

  // sql
  Model,
  ModelQueryBuilder,

  // mongo
  MongoDataSource,

  // redis
  Redis,

  // sql
  SqlDataSource,
  StandaloneQueryBuilder,

  // factory
  createModelFactory,
};
