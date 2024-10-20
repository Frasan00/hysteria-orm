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
import { StandaloneQueryBuilder } from "./sql/query_builder/standalone_sql_query_builder";
import { User } from "../test/User";

(async () => {
  // const sql = await SqlDataSource.connect();

  // const { query, params } = User.query()
  //   .whereBuilder((builder) => {
  //     builder.where("id", 1);
  //     builder.orWhere("name", "John");
  //     builder.andWhereBuilder((builder) => {
  //       builder.where("signup_date", "2021-01-01");
  //       builder.orWhere("signup_date", "2021-01-02");
  //     });
  //   })
  //   .getCurrentQuery();

  // console.log(query, params);

  // await sql.closeConnection();

  const userQueryBuilder = new StandaloneQueryBuilder("postgres", "users");
  const { query, params } = userQueryBuilder
    .whereBuilder((builder) => {
      builder.where("id", 1);
      builder.orWhere("name", "John");
      builder.andWhereBuilder((builder) => {
        builder.where("signup_date", "2021-01-01");
        builder.orWhere("signup_date", "2021-01-02");
      });
    })
    .getCurrentQuery();

  console.log(query, params);
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
  StandaloneQueryBuilder,
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
