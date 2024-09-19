import { User } from "./User";
import { column, belongsTo } from "../../../src/Sql/Models/ModelDecorators";
import { Metadata, Model } from "../../../src/Sql/Models/Model";

export class Post extends Model {
  @column()
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
