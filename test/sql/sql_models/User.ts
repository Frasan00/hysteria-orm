import { ModelQueryBuilder } from "../../../src/sql/model_query_builder/model_query_builder";
import { Model } from "../../../src/sql/models/model";
import {
  column,
  hasMany,
  hasOne,
  manyToMany,
} from "../../../src/sql/models/model_decorators";
import { Address } from "./Address";
import { Post } from "./Post";
import { UserAddress } from "./UserAddress";

export class User extends Model {
  static _table: string = "users";
  @column({ primaryKey: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare email: string;

  @column()
  declare signupSource: string;

  @column({
    prepare: (value: boolean) => Boolean(value),
    serialize: (value: boolean) => Boolean(value),
  })
  declare isActive: boolean;

  @column()
  declare json: Record<string, any> | null;

  @column()
  declare createdAt: Date;

  @column()
  declare updatedAt: Date;

  @column()
  declare deletedAt: Date | null;

  @hasMany(() => Post, "userId")
  declare posts: Post[];

  @hasOne(() => Post, "userId")
  declare post: Post;

  @manyToMany(() => Address, () => UserAddress, "userId")
  declare addresses: Address[];

  static beforeFetch(queryBuilder: ModelQueryBuilder<User>): void {
    queryBuilder.whereNull("deletedAt");
  }

  // static async afterFetch(data: User[]): Promise<User[]> {
  //   if (!data.length) {
  //     return data;
  //   }

  //   return data.map((user) => {
  //     user.json = null;
  //     return user;
  //   });
  // }
}
