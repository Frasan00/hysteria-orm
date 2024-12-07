import { User } from "./User";
import { Model } from "../../src/sql/models/model";
import {
  column,
  dynamicColumn,
  manyToMany,
} from "../../src/sql/models/model_decorators";
import { ModelQueryBuilder } from "../../src/sql/query_builder/query_builder";

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

  @dynamicColumn("test")
  async getTest() {
    return "test";
  }

  static beforeFetch(queryBuilder: ModelQueryBuilder<Address>): void {
    queryBuilder.rawWhere("1 = 1");
  }

  static async afterFetch(data: Model[]): Promise<Model[]> {
    return data.map((address) => {
      if (!address.$additionalColumns) {
        address.$additionalColumns = {};
      }

      address.$additionalColumns["afterFetch"] = "test";
      return address;
    });
  }
}
