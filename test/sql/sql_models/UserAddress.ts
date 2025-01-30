import { Model } from "../../../src/sql/models/model";
import { column } from "../../../src/sql/models/model_decorators";

export class UserAddress extends Model {
  static table: string = "user_addresses";
  @column({ primaryKey: true })
  declare id: number;

  @column()
  declare userId: number;

  @column()
  declare addressId: number;
}
