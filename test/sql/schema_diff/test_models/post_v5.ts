import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../src/sql/models/define_model";
import { TagMigration } from "./tag";
import { UserMigrationV5 } from "./user_v5";

/**
 * Post v5: Add manyToMany through PostTag -> Tag
 * Tests: relationsToAdd (M2M)
 */
export const PostMigrationV5 = defineModel("schema_diff_posts", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    content: col.text({ nullable: true }),
    userId: col.bigInteger(),
    editorId: col.bigInteger({ nullable: true }),
  },
});

export const PostMigrationV5Relations = defineRelations(
  PostMigrationV5,
  ({ belongsTo, manyToMany }) => ({
    user: belongsTo(UserMigrationV5, {
      foreignKey: "userId",
      onDelete: "cascade",
    }),
    tags: manyToMany(TagMigration, {
      through: "schema_diff_post_tags",
      leftForeignKey: "postId",
      rightForeignKey: "tagId",
    }),
  }),
);

createSchema(
  { PostMigrationV5 },
  { PostMigrationV5: PostMigrationV5Relations },
);
