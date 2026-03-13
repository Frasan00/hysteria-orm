import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const IndexDropExtremeV3 = defineModel("schema_diff_idx_extreme", {
  columns: {
    id: col.bigIncrement(),
    colA: col.string({ length: 255 }),
    colB: col.string({ length: 255 }),
    colC: col.string({ length: 255 }),
  },
  indexes: [
    { columns: ["colA"], name: "idx_ide_new_a" },
    { columns: ["colB"], name: "idx_ide_new_b" },
  ],
});
