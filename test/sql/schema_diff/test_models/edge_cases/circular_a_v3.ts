import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const CircularAV3 = defineModel("schema_diff_circular_a", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 255 }),
    bId: col.bigInteger(),
  },
});
