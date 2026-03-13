import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const DefaultV5 = defineModel("schema_diff_defaults", {
  columns: {
    id: col.bigIncrement(),
    status: col.string({ length: 50, default: "" }),
    count: col.integer({ default: 0 }),
    flag: col.boolean({ default: false }),
  },
});
