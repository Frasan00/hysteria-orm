import {
  col,
  createSchema,
  defineModel,
  defineRelations,
} from "../../../../src/sql/models/define_model";
import { UserMigrationV1 } from "./user_v1";

/**
 * Post v1: Create table with belongsTo User (userId)
 * Tests: tablesToAdd, relationsToAdd
 */
export const PostMigrationV1 = defineModel("schema_diff_posts", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    content: col.text({ nullable: true }),
    userId: col.bigInteger(),
  },
});

export const PostMigrationV1Relations = defineRelations(
  PostMigrationV1,
  ({ belongsTo }) => ({
    user: belongsTo(UserMigrationV1, { foreignKey: "userId" }),
  }),
);

createSchema(
  { PostMigrationV1 },
  { PostMigrationV1: PostMigrationV1Relations },
);
