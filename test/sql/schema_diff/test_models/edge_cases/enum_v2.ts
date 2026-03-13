import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const EnumV2 = defineModel("schema_diff_enum_test", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 100 }),
    status: col.enum(["active", "inactive", "pending"] as const),
  },
});
