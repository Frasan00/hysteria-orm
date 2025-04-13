import { Model } from "../../../../src/sql/models/model";
import {
  belongsTo,
  column,
  dateColumn,
} from "../../../../src/sql/models/model_decorators";
import { UserWithUuid } from "./user_uuid";
export class PostWithUuid extends Model {
  static _table = "posts_with_uuid";

  @column({
    primaryKey: true,
  })
  declare id: string;

  @column()
  declare userId: string;

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

  @belongsTo(() => UserWithUuid, "userId")
  declare user: UserWithUuid;
}
