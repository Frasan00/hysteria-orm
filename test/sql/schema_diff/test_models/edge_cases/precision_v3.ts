import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const PrecisionV3 = defineModel("schema_diff_precision", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 50 }),
    amount: col.decimal({ precision: 12, scale: 4 }),
  },
});
