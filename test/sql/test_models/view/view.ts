import { ModelQueryBuilder } from "../../../../src/sql/models/model_query_builder/model_query_builder";
import {
  column,
  view,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { UserWithoutPk } from "../without_pk/user_without_pk";
import { SqlDataSource } from "../../../../src/sql/sql_data_source";

export enum UserStatus {
  active = "active",
  inactive = "inactive",
}

@view((query: ModelQueryBuilder<UserWithoutPk, {}, {}>) => {
  query
    .selectRaw("COUNT(*) as total")
    .selectRaw("1 as id")
    .from("users_without_pk");
})
export class UserView extends Model {
  @column({ primaryKey: true })
  declare id: number;

  @column()
  declare total: number;
}

const dataSource = new SqlDataSource({
  type: "postgres",
  database: "test",
  host: "localhost",
  port: 5432,
  username: "root",
  password: "root",
  logs: true,
});
await dataSource.connect();
console.log(await UserView.query().many());
await SqlDataSource.disconnect();
