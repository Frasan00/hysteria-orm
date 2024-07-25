import { Model } from "./Sql/Models/Model";
import { HasOne } from "./Sql/Models/Relations/HasOne";
import { HasMany } from "./Sql/Models/Relations/HasMany";
import { BelongsTo } from "./Sql/Models/Relations/BelongsTo";
import { DatasourceInput } from "./Datasource";
import { Migration } from "./Sql/Migrations/Migration";
import { SqlDataSource } from "./Sql/SqlDataSource";

class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;

  constructor() {
    super({
      primaryKey: "id",
      tableName: "users",
    });
  }
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

  const user = (await User.query().where("id", 2).one()) as User;
  console.log(user);

  await User.update(user);
  console.log(user);

  process.exit(0);
})();

export {
  Model,
  HasOne,
  HasMany,
  BelongsTo,
  SqlDataSource,
  DatasourceInput,
  Migration,
};
