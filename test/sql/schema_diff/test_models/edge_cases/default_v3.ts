import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const DefaultV3 = defineModel("schema_diff_defaults", {
  columns: {
    id: col.bigIncrement(),
    status: col.string({ length: 50 }),
    count: col.integer(),
    flag: col.boolean(),
  },
});
