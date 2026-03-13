import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const M2mRight = defineModel("schema_diff_m2m_right", {
  columns: {
    id: col.bigIncrement(),
    tag: col.string({ length: 100 }),
  },
});
