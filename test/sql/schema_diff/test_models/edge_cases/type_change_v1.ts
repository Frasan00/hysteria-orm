import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const TypeChangeV1 = defineModel("schema_diff_type_change", {
  columns: {
    id: col.bigIncrement(),
    count: col.integer(),
    price: col.string({ length: 100 }),
    status: col.string({ length: 50 }),
  },
});
