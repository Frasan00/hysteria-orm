import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const CombinedDropsV1 = defineModel("schema_diff_combined", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    status: col.string({ length: 20 }),
    notes: col.text({ nullable: true }),
  },
  indexes: [{ columns: ["name"], name: "idx_cd_name" }],
  checks: [
    {
      expression: "status IN ('active', 'inactive')",
      name: "chk_cd_status",
    },
  ],
});
