import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const EnumV3 = defineModel("schema_diff_enum_test", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 100 }),
    status: col.enum(["active", "inactive", "pending"] as const),
    priority: col.enum(["low", "medium", "high"] as const),
  },
});
