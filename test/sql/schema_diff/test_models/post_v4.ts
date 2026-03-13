import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../src/sql/models/define_model";
import { UserMigrationV4 } from "./user_v4";

/**
 * Post v4: Drop editorId relation (remove editor belongsTo but keep column)
 * Tests: relationsToDrop
 */
export const PostMigrationV4 = defineModel("schema_diff_posts", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    content: col.text({ nullable: true }),
    userId: col.bigInteger(),
    editorId: col.bigInteger({ nullable: true }),
  },
});

export const PostMigrationV4Relations = defineRelations(
  PostMigrationV4,
  ({ belongsTo }) => ({
    user: belongsTo(UserMigrationV4, {
      foreignKey: "userId",
      onDelete: "cascade",
    }),
  }),
);

createSchema(
  { PostMigrationV4 },
  { PostMigrationV4: PostMigrationV4Relations },
);
