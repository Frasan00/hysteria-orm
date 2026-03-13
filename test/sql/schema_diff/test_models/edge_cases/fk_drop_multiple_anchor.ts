import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const FkDropAnchor = defineModel("schema_diff_fk_anchor", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
  },
});
