import {
  belongsTo,
  column,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { UserMigrationV4 } from "./user_v4";

/**
 * Post v4: Drop editorId relation (remove editor belongsTo but keep column)
 * Tests: relationsToDrop
 */
export class PostMigrationV4 extends Model {
  static table = "schema_diff_posts";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare title: string;

  @column({ type: "text", nullable: true })
  declare content: string | null;

  @column({ type: "bigint" })
  declare userId: number;

  @column({ type: "bigint", nullable: true })
  declare editorId: number | null;

  @belongsTo(() => UserMigrationV4, "userId", { onDelete: "cascade" })
  declare user: UserMigrationV4;
}
