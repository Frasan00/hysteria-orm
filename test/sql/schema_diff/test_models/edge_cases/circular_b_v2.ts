import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const CircularBV2 = defineModel("schema_diff_circular_b", {
  columns: {
    id: col.bigIncrement(),
    label: col.string({ length: 255 }),
    aId: col.bigInteger(),
  },
});
