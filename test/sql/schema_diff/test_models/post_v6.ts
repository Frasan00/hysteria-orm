import {
  belongsTo,
  column,
  manyToMany,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { TagMigration } from "./tag";
import { UserMigrationV6 } from "./user_v6";

/**
 * Post v6: Add onDelete CASCADE to manyToMany
 * Tests: relationsToModify
 */
export class PostMigrationV6 extends Model {
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

  @belongsTo(() => UserMigrationV6, "userId", { onDelete: "cascade" })
  declare user: UserMigrationV6;

  @manyToMany(
    () => TagMigration,
    "schema_diff_post_tags",
    {
      leftForeignKey: "postId",
      rightForeignKey: "tagId",
    },
    { onDelete: "cascade" },
  )
  declare tags: TagMigration[];
}
