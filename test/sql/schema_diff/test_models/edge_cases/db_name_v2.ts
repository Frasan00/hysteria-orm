import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const DbNameV2 = defineModel("schema_diff_db_name", {
  columns: {
    id: col.bigIncrement(),
    myField: col.text({ databaseName: "my_custom_field" }),
    anotherField: col.integer({
      nullable: true,
      databaseName: "another_custom_col",
    }),
  },
});
