import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const CheckDropExtremeV3 = defineModel("schema_diff_chk_extreme", {
  columns: {
    id: col.bigIncrement(),
    age: col.integer(),
    status: col.string({ length: 20 }),
    price: col.decimal({ precision: 10, scale: 2 }),
    quantity: col.integer(),
  },
  checks: [
    {
      expression: "age >= 18",
      name: "chk_cde_age_adult",
    },
    {
      expression: "status IN ('active', 'inactive', 'pending', 'archived')",
      name: "chk_cde_status_extended",
    },
  ],
});
