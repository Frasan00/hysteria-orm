import crypto from "node:crypto";
import {
  column,
  manyToMany,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { UserAddressWithUuid } from "./user_address_uuid";
import { UserWithUuid } from "./user_uuid";

export class AddressWithUuid extends Model {
  static table = "address_with_uuid";

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

  @manyToMany(() => UserWithUuid, () => UserAddressWithUuid, {
    leftForeignKey: "addressId",
    rightForeignKey: "userId",
  })
  declare users: UserWithUuid[];

  static async beforeInsert(data: AddressWithUuid): Promise<void> {
    data.id = crypto.randomUUID();
  }

  static async beforeInsertMany(data: AddressWithUuid[]): Promise<void> {
    for (const item of data) {
      item.id = crypto.randomUUID();
    }
  }
}
