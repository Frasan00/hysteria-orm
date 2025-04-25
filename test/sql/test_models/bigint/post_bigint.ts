import { Model } from "../../../../src/sql/models/model";
import { belongsTo, column } from "../../../../src/sql/models/model_decorators";
import { UserWithBigint } from "./user_bigint";

export class PostWithBigint extends Model {
  static _table = "posts_with_bigint";

  @column({
    primaryKey: true,
  })
  declare id: number;

  @column()
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
