import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const UniqueModifyV3 = defineModel("schema_diff_uq_modify", {
  columns: {
    id: col.bigIncrement(),
    email: col.string({ length: 255 }),
    username: col.string({ length: 100 }),
    phone: col.string({ length: 20 }),
  },
  uniques: [{ columns: ["email", "username"], name: "uq_um_email_username" }],
});
