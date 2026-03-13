import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const DbNameV1 = defineModel("schema_diff_db_name", {
  columns: {
    id: col.bigIncrement(),
    myField: col.string({ length: 255, databaseName: "my_custom_field" }),
  },
});
