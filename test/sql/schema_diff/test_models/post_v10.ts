import {
  belongsTo,
  column,
  index,
  manyToMany,
  unique,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { TagMigration } from "./tag";
import { UserMigrationV10 } from "./user_v10";

/**
 * Post v10: Add unique constraint on [userId, title]
 * Tests: uniquesToAdd (composite)
 */
@index(["title", "createdAt"], "idx_schema_diff_posts_title_created")
@unique(["userId", "title"], "uq_schema_diff_posts_user_title")
export class PostMigrationV10 extends Model {
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

  @column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  declare rating: number | null;

  @column({ type: "timestamp", withTimezone: true, nullable: true })
  declare publishedAt: Date | null;

  @belongsTo(() => UserMigrationV10, "userId", { onDelete: "cascade" })
  declare user: UserMigrationV10;

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
