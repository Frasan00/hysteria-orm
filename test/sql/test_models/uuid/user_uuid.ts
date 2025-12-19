import {
  column,
  hasMany,
  hasOne,
  manyToMany,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { ModelQueryBuilder } from "../../models/model_query_builder/model_query_builder";
import { AddressWithUuid } from "./address_uuid";
import { PostWithUuid } from "./post_uuid";
import { UserAddressWithUuid } from "./user_address_uuid";

export enum UserStatus {
  active = "active",
  inactive = "inactive",
}

export class UserWithUuid extends Model {
  static table = "users_with_uuid";

  @column.uuid({
    primaryKey: true,
  })
  declare id: string;

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

  @column.encryption.symmetric({
    key: "symmetricKey",
  })
  declare description: string;

  @column()
  declare shortDescription: string;

  @column.boolean()
  declare isActive: boolean;

  @column.json()
  declare json: Record<string, any> | null;

  @column.date()
  declare birthDate: Date;

  @column.datetime({ autoCreate: true })
  declare createdAt: Date;

  @column.datetime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: Date;

  @column.datetime()
  declare deletedAt: Date | null;

  @hasOne(() => PostWithUuid, "userId")
  declare post: PostWithUuid;

  @hasMany(() => PostWithUuid, "userId")
  declare posts: PostWithUuid[];

  @manyToMany(() => AddressWithUuid, () => UserAddressWithUuid, {
    leftForeignKey: "userId",
    rightForeignKey: "addressId",
  })
  declare addresses: AddressWithUuid[];

  static beforeUpdate(queryBuilder: ModelQueryBuilder<UserWithUuid>): void {
    queryBuilder.whereNull("users_with_uuid.deleted_at");
  }

  static beforeDelete(queryBuilder: ModelQueryBuilder<UserWithUuid>): void {
    queryBuilder.whereNull("users_with_uuid.deleted_at");
  }

  static beforeFetch(queryBuilder: ModelQueryBuilder<UserWithUuid>): void {
    queryBuilder.whereNull("users_with_uuid.deleted_at");
  }

  static afterFetch(data: UserWithUuid[]): UserWithUuid[] {
    return data;
  }

  static beforeInsert(data: UserWithUuid): void {
    const originalName = data.name;
    data.name = originalName.toUpperCase();
    data.name = originalName;
  }

  static beforeInsertMany(data: UserWithUuid[]): void {
    for (const item of data) {
      const originalName = item.name;
      item.name = originalName.toUpperCase();
      item.name = originalName;
    }
  }
}
