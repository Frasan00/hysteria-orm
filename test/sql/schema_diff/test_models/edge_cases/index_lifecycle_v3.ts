import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const IndexLifecycleV3 = defineModel("schema_diff_index_lifecycle", {
  columns: {
    id: col.bigIncrement(),
    colA: col.string({ length: 255 }),
    colB: col.string({ length: 255 }),
    colC: col.string({ length: 255 }),
  },
  indexes: [{ columns: ["colB", "colC"], name: "idx_sd_il_col_b_c" }],
});
