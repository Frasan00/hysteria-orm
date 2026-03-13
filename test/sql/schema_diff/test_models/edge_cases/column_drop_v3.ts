import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const ColumnDropV3 = defineModel("schema_diff_col_drop", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    website: col.string({ length: 500 }),
  },
});
