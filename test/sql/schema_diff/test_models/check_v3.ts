import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * Check v3: Remove the age check, keep only the status check
 * Tests: checksToDrop for removed constraint
 */
export const CheckModelV3 = defineModel("schema_diff_check_items", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    age: col.integer(),
    status: col.string({ length: 20, default: "active" }),
  },
  checks: [
    {
      expression: "status IN ('active', 'inactive', 'banned')",
      name: "chk_schema_diff_check_items_status_valid",
    },
  ],
});
