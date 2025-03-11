import type { RedisOptions } from "ioredis";
import type { DataSourceInput } from "./data_source/data_source_types";
import type { HysteriaError } from "./errors/hysteria_error";
import type {
  RedisGiveable,
  RedisStorable,
} from "./no_sql/redis/redis_data_source";
import type { Relation } from "./sql/models/relations/relation";
import type { PaginatedData, PaginationMetadata } from "./sql/pagination";
import type { Transaction } from "./sql/transactions/transaction";
import type { CaseConvention } from "./utils/case_utils";

import { MongoDataSource } from "./no_sql/mongo/mongo_data_source";
import { Collection } from "./no_sql/mongo/mongo_models/mongo_collection";
import {
  getCollectionProperties,
  property,
} from "./no_sql/mongo/mongo_models/mongo_collection_decorators";
import { RedisDataSource as Redis } from "./no_sql/redis/redis_data_source";
import { Migration } from "./sql/migrations/migration";
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
import { SqlDataSource } from "./sql/sql_data_source";
import { StandaloneQueryBuilder } from "./sql/standalone_query_builder/standalone_sql_query_builder";
import logger, { CustomLogger } from "./utils/logger";
import { ModelQueryBuilder } from "./sql/model_query_builder/model_query_builder";

export default {
  // logger
  logger,
  // sql
  Model,
  column,
  dateColumn,
  belongsTo,
  hasOne,
  hasMany,
  manyToMany,
  SqlDataSource,
  Migration,
  StandaloneQueryBuilder,
  getRelations,
  getModelColumns,
  getPrimaryKey,

  // redis
  Redis,

  // mongo
  MongoDataSource,
  Collection,
  property,
};

export {
  belongsTo,
  CaseConvention,
  Collection,
  column,
  dateColumn,
  // logger
  CustomLogger,
  DataSourceInput,
  getCollectionProperties,
  getModelColumns,
  getPrimaryKey,
  getRelations,
  hasMany,
  hasOne,
  // errors
  HysteriaError,
  logger,
  manyToMany,
  Migration,
  // sql
  Model,
  ModelQueryBuilder,
  // mongo
  MongoDataSource,
  PaginatedData,
  PaginationMetadata,
  property,
  // redis
  Redis,
  RedisGiveable,
  RedisOptions,
  RedisStorable,
  Relation,
  SqlDataSource,
  StandaloneQueryBuilder,
  Transaction,
};
