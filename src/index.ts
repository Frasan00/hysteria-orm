import "reflect-metadata";
import { DataSourceInput } from "./data_source";
import { Migration } from "./sql/migrations/migration";
import { Model } from "./sql/models/model";
import {
  belongsTo,
  hasOne,
  hasMany,
  manyToMany,
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
import { Transaction } from "./sql/transactions/transaction";
import { User } from "../test/sql_models/User";
import { Address } from "../test/sql_models/Address";
import { Post } from "../test/sql_models/Post";
import { UserAddress } from "../test/sql_models/UserAddress";

(async () => {
  await SqlDataSource.connect({
    type: "postgres",
    database: "test",
    username: "root",
    password: "root",
    port: 5432,
    host: "localhost",
  });

  await User.query().delete();

  const users = await User.insertMany([
    {
      name: "John Doe",
      email: "test",
      signupSource: "web",
      isActive: true,
      json: { a: 1, b: 2 },
    },
    {
      name: "John Doe",
      email: "test",
      signupSource: "web",
      isActive: true,
      json: { a: 1, b: 2 },
    },
  ]);

  await User.query()
    .where("name", "John Doe")
    .update({
      json: { a: 2, b: 3 },
    });

  console.log(await User.query().many());

  await SqlDataSource.disconnect();
})();

export default {
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
  // sql
  Model,
  column,
  belongsTo,
  hasOne,
  hasMany,
  manyToMany,
  Relation,
  SqlDataSource,
  DataSourceInput,
  ModelQueryBuilder,
  StandaloneQueryBuilder,
  Migration,
  Transaction,
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
