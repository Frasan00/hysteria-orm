import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../src/sql/models/define_model";
import { TagMigration } from "./tag";
import { UserMigrationV9 } from "./user_v9";

/**
 * Post v9: Add timestamp with timezone
 * Tests: columnsToAdd with withTimezone
 */
export const PostMigrationV9 = defineModel("schema_diff_posts", {
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
});

export const PostMigrationV9Relations = defineRelations(
  PostMigrationV9,
  ({ belongsTo, manyToMany }) => ({
    user: belongsTo(UserMigrationV9, {
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
  { PostMigrationV9 },
  { PostMigrationV9: PostMigrationV9Relations },
);
