import {
  belongsTo,
  column,
  index,
  manyToMany,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { TagMigration } from "./tag";
import { UserMigrationV7 } from "./user_v7";

/**
 * Post v7: Add composite index on [title, createdAt]
 * Tests: indexesToAdd (composite)
 */
@index(["title", "createdAt"], "idx_schema_diff_posts_title_created")
export class PostMigrationV7 extends Model {
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

  @column.datetime({ autoCreate: true })
  declare createdAt: Date;

  @belongsTo(() => UserMigrationV7, "userId", { onDelete: "cascade" })
  declare user: UserMigrationV7;

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
