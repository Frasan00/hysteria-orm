import { Metadata, Model } from "./Sql/Models/Model";
import { HasOne } from "./Sql/Models/Relations/HasOne";
import { HasMany } from "./Sql/Models/Relations/HasMany";
import { BelongsTo } from "./Sql/Models/Relations/BelongsTo";
import { DataSourceInput } from "./Datasource";
import { Migration } from "./Sql/Migrations/Migration";
import { SqlDataSource } from "./Sql/SqlDataSource";
import { testCreate, testDelete, testQuery, testUpdate } from "./test";

class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public signupSource!: string;

  public posts: HasMany | Post[] = new HasMany("posts", "user_id");

  public static metadata: Metadata = {
    primaryKey: "id",
    tableName: "users",
  };
}

// TODO test with trx and relations
class Post extends Model {
  public id!: number;
  public title!: string;
  public content!: string;
  public user_id!: number;

  public user: HasOne | User = new HasOne("user", "user_id");

  public static metadata: Metadata = {
    primaryKey: "id",
    tableName: "posts",
  };
}

(async () => {
  await SqlDataSource.connect({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "root",
    database: "test",
    logs: true,
  });

  // await testQuery();
  // await testCreate();
  // await testUpdate();
  // await testDelete();

  process.exit(0);
})();

export {
  Model,
  HasOne,
  HasMany,
  BelongsTo,
  SqlDataSource,
  DataSourceInput,
  Migration,
};
