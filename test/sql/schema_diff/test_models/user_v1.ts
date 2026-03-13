import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * User v1: Basic table creation
 * - id (bigIncrement)
 * - name (varchar)
 * - email (varchar)
 */
export const UserMigrationV1 = defineModel("schema_diff_users", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    email: col.string({ length: 255 }),
  },
});
