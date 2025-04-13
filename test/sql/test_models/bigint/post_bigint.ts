import { Model } from "../../../../src/sql/models/model";
import {
  belongsTo,
  column,
  dateColumn,
} from "../../../../src/sql/models/model_decorators";
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

  @dateColumn()
  declare createdAt: Date;

  @dateColumn()
  declare updatedAt: Date;

  @dateColumn()
  declare deletedAt: Date | null;

  @belongsTo(() => UserWithBigint, "userId")
  declare user: UserWithBigint;
}
