import type { ClientMigrator } from "./sql/migrations/migrator";
import type {
  RedisFetchable,
  RedisStorable,
} from "./no_sql/redis/redis_data_source";
import type { DataSourceInput } from "./data_source/data_source_types";

import { HysteriaError } from "./errors/hysteria_error";
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
import logger from "./utils/logger";

export {
  // DataSource
  DataSourceInput,

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
  ClientMigrator,

  // sql
  Model,
  ModelQueryBuilder,
  SqlDataSource,
  QueryBuilder,

  // mongo
  MongoDataSource,

  // redis
  Redis,
  RedisFetchable,
  RedisStorable,

  // factory
  createModelFactory,

  // Errors
  HysteriaError,
};

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

  // Errors
  HysteriaError,
};
