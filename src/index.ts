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

SqlDataSource.connect().then(async (sql) => {
  const user = await User.create({
    name: "Grace",
    email: crypto.randomUUID(),
    signupSource: "email",
    isActive: true,
  });

  if (!user) {
    throw new Error("User not created");
  }

  const softDeletedUser = await User.softDelete(user, {
    column: "deletedAt",
    value: DateTime.local().toString(),
  });

  const allUsers = await User.query().one();
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
