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
import { AbstractQueryBuilders } from "./Sql/QueryBuilder/QueryBuilder";
import { SqlDataSource } from "./Sql/SqlDatasource";
import { getPrimaryKey } from "./Sql/Models/ModelDecorators";
import { CaseConvention } from "./CaseUtils";
import { AbstractDeleteQueryBuilder } from "./Sql/QueryBuilder/DeleteQueryBuilder";
import { AbstractUpdateQueryBuilder } from "./Sql/QueryBuilder/UpdateQueryBuilder";
import { User } from "../test/sql/Models/User";
import { DateTime } from "luxon";
import crypto from "crypto";
import { Post } from "../test/sql/Models/Post";

SqlDataSource.connect().then(async (sql) => {
  const userWithPosts = await User.query()
    .where("id", "")
    .whereNull("deletedAt")
    .addRelations(["posts"])
    .one();

  await User.query()
    .where("id", "")
    .whereBuilder((qb) => {
      qb.where("id", "").where("name", "safsafdas").whereNull("deletedAt");
      qb.orWhere("id", "").orWhere("name", "safsafdas").whereNull("deletedAt");
    })
    .whereBuilder((qb2) => {
      qb2.where("id", "").where("name", "safsafdas").whereNull("deletedAt");
    })
    .one();

  await sql.closeConnection();
  return userWithPosts;
});

export default {
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
};

export {
  Model,
  column,
  belongsTo,
  hasOne,
  hasMany,
  Relation,
  SqlDataSource,
  DataSourceInput,
  AbstractQueryBuilders,
  AbstractDeleteQueryBuilder,
  AbstractUpdateQueryBuilder,
  Migration,
  CaseConvention,
  getRelations,
  getModelColumns,
  getPrimaryKey,
};
