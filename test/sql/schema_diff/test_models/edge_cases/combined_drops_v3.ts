import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const CombinedDropsV3 = defineModel("schema_diff_combined", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    status: col.string({ length: 20 }),
    description: col.text({ nullable: true }),
  },
  indexes: [{ columns: ["status"], name: "idx_cd_status" }],
  checks: [
    {
      expression: "status IN ('active', 'inactive', 'pending')",
      name: "chk_cd_active",
    },
  ],
});
