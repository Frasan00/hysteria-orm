import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const CheckDropExtremeV2 = defineModel("schema_diff_chk_extreme", {
  columns: {
    id: col.bigIncrement(),
    age: col.integer(),
    status: col.string({ length: 20 }),
    price: col.decimal({ precision: 10, scale: 2 }),
    quantity: col.integer(),
  },
  checks: [],
});
