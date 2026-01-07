import {
  belongsTo,
  column,
  manyToMany,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { TagMigration } from "./tag";
import { UserMigrationV5 } from "./user_v5";

/**
 * Post v5: Add manyToMany through PostTag -> Tag
 * Tests: relationsToAdd (M2M)
 */
export class PostMigrationV5 extends Model {
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

  @belongsTo(() => UserMigrationV5, "userId", { onDelete: "cascade" })
  declare user: UserMigrationV5;

  @manyToMany(() => TagMigration, "schema_diff_post_tags", {
    leftForeignKey: "postId",
    rightForeignKey: "tagId",
  })
  declare tags: TagMigration[];
}
