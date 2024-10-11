import { DateTime } from "luxon";
import {
  column,
  dynamicColumn,
  hasMany,
  hasOne,
} from "../../../src/Sql/Models/ModelDecorators";
import { Model } from "../../../src/Sql/Models/Model";
import { Post } from "./Post";
import { ModelQueryBuilder } from "../../../src/Sql/QueryBuilder/QueryBuilder";

export class User extends Model {
  static tableName: string = "users";
  @column({ primaryKey: true })
  declare id: string;

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
