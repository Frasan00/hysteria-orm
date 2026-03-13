import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const CheckDropExtremeV1 = defineModel("schema_diff_chk_extreme", {
  columns: {
    id: col.bigIncrement(),
    age: col.integer(),
    status: col.string({ length: 20 }),
    price: col.decimal({ precision: 10, scale: 2 }),
    quantity: col.integer(),
  },
  checks: [
    {
      expression: "age >= 0",
      name: "chk_cde_age_positive",
    },
    {
      expression: "status IN ('active', 'inactive', 'pending')",
      name: "chk_cde_status_valid",
    },
    {
      expression: "price > 0",
      name: "chk_cde_price_positive",
    },
    {
      expression: "quantity >= 0",
      name: "chk_cde_quantity_valid",
    },
  ],
});
