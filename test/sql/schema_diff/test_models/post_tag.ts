import {
  belongsTo,
  column,
} from "../../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../../src/sql/models/model";
import { PostMigrationV5 } from "./post_v5";
import { TagMigration } from "./tag";

/**
 * PostTag pivot model for manyToMany relation testing
 * This model explicitly defines the pivot table structure
 */
export class PostTagMigration extends Model {
  static table = "schema_diff_post_tags";

  @column({ type: "bigint" })
  declare postId: number;

  @column({ type: "bigint" })
  declare tagId: number;

  @belongsTo(() => PostMigrationV5, "postId")
  declare post: PostMigrationV5;

  @belongsTo(() => TagMigration, "tagId")
  declare tag: TagMigration;
}
