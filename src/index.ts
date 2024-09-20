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
