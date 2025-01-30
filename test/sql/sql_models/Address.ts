import { Model } from "../../../src/sql/models/model";
import { column, manyToMany } from "../../../src/sql/models/model_decorators";
import { ModelQueryBuilder } from "../../../src/sql/query_builder/query_builder";
import { User } from "./User";

export class Address extends Model {
  static _table: string = "addresses";
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

  static beforeFetch(queryBuilder: ModelQueryBuilder<Address>): void {
    queryBuilder.rawWhere("1 = 1");
  }

  static async afterFetch(data: Model[]): Promise<Model[]> {
    return data.map((address) => {
      if (!address.$additional) {
        address.$additional = {};
      }

      address.$additional["afterFetch"] = "test";
      return address;
    });
  }
}
