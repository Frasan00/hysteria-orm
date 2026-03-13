import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const SpecialTypesV1 = defineModel("schema_diff_special_types", {
  columns: {
    id: col.bigIncrement(),
    flag: col.boolean({ default: false }),
    data: col.binary({ nullable: true }),
    notes: col.text(),
  },
});
