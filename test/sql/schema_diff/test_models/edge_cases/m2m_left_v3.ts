import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const M2mLeftV3 = defineModel("schema_diff_m2m_left", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
  },
});
