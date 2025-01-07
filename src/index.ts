import { RedisOptions } from "ioredis";
import { DataSourceInput } from "./data_source/data_source_types";
import { MongoDataSource } from "./no_sql/mongo/mongo_data_source";
import { Collection } from "./no_sql/mongo/mongo_models/mongo_collection";
import {
  dynamicProperty,
  getCollectionDynamicProperties,
  getCollectionProperties,
  property,
} from "./no_sql/mongo/mongo_models/mongo_collection_decorators";
import {
  RedisDataSource as Redis,
  RedisGiveable,
  RedisStorable,
} from "./no_sql/redis/redis_data_source";
import { Migration } from "./sql/migrations/migration";
import { Model } from "./sql/models/model";
import {
  belongsTo,
  column,
  dynamicColumn,
  getModelColumns,
  getPrimaryKey,
  getRelations,
  hasMany,
  hasOne,
  manyToMany,
} from "./sql/models/model_decorators";
import { Relation } from "./sql/models/relations/relation";
import { PaginatedData, PaginationMetadata } from "./sql/pagination";
import { ModelQueryBuilder } from "./sql/query_builder/query_builder";
import { SqlDataSource } from "./sql/sql_data_source";
import { StandaloneQueryBuilder } from "./sql/standalone_query_builder/standalone_sql_query_builder";
import { Transaction } from "./sql/transactions/transaction";
import { CaseConvention } from "./utils/case_utils";
import logger, { CustomLogger } from "./utils/logger";

class ILoveBox extends Model {}

console.log("ILoveBox", ILoveBox.table);

export default {
  // logger
  logger,
  // sql
  Model,
  column,
  belongsTo,
  hasOne,
  hasMany,
  manyToMany,
  Relation,
  SqlDataSource,
  Transaction,
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
  dynamicColumn,
};

export {
  // logger
  CustomLogger,
  logger,
  belongsTo,
  CaseConvention,
  Collection,
  column,
  DataSourceInput,
  dynamicProperty,
  getCollectionDynamicProperties,
  getCollectionProperties,
  getModelColumns,
  getPrimaryKey,
  getRelations,
  hasMany,
  hasOne,
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
