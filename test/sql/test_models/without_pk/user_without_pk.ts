import { column } from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { ModelQueryBuilder } from "../../models/model_query_builder/model_query_builder";

export enum UserStatus {
  active = "active",
  inactive = "inactive",
}

export class UserWithoutPk extends Model {
  static table = "users_without_pk";

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

  @column()
  declare description: string;

  @column()
  declare shortDescription: string;

  @column.boolean()
  declare isActive: boolean;

  @column.json()
  declare json: Record<string, any> | null;

  @column.date()
  declare birthDate: Date;

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
