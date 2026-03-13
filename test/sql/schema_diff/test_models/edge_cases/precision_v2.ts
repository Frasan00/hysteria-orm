import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const PrecisionV2 = defineModel("schema_diff_precision", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    amount: col.decimal({ precision: 12, scale: 4 }),
  },
});
