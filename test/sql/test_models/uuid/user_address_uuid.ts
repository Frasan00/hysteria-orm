import crypto from "node:crypto";
import { column } from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

export class UserAddressWithUuid extends Model {
  static table = "user_address_with_uuid";

  @column({
    primaryKey: true,
  })
  declare id: string;

  @column()
  declare userId: string;

  @column()
  declare addressId: string;

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

  static async beforeInsert(data: UserAddressWithUuid): Promise<void> {
    data.id = crypto.randomUUID();
  }

  static async beforeInsertMany(data: UserAddressWithUuid[]): Promise<void> {
    for (const item of data) {
      item.id = crypto.randomUUID();
    }
  }
}
