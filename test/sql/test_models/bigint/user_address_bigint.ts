import { Model } from "../../../../src/sql/models/model";
import {
  column,
  dateColumn,
} from "../../../../src/sql/models/model_decorators";
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

  @dateColumn()
  declare createdAt: Date;

  @dateColumn()
  declare updatedAt: Date;

  @dateColumn()
  declare deletedAt: Date | null;
}
