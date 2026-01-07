import {
  belongsTo,
  column,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { UserMigrationV1 } from "./user_v1";

/**
 * Post v1: Create table with belongsTo User (userId)
 * Tests: tablesToAdd, relationsToAdd
 */
export class PostMigrationV1 extends Model {
  static table = "schema_diff_posts";

  @column.bigIncrement()
  declare id: number;

  @column({ type: "varchar", length: 255 })
  declare title: string;

  @column({ type: "text", nullable: true })
  declare content: string | null;

  @column({ type: "bigint" })
  declare userId: number;

  @belongsTo(() => UserMigrationV1, "userId")
  declare user: UserMigrationV1;
}
