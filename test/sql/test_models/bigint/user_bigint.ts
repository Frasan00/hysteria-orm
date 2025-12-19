import {
  column,
  hasMany,
  hasOne,
  manyToMany,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { ModelQueryBuilder } from "../../models/model_query_builder/model_query_builder";
import { AddressWithBigint } from "./address_bigint";
import { PostWithBigint } from "./post_bigint";
import { UserAddressWithBigint } from "./user_address_bigint";

export enum UserStatus {
  active = "active",
  inactive = "inactive",
}

export class UserWithBigint extends Model {
  static table = "users_with_bigint";

  @column.integer({
    primaryKey: true,
  })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare email: string;

  @column({
    hidden: true,
  })
  declare password: string;

  @column()
  declare status: UserStatus;

  @column()
  declare age: number;

  @column()
  declare salary: number;

  @column()
  declare gender: string;

  @column()
  declare height: number;

  @column()
  declare weight: number;

  @column()
  declare description: string;

  @column()
  declare shortDescription: string;

  @column.boolean()
  declare isActive: boolean;

  @column.json()
  declare json: Record<string, any> | null;

  @column.date()
  declare birthDate: Date | null;

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

  @hasOne(() => PostWithBigint, "userId")
  declare post: PostWithBigint;

  @hasMany(() => PostWithBigint, "userId")
  declare posts: PostWithBigint[];

  @manyToMany(() => AddressWithBigint, () => UserAddressWithBigint, {
    leftForeignKey: "userId",
    rightForeignKey: "addressId",
  })
  declare addresses: AddressWithBigint[];

  static beforeUpdate(queryBuilder: ModelQueryBuilder<UserWithBigint>): void {
    queryBuilder.whereNull("users_with_bigint.deleted_at");
  }

  static beforeDelete(queryBuilder: ModelQueryBuilder<UserWithBigint>): void {
    queryBuilder.whereNull("users_with_bigint.deleted_at");
  }

  static beforeFetch(queryBuilder: ModelQueryBuilder<UserWithBigint>): void {
    queryBuilder.whereNull("users_with_bigint.deleted_at");
  }
}
