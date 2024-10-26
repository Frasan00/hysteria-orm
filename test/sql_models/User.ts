import { DateTime } from "luxon";
import { Post } from "./Post";
import { ModelQueryBuilder } from "../sql/query_builder/query_builder";
import { Model } from "../../src/sql/models/model";
import {
  column,
  hasMany,
  hasOne,
  dynamicColumn,
  manyToMany,
} from "../../src/sql/models/model_decorators";
import { Address } from "./Address";
import { UserAddress } from "./UserAddress";

export class User extends Model {
  static tableName: string = "users";
  @column({ primaryKey: true })
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
  declare json: Record<string, any> | null;

  @column()
  declare createdAt: DateTime;

  @column()
  declare updatedAt: DateTime;

  @column()
  declare deletedAt: DateTime | null;

  @hasMany(() => Post, "userId")
  declare posts: Post[];

  @hasOne(() => Post, "userId")
  declare post: Post;

  @manyToMany(() => Address, () => UserAddress, "userId")
  declare addresses: Address[];

  static beforeFetch(queryBuilder: ModelQueryBuilder<User>): void {
    queryBuilder.whereNull("deletedAt");
  }

  static async afterFetch(data: User[]): Promise<User[]> {
    if (!data.length) {
      return data;
    }

    return data.map((user) => {
      user.json = null;
      return user;
    });
  }

  @dynamicColumn("firstUser")
  async getFirstUser() {
    return await User.query().one();
  }
}

// User.query().with("addresses", (query: ModelQueryBuilder<Address>) => {
//   query.where();
// });
