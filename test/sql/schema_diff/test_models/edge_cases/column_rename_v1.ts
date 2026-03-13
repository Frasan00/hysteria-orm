import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const ColumnRenameV1 = defineModel("schema_diff_col_rename", {
  columns: {
    id: col.bigIncrement(),
    firstName: col.string({ length: 255 }),
    lastName: col.string({ length: 255 }),
  },
});
