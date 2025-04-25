import { Model } from "../../../../src/sql/models/model";
import { column } from "../../../../src/sql/models/model_decorators";

export class UserAddressWithBigint extends Model {
  static _table = "user_address_with_bigint";

  @column({
    primaryKey: true,
  })
  declare id: number;

  @column()
  declare userId: number;

  @column()
  declare addressId: number;

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
}
