import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../src/sql/models/define_model";
import { TagMigration } from "./tag";
import { UserMigrationV6 } from "./user_v6";

/**
 * Post v6: Add onDelete CASCADE to manyToMany
 * Tests: relationsToModify
 */
export const PostMigrationV6 = defineModel("schema_diff_posts", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    content: col.text({ nullable: true }),
    userId: col.bigInteger(),
    editorId: col.bigInteger({ nullable: true }),
  },
});

export const PostMigrationV6Relations = defineRelations(
  PostMigrationV6,
  ({ belongsTo, manyToMany }) => ({
    user: belongsTo(UserMigrationV6, {
      foreignKey: "userId",
      onDelete: "cascade",
    }),
    tags: manyToMany(TagMigration, {
      through: "schema_diff_post_tags",
      leftForeignKey: "postId",
      rightForeignKey: "tagId",
      onDelete: "cascade",
    }),
  }),
);

createSchema(
  { PostMigrationV6 },
  { PostMigrationV6: PostMigrationV6Relations },
);
