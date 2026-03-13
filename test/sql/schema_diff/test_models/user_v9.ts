import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * User v9: Modify default value on bio (set a default string)
 * Tests: columnsToModify (default change)
 */
export const UserMigrationV9 = defineModel("schema_diff_users", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    email: col.string({ length: 255 }),
    age: col.bigInteger(),
    bio: col.string({
      length: 500,
      default: "No bio provided",
      nullable: false,
    }),
    metadata: col.json<Record<string, unknown>>({ nullable: true }),
  },
  indexes: [{ columns: ["name"], name: "idx_schema_diff_users_name" }],
  uniques: [{ columns: ["email"], name: "uq_schema_diff_users_email" }],
});
