import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const DefaultV4 = defineModel("schema_diff_defaults", {
  columns: {
    id: col.bigIncrement(),
    status: col.string({ length: 50, default: "pending" }),
    count: col.integer({ default: 42 }),
    flag: col.boolean({ default: true }),
  },
});
