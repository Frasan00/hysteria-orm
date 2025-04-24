import { Model } from "../../../../src/sql/models/model";
import {
  column,
  dateColumn,
} from "../../../../src/sql/models/model_decorators";
import crypto from "node:crypto";

export class UserAddressWithUuid extends Model {
  static _table = "user_address_with_uuid";

  @column({
    primaryKey: true,
  })
  declare id: string;

  @column()
  declare userId: string;

  @column()
  declare addressId: string;

  @dateColumn()
  declare createdAt: Date;

  @dateColumn()
  declare updatedAt: Date;

  @dateColumn()
  declare deletedAt: Date | null;

  static async beforeInsert(data: UserAddressWithUuid): Promise<void> {
    data.id = crypto.randomUUID();
  }
}
