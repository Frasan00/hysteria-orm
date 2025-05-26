import type { DataSourceInput } from "./data_source/data_source_types";
import type {
  RedisFetchable,
  RedisStorable,
} from "./no_sql/redis/redis_data_source";
import type { ClientMigrator } from "./sql/migrations/migrator";

import { HysteriaError } from "./errors/hysteria_error";
import { MongoDataSource as mongo } from "./no_sql/mongo/mongo_data_source";
import { Collection } from "./no_sql/mongo/mongo_models/mongo_collection";
import {
  getCollectionProperties,
  property,
} from "./no_sql/mongo/mongo_models/mongo_collection_decorators";
import { RedisDataSource as redis } from "./no_sql/redis/redis_data_source";
import { Migration } from "./sql/migrations/migration";
import { defineMigrator } from "./sql/migrations/migrator";
import {
  belongsTo,
  column,
  getModelColumns,
  getPrimaryKey,
  getRelations,
  hasMany,
  hasOne,
  manyToMany,
} from "./sql/models/decorators/model_decorators";
import { Model } from "./sql/models/model";
import { createModelFactory } from "./sql/models/model_factory";
import { QueryBuilder } from "./sql/query_builder/query_builder";
import { SqlDataSource as sql } from "./sql/sql_data_source";
import logger from "./utils/logger";
import { withPerformance } from "./utils/performance";
import { generateULID } from "./utils/ulid";
import { generateKeyPair } from "./utils/encryption";
import { ModelQueryBuilder } from "./sql/models/model_query_builder/model_query_builder";
import type { RelationQueryBuilderType } from "./sql/models/model_query_builder/relation_query_builder/relation_query_builder_types";

export {
  // decorators
  belongsTo,
  ClientMigrator,
  Collection,
  column,
  // factory
  createModelFactory,
  // DataSource
  DataSourceInput,
  defineMigrator,
  // utils
  generateULID,
  getCollectionProperties,
  getModelColumns,
  getPrimaryKey,
  getRelations,
  hasMany,
  hasOne,
  // Errors
  HysteriaError,
  // logger
  logger,
  manyToMany,
  // migrations
  Migration,
  // sql
  Model,
  ModelQueryBuilder,
  RelationQueryBuilderType,
  // mongo
  mongo,
  property,
  QueryBuilder,
  // redis
  redis,
  RedisFetchable,
  RedisStorable,
  sql,
  withPerformance,
  generateKeyPair,
};

export default {
  // decorators
  belongsTo,
  Collection,
  column,
  property,
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
  sql,
  QueryBuilder,

  // mongo
  mongo,

  // redis
  redis,

  // factory
  createModelFactory,

  // Errors
  HysteriaError,
};
