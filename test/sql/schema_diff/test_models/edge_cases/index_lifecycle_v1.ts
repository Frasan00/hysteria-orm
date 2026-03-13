import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const IndexLifecycleV1 = defineModel("schema_diff_index_lifecycle", {
  columns: {
    id: col.bigIncrement(),
    colA: col.string({ length: 255 }),
    colB: col.string({ length: 255 }),
    colC: col.string({ length: 255 }),
  },
});
