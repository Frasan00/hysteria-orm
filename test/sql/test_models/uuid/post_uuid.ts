import crypto from "node:crypto";
import { Model } from "../../../../src/sql/models/model";
import { belongsTo, column } from "../../../../src/sql/models/model_decorators";
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

  @belongsTo(() => UserWithUuid, "userId")
  declare user: UserWithUuid;

  static async beforeInsert(data: PostWithUuid): Promise<void> {
    data.id = crypto.randomUUID();
  }
}
