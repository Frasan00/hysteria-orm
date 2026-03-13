import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const CustomTypeV1 = defineModel("schema_diff_custom_type", {
  columns: {
    id: col.bigIncrement(),
    embedding: col<string>({ type: "varchar", length: 255 }),
    metadata: col.string({ length: 500 }),
  },
});
