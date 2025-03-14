import { ModelQueryBuilder } from "../../../../src/sql/model_query_builder/model_query_builder";
import { Model } from "../../../../src/sql/models/model";
import {
  column,
  dateColumn,
} from "../../../../src/sql/models/model_decorators";

export enum UserStatus {
  active = "active",
  inactive = "inactive",
}

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
  declare image: Buffer;

  @column()
  declare height: number;

  @column()
  declare weight: number;

  @column()
  declare description: string;

  @column()
  declare shortDescription: string;

  @column({
    prepare: (value: boolean) => Boolean(value),
    serialize: (value: boolean) => Boolean(value),
  })
  declare isActive: boolean;

  @column()
  declare json: Record<string, any> | null;

  @dateColumn()
  declare birthDate: Date;

  @dateColumn()
  declare createdAt: Date;

  @dateColumn()
  declare updatedAt: Date;

  @dateColumn()
  declare deletedAt: Date | null;

  static async beforeInsert(data: any): Promise<void> {
    data.createdAt = new Date();
    data.updatedAt = new Date();
  }

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
