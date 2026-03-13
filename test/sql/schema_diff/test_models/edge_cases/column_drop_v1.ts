import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const ColumnDropV1 = defineModel("schema_diff_col_drop", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    email: col.string({ length: 255 }),
    phone: col.string({ length: 50 }),
    address: col.string({ length: 500 }),
  },
});
