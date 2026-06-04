import { col, defineModel } from "../../../../../src/sql/models/define_model";

/**
 * Broader unsigned/zerofill coverage than the existing UnsignedV1-V3.
 * v1: bigint unsigned, decimal unsigned, tinyint unsigned, int zerofill
 * v2: drop zerofill, change bigint to plain integer
 */
export const UnsignedCombosV1 = defineModel(
  "schema_diff_pgmy_unsigned_combos",
  {
    columns: {
      id: col.bigIncrement(),
      big: col.bigInteger({ unsigned: true }),
      dec: col.decimal({ precision: 10, scale: 2, unsigned: true }),
      tiny: col.tinyint({ unsigned: true }),
      z: col.integer({ zerofill: true }),
    },
  },
);

export const UnsignedCombosV2 = defineModel(
  "schema_diff_pgmy_unsigned_combos",
  {
    columns: {
      id: col.bigIncrement(),
      big: col.bigInteger(),
      dec: col.decimal({ precision: 10, scale: 2, unsigned: true }),
      tiny: col.tinyint({ unsigned: true }),
    },
  },
);
