#!/usr/bin/env node

import { Metadata, Model } from "./Sql/Models/Model";
import { HasOne } from "./Sql/Models/Relations/HasOne";
import { HasMany } from "./Sql/Models/Relations/HasMany";
import { BelongsTo } from "./Sql/Models/Relations/BelongsTo";
import { DataSourceInput } from "./Datasource";
import { Relation } from "./Sql/Models/Relations/Relation";
import { Migration } from "./Sql/Migrations/Migration";
import { SqlDataSource } from "./Sql/SqlDatasource";
import { testCreate, testDelete, testQuery, testTrx, testUpdate } from "./test";
import { DateTime } from "luxon";
import {
  QueryBuilders,
  UpdateQueryBuilders,
  DeleteQueryBuilders,
} from "./Sql/QueryBuilder/QueryBuilder";

export class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public signupSource!: string;
  public isActive!: boolean;
  public json!: Record<string, any>;
  public createdAt!: DateTime;

  public posts: HasMany | Post[] = new HasMany("posts", "user_id");

  public static metadata: Metadata = {
    primaryKey: "id",
    tableName: "users",
  };
}

export class Post extends Model {
  public id!: number;
  public title!: string;
  public content!: string;
  public userId!: number;

  public user: BelongsTo | User = new BelongsTo("users", "userId");

  public static metadata: Metadata = {
    primaryKey: "id",
    tableName: "posts",
  };
}

(async () => {
  await SqlDataSource.connect();
  // await testCreate();
  // await testUpdate();
  // await testDelete();
  // await testTrx();
  // await testQuery();

  process.exit(0);
})();

export {
  Model,
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
