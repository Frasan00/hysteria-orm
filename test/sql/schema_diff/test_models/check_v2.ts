import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * Check v2: Add a second CHECK constraint (status validation)
 * Tests: checksToAdd on existing table
 */
export const CheckModelV2 = defineModel("schema_diff_check_items", {
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
    {
      expression: "status IN ('active', 'inactive', 'banned')",
      name: "chk_schema_diff_check_items_status_valid",
    },
  ],
});
