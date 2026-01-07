import {
  belongsTo,
  column,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { UserMigrationV3 } from "./user_v3";

/**
 * Post v3: Add second belongsTo - editorId -> User
 * Tests: relationsToAdd
 */
export class PostMigrationV3 extends Model {
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

  @belongsTo(() => UserMigrationV3, "userId", { onDelete: "cascade" })
  declare user: UserMigrationV3;

  @belongsTo(() => UserMigrationV3, "editorId", { onDelete: "set null" })
  declare editor: UserMigrationV3;
}
