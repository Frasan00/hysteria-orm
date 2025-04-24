import { Model } from "../../../../src/sql/models/model";
import {
  column,
  dateColumn,
} from "../../../../src/sql/models/model_decorators";
import crypto from "node:crypto";

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

  @dateColumn()
  declare createdAt: Date;

  @dateColumn()
  declare updatedAt: Date;

  @dateColumn()
  declare deletedAt: Date | null;

  static async beforeInsert(data: AddressWithUuid): Promise<void> {
    data.id = crypto.randomUUID();
  }
}
