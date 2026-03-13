import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const SpecialTypesV2 = defineModel("schema_diff_special_types", {
  columns: {
    id: col.bigIncrement(),
    flag: col.boolean({ default: true }),
    data: col.binary({ nullable: true }),
    notes: col.string({ length: 500 }),
    isArchived: col.boolean({ default: false, nullable: true }),
  },
});
