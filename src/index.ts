import "reflect-metadata";
import { DataSourceInput } from "./Datasource";
import { Migration } from "./Sql/Migrations/Migration";
import { Metadata, Model } from "./Sql/Models/Model";
import {
  belongsTo,
  hasOne,
  hasMany,
  column,
  getRelations,
  getModelColumns,
} from "./Sql/Models/ModelDecorators";
import { Relation } from "./Sql/Models/Relations/Relation";
import {
  QueryBuilders,
  UpdateQueryBuilders,
  DeleteQueryBuilders,
} from "./Sql/QueryBuilder/QueryBuilder";
import { SqlDataSource } from "./Sql/SqlDatasource";
import { Post } from "../test/sql/Models/Post";
import { CaseConvention } from "./CaseUtils";

// console.log(Post.metadata);

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
  QueryBuilders,
  UpdateQueryBuilders,
  DeleteQueryBuilders,
  Migration,
  Metadata,
  CaseConvention,
  getRelations,
  getModelColumns,
};
