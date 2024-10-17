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
import { Sql_data_source } from "./sql/sql_data_source";
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
import { DateTime } from "luxon";
import { User } from "../test/sql/Models/User";

// (async () => {
//   const sql = await Sql_data_source.connect({
//     type: "sqlite",
//     database: "sqlite.db",
//     logs: true,
//   });

//   await User.insert({
//     name: "sqlite",
//     email: "user",
//     signupSource: "email",
//     isActive: true,
//   });
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
  SqlDataSource: Sql_data_source,
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
  Sql_data_source,
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
