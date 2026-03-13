import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../src/sql/models/define_model";
import { UserMigrationV2 } from "./user_v2";

/**
 * Post v2: Modify relation - add onDelete CASCADE
 * Tests: relationsToModify
 */
export const PostMigrationV2 = defineModel("schema_diff_posts", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    content: col.text({ nullable: true }),
    userId: col.bigInteger(),
  },
});

export const PostMigrationV2Relations = defineRelations(
  PostMigrationV2,
  ({ belongsTo }) => ({
    user: belongsTo(UserMigrationV2, {
      foreignKey: "userId",
      onDelete: "cascade",
    }),
  }),
);

createSchema(
  { PostMigrationV2 },
  { PostMigrationV2: PostMigrationV2Relations },
);
