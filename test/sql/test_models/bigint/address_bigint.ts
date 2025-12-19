import {
  column,
  manyToMany,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { UserAddressWithBigint } from "./user_address_bigint";
import { UserWithBigint } from "./user_bigint";

export class AddressWithBigint extends Model {
  static table = "address_with_bigint";

  @column.integer({
    primaryKey: true,
  })
  declare id: number;

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

  @manyToMany(() => UserWithBigint, () => UserAddressWithBigint, {
    leftForeignKey: "addressId",
    rightForeignKey: "userId",
  })
  declare users: UserWithBigint[];
}
