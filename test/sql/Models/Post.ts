import { User } from "./User";
import { column, belongsTo } from "../../../src/sql/models/model_decorators";
import { Model } from "../../../src/sql/models/model";

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
