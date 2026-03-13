import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * Check v1: Table with a single CHECK constraint (age >= 0)
 * Tests: checksToAdd on new table creation
 */
export const CheckModelV1 = defineModel("schema_diff_check_items", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    age: col.integer(),
    status: col.string({ length: 20, default: "active" }),
  },
  checks: [
    {
      expression: "age >= 0",
      name: "chk_schema_diff_check_items_age_positive",
    },
  ],
});
