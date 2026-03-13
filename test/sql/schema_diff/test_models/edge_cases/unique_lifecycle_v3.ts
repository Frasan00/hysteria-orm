import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const UniqueLifecycleV3 = defineModel("schema_diff_unique_lifecycle", {
  columns: {
    id: col.bigIncrement(),
    email: col.string({ length: 255 }),
    username: col.string({ length: 100 }),
    code: col.string({ length: 50 }),
  },
  uniques: [
    { columns: ["email"], name: "uq_sd_ul_email" },
    { columns: ["email", "code"], name: "uq_sd_ul_email_code" },
  ],
});
