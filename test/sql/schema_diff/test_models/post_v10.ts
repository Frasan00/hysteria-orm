import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../src/sql/models/define_model";
import { TagMigration } from "./tag";
import { UserMigrationV10 } from "./user_v10";

/**
 * Post v10: Add unique constraint on [userId, title]
 * Tests: uniquesToAdd (composite)
 */
export const PostMigrationV10 = defineModel("schema_diff_posts", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    content: col.text({ nullable: true }),
    userId: col.bigInteger(),
    editorId: col.bigInteger({ nullable: true }),
    createdAt: col.datetime({ autoCreate: true }),
    rating: col.decimal({ precision: 10, scale: 2, nullable: true }),
    publishedAt: col.timestamp({ withTimezone: true, nullable: true }),
  },
  indexes: [
    {
      columns: ["title", "createdAt"],
      name: "idx_schema_diff_posts_title_created",
    },
  ],
  uniques: [
    { columns: ["userId", "title"], name: "uq_schema_diff_posts_user_title" },
  ],
});

export const PostMigrationV10Relations = defineRelations(
  PostMigrationV10,
  ({ belongsTo, manyToMany }) => ({
    user: belongsTo(UserMigrationV10, {
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
  { PostMigrationV10 },
  { PostMigrationV10: PostMigrationV10Relations },
);
