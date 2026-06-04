import { col, defineModel } from "../../../../../src/sql/models/define_model";

/**
 * Native enum family using col.nativeEnum.
 * v1: 2 values
 * v2: 3 values
 */
export const NativeEnumV1 = defineModel("schema_diff_pgmy_native_enum", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 100 }),
    status: col.nativeEnum({ Active: "active", Inactive: "inactive" }),
  },
});

export const NativeEnumV2 = defineModel("schema_diff_pgmy_native_enum", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 100 }),
    status: col.nativeEnum({
      Active: "active",
      Inactive: "inactive",
      Pending: "pending",
    }),
  },
});
