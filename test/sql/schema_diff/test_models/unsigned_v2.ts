import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * Unsigned v2: Modified unsigned columns
 * - id (bigIncrement) - unchanged
 * - quantity (integer) - removed unsigned
 * - price (decimal unsigned) - unchanged
 * - small_count (tinyint unsigned) - unchanged
 * - max_value (smallint unsigned) - new column
 */
export const UnsignedV2 = defineModel("schema_diff_unsigned", {
  columns: {
    id: col.bigIncrement(),
    quantity: col.integer(),
    price: col.decimal({ precision: 10, scale: 2, unsigned: true }),
    smallCount: col.tinyint({ unsigned: true }),
    maxValue: col.smallint({ unsigned: true }),
  },
});
