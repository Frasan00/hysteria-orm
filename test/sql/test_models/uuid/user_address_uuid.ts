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

  static async beforeInsert(data: UserAddressWithUuid): Promise<void> {
    data.id = crypto.randomUUID();
  }
}
