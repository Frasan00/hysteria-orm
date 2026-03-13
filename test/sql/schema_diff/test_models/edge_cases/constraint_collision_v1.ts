import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const ConstraintCollisionV1 = defineModel("schema_diff_collision", {
  columns: {
    id: col.bigIncrement(),
    colA: col.string({ length: 255 }),
    colB: col.string({ length: 255 }),
  },
  indexes: [{ columns: ["colA"], name: "idx_collision" }],
});
