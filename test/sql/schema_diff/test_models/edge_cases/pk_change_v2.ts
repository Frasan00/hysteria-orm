import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const PkChangeV2 = defineModel("schema_diff_pk_change", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
  },
});
