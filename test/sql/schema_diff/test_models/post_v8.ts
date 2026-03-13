import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../src/sql/models/define_model";
import { TagMigration } from "./tag";
import { UserMigrationV8 } from "./user_v8";

/**
 * Post v8: Add column with decimal precision/scale
 * Tests: columnsToAdd with precision
 */
export const PostMigrationV8 = defineModel("schema_diff_posts", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    content: col.text({ nullable: true }),
    userId: col.bigInteger(),
    editorId: col.bigInteger({ nullable: true }),
    createdAt: col.datetime({ autoCreate: true }),
    rating: col.decimal({ precision: 10, scale: 2, nullable: true }),
  },
  indexes: [
    {
      columns: ["title", "createdAt"],
      name: "idx_schema_diff_posts_title_created",
    },
  ],
});

export const PostMigrationV8Relations = defineRelations(
  PostMigrationV8,
  ({ belongsTo, manyToMany }) => ({
    user: belongsTo(UserMigrationV8, {
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
  { PostMigrationV8 },
  { PostMigrationV8: PostMigrationV8Relations },
);
