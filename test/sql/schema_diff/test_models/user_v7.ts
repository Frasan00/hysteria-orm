import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * User v7: Modify column bio nullable -> not nullable
 * Tests: columnsToModify (nullable change)
 */
export const UserMigrationV7 = defineModel("schema_diff_users", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    email: col.string({ length: 255 }),
    age: col.bigInteger(),
    bio: col.string({ length: 500, nullable: false }),
  },
  indexes: [{ columns: ["name"], name: "idx_schema_diff_users_name" }],
  uniques: [{ columns: ["email"], name: "uq_schema_diff_users_email" }],
});
