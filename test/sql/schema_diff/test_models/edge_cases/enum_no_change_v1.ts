import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const EnumNoChangeV1 = defineModel("schema_diff_enum_no_change_test", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 100 }),
    status: col.enum(["active", "inactive", "pending"] as const),
  },
});
