import { User } from "./User";
import * as crypto from "crypto";
import { Model } from "../src/sql/models/model";
import { column, belongsTo } from "../src/sql/models/model_decorators";

export class Post extends Model {
  @column({ primaryKey: true })
  declare id: number;

  @column()
  declare userId: number;

  @column()
  declare title: string;

  @column()
  declare content: string;

  @belongsTo(() => User, "userId")
  declare user: User;
}
