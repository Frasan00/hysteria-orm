import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const TypeChangeV3 = defineModel("schema_diff_type_change", {
  columns: {
    id: col.bigIncrement(),
    count: col.integer(),
    price: col.text(),
    status: col.text(),
  },
});
