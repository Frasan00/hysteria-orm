import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const IndexCompositeV2 = defineModel("schema_diff_idx_composite", {
  columns: {
    id: col.bigIncrement(),
    colA: col.string({ length: 255 }),
    colB: col.string({ length: 255 }),
    colC: col.string({ length: 255 }),
    colD: col.string({ length: 255 }),
  },
  indexes: [
    { columns: ["colA"], name: "idx_ic_a" },
    { columns: ["colC"], name: "idx_ic_c" },
  ],
});
