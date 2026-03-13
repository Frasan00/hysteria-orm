import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const TzV3 = defineModel("schema_diff_tz", {
  columns: {
    id: col.bigIncrement(),
    createdAt: col.timestamp({ withTimezone: false }),
  },
});
