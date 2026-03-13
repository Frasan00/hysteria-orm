import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../src/sql/models/define_model";
import { PostMigrationV5 } from "./post_v5";
import { TagMigration } from "./tag";

/**
 * PostTag pivot model for manyToMany relation testing
 * This model explicitly defines the pivot table structure
 */
export const PostTagMigration = defineModel("schema_diff_post_tags", {
  columns: {
    postId: col.bigInteger(),
    tagId: col.bigInteger(),
  },
});

export const PostTagMigrationRelations = defineRelations(
  PostTagMigration,
  ({ belongsTo }) => ({
    post: belongsTo(PostMigrationV5, { foreignKey: "postId" }),
    tag: belongsTo(TagMigration, { foreignKey: "tagId" }),
  }),
);

createSchema(
  { PostTagMigration },
  { PostTagMigration: PostTagMigrationRelations },
);
