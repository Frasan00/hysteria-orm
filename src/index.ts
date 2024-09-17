import "reflect-metadata";
import { DataSourceInput } from "./Datasource";
import { Migration } from "./Sql/Migrations/Migration";
import { Metadata, Model, column } from "./Sql/Models/Model";
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
  Metadata,
};


(async () => {
  await SqlDataSource.connect();

  await testQuery();

  process.exit(0);
})();

export async function testCreate() {}

export async function testUpdate() {}

export async function testQuery() {
  const post = await Post.query().where("id", 3).addRelations(["user"]).one();
  console.log(post);
}

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

  @column({ booleanColumn: true })
  declare isActive: boolean;

  @column()
  declare json: Record<string, any>;

  @column()
  declare createdAt: Date;

  @column()
  declare updatedAt: Date;

  @column()
  declare deletedAt: Date | null;

  public posts: HasMany | Post[] = new HasMany(Post, "userId", {
    softDeleteColumn: "testBoolean",
    softDeleteType: "boolean",
  });

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

  @column({ booleanColumn: true })
  declare testBoolean: boolean;

  public user: BelongsTo | User = new BelongsTo(User, "userId", {
    softDeleteColumn: "deletedAt",
    softDeleteType: "date",
  });

  public static metadata: Metadata = {
    primaryKey: "id",
    tableName: "posts",
  };
}

