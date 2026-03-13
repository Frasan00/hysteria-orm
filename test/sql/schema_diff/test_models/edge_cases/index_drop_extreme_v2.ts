import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const IndexDropExtremeV2 = defineModel("schema_diff_idx_extreme", {
  columns: {
    id: col.bigIncrement(),
    colA: col.string({ length: 255 }),
    colB: col.string({ length: 255 }),
    colC: col.string({ length: 255 }),
  },
  indexes: [],
});
