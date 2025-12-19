import { column } from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";

export class UserAddressWithBigint extends Model {
  static table = "user_address_with_bigint";

  @column.integer({
    primaryKey: true,
  })
  declare id: number;

  @column.integer()
  declare userId: number;

  @column.integer()
  declare addressId: number;

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
}
