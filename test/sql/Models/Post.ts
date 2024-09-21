import { User } from "./User";
import { column, belongsTo } from "../../../src/Sql/Models/ModelDecorators";
import { Model } from "../../../src/Sql/Models/Model";

export class Post extends Model {
  @column({ primaryKey: true })
  declare id: number;

  @column()
  declare userId: string;

  @column()
  declare title: string;

  @column()
  declare content: string;

  @belongsTo(() => User, "userId")
  declare user: User;
}
