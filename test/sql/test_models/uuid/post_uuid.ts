import crypto from "node:crypto";
import {
  belongsTo,
  column,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { UserWithUuid } from "./user_uuid";

export class PostWithUuid extends Model {
  static table = "posts_with_uuid";

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

  @belongsTo(() => UserWithUuid, "userId")
  declare user: UserWithUuid;

  static async beforeInsert(data: PostWithUuid): Promise<void> {
    data.id = crypto.randomUUID();
  }

  static async beforeInsertMany(data: PostWithUuid[]): Promise<void> {
    for (const item of data) {
      item.id = crypto.randomUUID();
    }
  }
}
