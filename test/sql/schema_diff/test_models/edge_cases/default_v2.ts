import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const DefaultV2 = defineModel("schema_diff_defaults", {
  columns: {
    id: col.bigIncrement(),
    status: col.string({ length: 50, default: "inactive" }),
    count: col.integer({ default: 10 }),
    flag: col.boolean({ default: false }),
  },
});
