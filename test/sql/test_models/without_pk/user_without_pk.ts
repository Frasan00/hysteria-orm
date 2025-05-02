import { column } from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { generateKeyPair } from "../../../../src/utils/encryption";
import { ModelQueryBuilder } from "../../models/model_query_builder/model_query_builder";
export enum UserStatus {
  active = "active",
  inactive = "inactive",
}

const { publicKey, privateKey } = generateKeyPair();

export class UserWithoutPk extends Model {
  static _table = "users_without_pk";

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
  declare image: boolean;

  @column()
  declare height: number;

  @column()
  declare weight: number;

  @column.encryption.asymmetric({
    publicKey,
    privateKey,
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

  static beforeUpdate(queryBuilder: ModelQueryBuilder<UserWithoutPk>): void {
    queryBuilder.whereNull("users_without_pk.deleted_at");
  }

  static beforeDelete(queryBuilder: ModelQueryBuilder<UserWithoutPk>): void {
    queryBuilder.whereNull("users_without_pk.deleted_at");
  }

  static beforeFetch(queryBuilder: ModelQueryBuilder<UserWithoutPk>): void {
    queryBuilder.whereNull("users_without_pk.deleted_at");
  }
}
