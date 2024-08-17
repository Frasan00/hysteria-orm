#!/usr/bin/env node

import "reflect-metadata";
import { DataSourceInput } from "./Datasource";
import { Migration } from "./Sql/Migrations/Migration";
import { Model, column } from "./Sql/Models/Model";
import { BelongsTo } from "./Sql/Models/Relations/BelongsTo";
import { HasMany } from "./Sql/Models/Relations/HasMany";
import { HasOne } from "./Sql/Models/Relations/HasOne";
import { Relation } from "./Sql/Models/Relations/Relation";
import {
  QueryBuilders,
  UpdateQueryBuilders,
  DeleteQueryBuilders,
} from "./Sql/QueryBuilder/QueryBuilder";
import { SqlDataSource } from "./Sql/SqlDatasource";
import { User } from "./test";

(async () => {
  await SqlDataSource.connect();

  process.exit(0);
})();

export {
  Model,
  column,
  Relation,
  HasOne,
  HasMany,
  BelongsTo,
  SqlDataSource,
  DataSourceInput,
  QueryBuilders,
  UpdateQueryBuilders,
  DeleteQueryBuilders,
  Migration,
};
