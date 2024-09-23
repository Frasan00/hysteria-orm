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
  declare json: Record<string, any>;

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

  static beforeFetch(queryBuilder: ModelQueryBuilder<User>) {
    queryBuilder.whereNull("deletedAt");
  }

  @column()
  declare test: string;

  @dynamicColumn("test")
  async getTest() {
    return await User.query().one();
  }
}

const user = User.delete().where("id", "1");