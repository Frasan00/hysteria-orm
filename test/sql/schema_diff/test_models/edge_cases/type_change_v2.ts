import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const TypeChangeV2 = defineModel("schema_diff_type_change", {
  columns: {
    id: col.bigIncrement(),
    count: col.bigInteger(),
    price: col.string({ length: 255 }),
    status: col.text(),
  },
});
