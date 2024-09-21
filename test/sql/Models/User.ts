import { DateTime } from "luxon";
import {
  column,
  hasMany,
  hasOne,
} from "../../../src/Sql/Models/ModelDecorators";
import { Model } from "../../../src/Sql/Models/Model";
import { Post } from "./Post";
import crypto from "crypto";
import { ModelQueryBuilder } from "../../../src/Sql/QueryBuilder/QueryBuilder";

export class User extends Model {
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
}
