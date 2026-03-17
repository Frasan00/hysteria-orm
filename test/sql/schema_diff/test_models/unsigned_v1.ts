import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * Unsigned v1: Basic table with unsigned columns
 * - id (bigIncrement)
 * - quantity (integer unsigned)
 * - price (decimal unsigned)
 * - small_count (tinyint unsigned)
 */
export const UnsignedV1 = defineModel("schema_diff_unsigned", {
  columns: {
    id: col.bigIncrement(),
    quantity: col.integer({ unsigned: true }),
    price: col.decimal({ precision: 10, scale: 2, unsigned: true }),
    smallCount: col.tinyint({ unsigned: true }),
  },
});
