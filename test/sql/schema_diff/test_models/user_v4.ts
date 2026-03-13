import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * User v4: Add column bio (text, nullable, default null)
 * Tests: columnsToAdd with nullable/default
 */
export const UserMigrationV4 = defineModel("schema_diff_users", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    email: col.string({ length: 255 }),
    age: col.bigInteger(),
    bio: col.string({ length: 500, nullable: true, default: null }),
  },
});
