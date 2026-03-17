import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * Unsigned v3: Added zerofill columns
 * - id (bigIncrement) - unchanged
 * - quantity (integer) - unchanged
 * - price (decimal unsigned) - unchanged
 * - smallCount (tinyint unsigned) - unchanged
 * - maxValue (smallint unsigned) - unchanged
 * - order_num (integer zerofill) - new column with zerofill
 */
export const UnsignedV3 = defineModel("schema_diff_unsigned", {
  columns: {
    id: col.bigIncrement(),
    quantity: col.integer(),
    price: col.decimal({ precision: 10, scale: 2, unsigned: true }),
    smallCount: col.tinyint({ unsigned: true }),
    maxValue: col.smallint({ unsigned: true }),
    orderNum: col.integer({ zerofill: true }),
  },
});
