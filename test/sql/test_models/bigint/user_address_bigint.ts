import { column } from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

export class UserAddressWithBigint extends Model {
  static _table = "user_address_with_bigint";

  @column.integer({
    primaryKey: true,
  })
  declare id: number;

  @column.integer()
  declare userId: number;

  @column.integer()
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
