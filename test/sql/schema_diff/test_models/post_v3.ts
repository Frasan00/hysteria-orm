import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../src/sql/models/define_model";
import { UserMigrationV3 } from "./user_v3";

/**
 * Post v3: Add second belongsTo - editorId -> User
 * Tests: relationsToAdd
 */
export const PostMigrationV3 = defineModel("schema_diff_posts", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    content: col.text({ nullable: true }),
    userId: col.bigInteger(),
    editorId: col.bigInteger({ nullable: true }),
  },
});

export const PostMigrationV3Relations = defineRelations(
  PostMigrationV3,
  ({ belongsTo }) => ({
    user: belongsTo(UserMigrationV3, {
      foreignKey: "userId",
      onDelete: "cascade",
    }),
    editor: belongsTo(UserMigrationV3, {
      foreignKey: "editorId",
      onDelete: "set null",
    }),
  }),
);

createSchema(
  { PostMigrationV3 },
  { PostMigrationV3: PostMigrationV3Relations },
);
