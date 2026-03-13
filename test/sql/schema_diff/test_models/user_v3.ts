import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * User v3: Modify column age from integer to bigint
 * Tests: columnsToModify (type change)
 */
export const UserMigrationV3 = defineModel("schema_diff_users", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    email: col.string({ length: 255 }),
    age: col.bigInteger(),
  },
});
