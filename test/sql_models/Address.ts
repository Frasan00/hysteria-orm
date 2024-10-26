import { User } from "./User";
import { Model } from "../../src/sql/models/model";
import { column, manyToMany } from "../../src/sql/models/model_decorators";

export class Address extends Model {
  static tableName: string = "addresses";
  @column({ primaryKey: true })
  declare id: number;

  @column()
  declare street: string;

  @column()
  declare city: string;

  @column()
  declare state: string;

  @manyToMany(() => User, "user_addresses", "addressId")
  declare users: User[];
}
