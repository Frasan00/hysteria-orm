import { ModelQueryBuilder } from "../../../../src/sql/model_query_builder/model_query_builder";
import { Model } from "../../../../src/sql/models/model";
import {
  column,
  dateColumn,
} from "../../../../src/sql/models/model_decorators";
import crypto from "node:crypto";

export enum UserStatus {
  active = "active",
  inactive = "inactive",
}

export class UserWithUuid extends Model {
  static _table = "users_with_uuid";

  @column({
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

  static async beforeInsert(data: UserWithUuid): Promise<void> {
    data.id = crypto.randomUUID();
    data.createdAt = new Date();
    data.updatedAt = new Date();
  }

  static beforeUpdate(queryBuilder: ModelQueryBuilder<UserWithUuid>): void {
    queryBuilder.whereNull("users_with_uuid.deleted_at");
  }

  static beforeDelete(queryBuilder: ModelQueryBuilder<UserWithUuid>): void {
    queryBuilder.whereNull("users_with_uuid.deleted_at");
  }

  static beforeFetch(queryBuilder: ModelQueryBuilder<UserWithUuid>): void {
    queryBuilder.whereNull("users_with_uuid.deleted_at");
  }
}
