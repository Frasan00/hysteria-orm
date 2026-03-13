import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const FkDropMultipleV3 = defineModel("schema_diff_fk_multiple", {
  columns: {
    id: col.bigIncrement(),
    title: col.string({ length: 255 }),
    createdById: col.bigInteger(),
    updatedById: col.bigInteger(),
    approvedById: col.bigInteger(),
  },
});
