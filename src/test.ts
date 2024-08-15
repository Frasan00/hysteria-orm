import { column, Metadata, Model } from "./Sql/Models/Model";
import { HasOne } from "./Sql/Models/Relations/HasOne";
import { HasMany } from "./Sql/Models/Relations/HasMany";
import { BelongsTo } from "./Sql/Models/Relations/BelongsTo";
import { DataSourceInput } from "./Datasource";
import { Migration } from "./Sql/Migrations/Migration";
import { SqlDataSource } from "./Sql/SqlDatasource";
import { DateTime } from "luxon";

export async function testCreate() {}

export async function testUpdate() {}

export async function testQuery() {}

export async function testDelete() {}

export async function testTrx() {}

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

  @column()
  declare updatedAt: DateTime;

  @column()
  declare deletedAt: DateTime | null;

  public posts: HasMany | Post[] = new HasMany("posts", "user_id");

  public static metadata: Metadata = {
    primaryKey: "id",
    tableName: "users",
  };
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
