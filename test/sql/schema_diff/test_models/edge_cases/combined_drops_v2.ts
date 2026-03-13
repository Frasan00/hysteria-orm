import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const CombinedDropsV2 = defineModel("schema_diff_combined", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    status: col.string({ length: 20 }),
    description: col.text({ nullable: true }),
  },
  indexes: [],
  checks: [],
});
