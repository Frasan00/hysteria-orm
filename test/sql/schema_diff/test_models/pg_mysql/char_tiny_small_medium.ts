import { col, defineModel } from "../../../../../src/sql/models/define_model";

/**
 * Fixed-width + small/medium integer family.
 * v1: char(4), tinyint, smallint, mediumint, ulid
 * v2: char length 8, mediumint removed, ulid -> uuid
 */
export const CharTinySmallMediumV1 = defineModel(
  "schema_diff_pgmy_char_tiny_small",
  {
    columns: {
      id: col.bigIncrement(),
      code: col.char({ length: 4 }),
      t: col.tinyint(),
      s: col.smallint(),
      m: col.mediumint(),
      u: col.ulid(),
    },
  },
);

export const CharTinySmallMediumV2 = defineModel(
  "schema_diff_pgmy_char_tiny_small",
  {
    columns: {
      id: col.bigIncrement(),
      code: col.char({ length: 8 }),
      t: col.tinyint(),
      s: col.smallint(),
      u: col.uuid(),
    },
  },
);
