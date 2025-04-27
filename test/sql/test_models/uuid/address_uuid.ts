import crypto from "node:crypto";
import { column } from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

export class AddressWithUuid extends Model {
  static _table = "address_with_uuid";

  @column({
    primaryKey: true,
  })
  declare id: string;

  @column()
  declare street: string;

  @column()
  declare city: string;

  @column()
  declare state: string;

  @column()
  declare zip: string;

  @column()
  declare country: string;

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

  static async beforeInsert(data: AddressWithUuid): Promise<void> {
    data.id = crypto.randomUUID();
  }
}
