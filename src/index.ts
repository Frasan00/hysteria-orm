import { Metadata, Model } from "./Sql/Models/Model";
import { HasOne } from "./Sql/Models/Relations/HasOne";
import { HasMany } from "./Sql/Models/Relations/HasMany";
import { BelongsTo } from "./Sql/Models/Relations/BelongsTo";
import { DataSourceInput } from "./Datasource";
import { Migration } from "./Sql/Migrations/Migration";
import { SqlDataSource } from "./Sql/SqlDataSource";
import { testCreate, testQuery } from "./test";

class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;

  public static metadata: Metadata = {
    primaryKey: "id",
    tableName: "users",
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

  // await testCreate();
  await testQuery();

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
