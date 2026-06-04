import { col, defineModel } from "../../../../../src/sql/models/define_model";

/**
 * Datetime/timestamp/time family.
 * v1: datetime (native), timestamp with autoCreate+autoUpdate, time native
 * v2: change datetime -> datetime.string() (string-typed variant)
 */
export const DatetimeTimestampTimeV1 = defineModel("schema_diff_pgmy_dtt", {
  columns: {
    id: col.bigIncrement(),
    d: col.datetime(),
    ts: col.timestamp({ autoCreate: true, autoUpdate: true }),
    t: col.time(),
  },
});

export const DatetimeTimestampTimeV2 = defineModel("schema_diff_pgmy_dtt", {
  columns: {
    id: col.bigIncrement(),
    d: col.datetime.string(),
    ts: col.timestamp({ autoCreate: true, autoUpdate: true }),
    t: col.time(),
  },
});
