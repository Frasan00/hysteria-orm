import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const NullableV3 = defineModel("schema_diff_nullable", {
  columns: {
    id: col.bigIncrement(),
    field1: col.string({ length: 255, nullable: false }),
    field2: col.string({ length: 255, nullable: true }),
    field3: col.string({ length: 255, nullable: false }),
  },
});
