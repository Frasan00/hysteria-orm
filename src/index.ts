import "reflect-metadata";
import { DataSourceInput } from "./datasource";
import { Migration } from "./sql/migrations/migration";
import { Model } from "./sql/models/model";
import {
  belongsTo,
  hasOne,
  hasMany,
  column,
  getRelations,
  getModelColumns,
} from "./sql/models/model_decorators";
import { Relation } from "./sql/models/relations/relation";
import { ModelQueryBuilder } from "./sql/query_builder/query_builder";
import { SqlDataSource } from "./sql/sql_data_source";
import { getPrimaryKey } from "./sql/models/model_decorators";
import { CaseConvention } from "./case_utils";
import { PaginatedData, PaginationMetadata } from "./sql/pagination";
import { ModelDeleteQueryBuilder } from "./sql/query_builder/delete_query_builder";
import { ModelUpdateQueryBuilder } from "./sql/query_builder/update_query_builder";
import { RedisOptions } from "ioredis";
import {
  Redis_data_source as Redis,
  RedisGiveable,
  RedisStorable,
} from "./no_sql/redis/redis_data_source";

// (async () => {
//   const sql = await SqlDataSource.connect();

//   const user = await User.insertMany([
//     {
//       name: "sqlite",
//       email: "user12",
//       signupSource: "email",
//       isActive: true,
//     },
//     {
//       name: "sqlite",
//       email: "user13",
//       signupSource: "email",
//       isActive: true,
//     },
//   ]);

//   console.log(user);
//   await sql.closeConnection();
// })();

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

  // redis
  Redis,
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
};
