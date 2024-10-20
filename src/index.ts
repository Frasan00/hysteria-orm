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
import { ModelDeleteQueryBuilder } from "./sql/query_builder/delete_query_builder";
import { ModelUpdateQueryBuilder } from "./sql/query_builder/update_query_builder";
import { RedisOptions } from "ioredis";
import {
  RedisDataSource as Redis,
  RedisGiveable,
  RedisStorable,
} from "./no_sql/redis/redis_data_source";
import { MongoDataSource } from "./no_sql/mongo/mongo_data_source";
import { MongoModel } from "./no_sql/mongo/mongo_models/mongo_model";
import { mongoColumn } from "./no_sql/mongo/mongo_models/mongo_model_decorators";
// import { User } from "../test/User";

// (async () => {
//   const sql = await SqlDataSource.connect();

//   await User.query()
//     .whereBuilder((builder) => {
//       builder.where("id", 1);
//       builder.orWhere("id", 2);
//       builder.andWhereBuilder((builder) => {
//         builder.where("id", 3);
//         builder.orWhere("id", 4);
//       });
//     })
//     .one();

//   await sql.closeConnection();
// })();

class User extends MongoModel {
  @mongoColumn()
  declare name: string;

  @mongoColumn()
  declare email: string;

  @dynamicColumn("test")
  getTest() {
    return "test";
  }
}

(async () => {
  const mongo = await MongoDataSource.connect(
    "mongodb://root:root@localhost:27017",
  );

  const user = await User.query().select(["email"]).many();
  console.log(user);

  await mongo.disconnect();
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
  MongoModel,
  mongoColumn,
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
  ModelDeleteQueryBuilder,
  ModelUpdateQueryBuilder,
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
  MongoModel,
  mongoColumn,
};
