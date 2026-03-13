import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const PrecisionV1 = defineModel("schema_diff_precision", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 100 }),
    amount: col.decimal({ precision: 8, scale: 2 }),
  },
});
