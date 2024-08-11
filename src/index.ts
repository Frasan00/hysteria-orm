#!/usr/bin/env node

import { column, Metadata, Model } from "./Sql/Models/Model";
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
import "reflect-metadata";

export class User extends Model {
  @column()
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare email: string;

  @column()
  declare signupSource: string;

  @column()
  declare isActive: boolean;

  @column()
  declare json: Record<string, any>;

  @column()
  declare createdAt: DateTime;

  public posts: HasMany | Post[] = new HasMany("posts", "user_id");

  public static metadata: Metadata = {
    primaryKey: "id",
    tableName: "users",
  };

  public static async afterFetch(data: User[]): Promise<User[]> {
    if (!data.length) {
      return data;
    }

    return data.map((user) => {
      if (user.name) {
        user.name = user.name.toUpperCase();
      }

      return user;
    });
  }
}

export class Post extends Model {
  @column()
  declare id: number;

  @column()
  declare title: string;

  @column()
  declare content: string;

  @column()
  declare userId: number;

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
  await testQuery();

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
