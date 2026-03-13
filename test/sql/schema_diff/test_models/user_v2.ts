import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * User v2: Add column age (integer)
 * Tests: columnsToAdd
 */
export const UserMigrationV2 = defineModel("schema_diff_users", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    email: col.string({ length: 255 }),
    age: col.integer(),
  },
});
