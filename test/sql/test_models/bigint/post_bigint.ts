import { Model } from "../../../../src/sql/models/model";
import {
  belongsTo,
  column,
} from "../../../../src/sql/models/decorators/model_decorators";
import { UserWithBigint } from "./user_bigint";

export class PostWithBigint extends Model {
  static _table = "posts_with_bigint";

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

  @column.date({
    autoCreate: true,
  })
  declare createdAt: Date;

  @column.date({
    autoCreate: true,
    autoUpdate: true,
  })
  declare updatedAt: Date;

  @column.date()
  declare deletedAt: Date | null;

  @belongsTo(() => UserWithBigint, "userId")
  declare user: UserWithBigint;
}
