import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const PkChangeV1 = defineModel("schema_diff_pk_change", {
  columns: {
    id: col.increment(),
    name: col.string({ length: 255 }),
  },
});
