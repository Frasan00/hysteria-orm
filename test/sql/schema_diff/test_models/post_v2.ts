import {
  belongsTo,
  column,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { UserMigrationV2 } from "./user_v2";

/**
 * Post v2: Modify relation - add onDelete CASCADE
 * Tests: relationsToModify
 */
export class PostMigrationV2 extends Model {
  static table = "schema_diff_posts";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare title: string;

  @column({ type: "text", nullable: true })
  declare content: string | null;

  @column({ type: "bigint" })
  declare userId: number;

  @belongsTo(() => UserMigrationV2, "userId", { onDelete: "cascade" })
  declare user: UserMigrationV2;
}
