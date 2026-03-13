import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../src/sql/models/define_model";
import { TagMigration } from "./tag";
import { UserMigrationV7 } from "./user_v7";

/**
 * Post v7: Add composite index on [title, createdAt]
 * Tests: indexesToAdd (composite)
 */
export const PostMigrationV7 = defineModel("schema_diff_posts", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    content: col.text({ nullable: true }),
    userId: col.bigInteger(),
    editorId: col.bigInteger({ nullable: true }),
    createdAt: col.datetime({ autoCreate: true }),
  },
  indexes: [
    {
      columns: ["title", "createdAt"],
      name: "idx_schema_diff_posts_title_created",
    },
  ],
});

export const PostMigrationV7Relations = defineRelations(
  PostMigrationV7,
  ({ belongsTo, manyToMany }) => ({
    user: belongsTo(UserMigrationV7, {
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
  { PostMigrationV7 },
  { PostMigrationV7: PostMigrationV7Relations },
);
