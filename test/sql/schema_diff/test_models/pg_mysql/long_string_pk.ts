import { col, defineModel } from "../../../../../src/sql/models/define_model";

/**
 * Long-string PK family.
 * v1: PK is uuid (string)
 * v2: PK becomes bigIncrement (number) — PK swap
 */
export const LongStringPkV1 = defineModel("schema_diff_pgmy_long_pk", {
  columns: {
    id: col.primary({ type: "uuid" }),
    name: col.string({ length: 100 }),
  },
});

export const LongStringPkV2 = defineModel("schema_diff_pgmy_long_pk", {
  columns: {
    id: col.primary({ type: "bigIncrement" }),
    name: col.string({ length: 100 }),
  },
});
