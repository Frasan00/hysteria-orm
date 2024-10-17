import { User } from "./User";
import { column, belongsTo } from "../../../src/sql/models/model_decorators";
import { Model } from "../../../src/sql/models/model";
import * as crypto from "crypto";

export class Post extends Model {
  @column({ primaryKey: true })
  declare id: string;

  @column()
  declare userId: string;

  @column()
  declare title: string;

  @column()
  declare content: string;

  @belongsTo(() => User, "userId")
  declare user: User;

  static beforeInsert(data: Post): void {
    data.id = crypto.randomUUID();
  }
}
