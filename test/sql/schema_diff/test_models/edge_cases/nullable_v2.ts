import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const NullableV2 = defineModel("schema_diff_nullable", {
  columns: {
    id: col.bigIncrement(),
    field1: col.string({ length: 255, nullable: true }),
    field2: col.string({ length: 255, nullable: false }),
    field3: col.string({ length: 255, nullable: false }),
  },
});
