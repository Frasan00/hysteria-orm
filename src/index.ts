import "reflect-metadata";
import { DataSourceInput } from "./Datasource";
import { Migration } from "./Sql/Migrations/Migration";
import { Model } from "./Sql/Models/Model";
import {
  belongsTo,
  hasOne,
  hasMany,
  column,
  getRelations,
  getModelColumns,
} from "./Sql/Models/ModelDecorators";
import { Relation } from "./Sql/Models/Relations/Relation";
import { ModelQueryBuilder } from "./Sql/QueryBuilder/QueryBuilder";
import { SqlDataSource } from "./Sql/SqlDatasource";
import { getPrimaryKey } from "./Sql/Models/ModelDecorators";
import { CaseConvention, convertCase } from "./CaseUtils";
import { ModelDeleteQueryBuilder } from "./Sql/QueryBuilder/DeleteQueryBuilder";
import { ModelUpdateQueryBuilder } from "./Sql/QueryBuilder/UpdateQueryBuilder";
import { RedisOptions } from "ioredis";
import {
  RedisDataSource as Redis,
  RedisGiveable,
  RedisStorable,
} from "./NoSql/Redis/RedisDataSource";
import { DateTime } from "luxon";
import { User } from "../test/sql/Models/User";

// (async () => {
//   const sql = await SqlDataSource.connect({
//     type: "sqlite",
//     database: "sqlite.db",
//   });
//   const user = (await User.query().one()) as User;
//   user.isActive = 0 as any;
//   const users = await User.deleteQuery().softDelete({
//     column: "deletedAt",
//     value: DateTime.local().toISODate(),
//   });
//   console.log(users);
//   await sql.closeConnection();
// })();

export default {
  // Sql
  Model,
  column,
  belongsTo,
  hasOne,
  hasMany,
  Relation,
  SqlDataSource,
  Migration,
  getRelations,
  getModelColumns,

  // Redis
  Redis,
};

export {
  // Sql
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
  getRelations,
  getModelColumns,
  getPrimaryKey,

  // Redis
  Redis,
  RedisGiveable,
  RedisStorable,
  RedisOptions,
};
