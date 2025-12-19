import {
  belongsTo,
  column,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { UserWithBigint } from "./user_bigint";

export class PostWithBigint extends Model {
  static table = "posts_with_bigint";

  @column.integer({
    primaryKey: true,
  })
  declare id: number;

  @column.integer()
  declare userId: number;

  @column()
  declare title: string;

  @column()
  declare content: string;

  @column()
  declare shortDescription: string;

  @column.datetime({
    autoCreate: true,
  })
  declare createdAt: Date;

  @column.datetime({
    autoCreate: true,
    autoUpdate: true,
  })
  declare updatedAt: Date;

  @column.datetime()
  declare deletedAt: Date | null;

  @belongsTo(() => UserWithBigint, "userId")
  declare user: UserWithBigint;
}
