import {
  belongsTo,
  column,
  index,
  manyToMany,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { TagMigration } from "./tag";
import { UserMigrationV9 } from "./user_v9";

/**
 * Post v9: Add timestamp with timezone
 * Tests: columnsToAdd with withTimezone
 */
@index(["title", "createdAt"], "idx_schema_diff_posts_title_created")
export class PostMigrationV9 extends Model {
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

  @belongsTo(() => UserMigrationV9, "userId", { onDelete: "cascade" })
  declare user: UserMigrationV9;

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
