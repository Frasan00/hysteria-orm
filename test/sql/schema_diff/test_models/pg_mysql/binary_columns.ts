import { col, defineModel } from "../../../../../src/sql/models/define_model";

/**
 * Binary column family.
 * v1: col.binary + col.varbinary (with explicit length)
 * v2: varbinary length 200; binary flipped to nullable
 */
export const BinaryColumnsV1 = defineModel("schema_diff_pgmy_binary", {
  columns: {
    id: col.bigIncrement(),
    data: col.binary(),
    vb: col.varbinary({ length: 100 }),
  },
});

export const BinaryColumnsV2 = defineModel("schema_diff_pgmy_binary", {
  columns: {
    id: col.bigIncrement(),
    data: col.binary({ nullable: true }),
    vb: col.varbinary({ length: 200 }),
  },
});
