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
import { UserAddress } from "../test/sql_models/UserAddress";

(async () => {
  await SqlDataSource.connect({
    type: "postgres",
    database: "test",
    username: "root",
    password: "root",
    host: "localhost",
  });

  // await Address.query().delete();
  // await User.query().delete();
  // const user = await User.insert({
  //   name: "test",
  //   email: "test",
  //   signupSource: "test",
  //   isActive: true,
  // });

  // const address = await Address.insert({
  //   street: "test",
  //   city: "test",
  //   state: "test",
  // });

  // const address2 = await Address.insert({
  //   street: "test2",
  //   city: "test2",
  //   state: "test2",
  // });

  // await UserAddress.insertMany([
  //   {
  //     userId: user?.id as number,
  //     addressId: address?.id as number,
  //   },
  //   {
  //     userId: user?.id as number,
  //     addressId: address2?.id as number,
  //   },
  // ]);

  console.log(
    await User.query()
      .where("id", 2020)
      .with("addresses", Address, (query) => query.limit(1))
      .first(),
  );
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
