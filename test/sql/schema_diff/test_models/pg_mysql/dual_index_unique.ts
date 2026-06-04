import { col, defineModel } from "../../../../../src/sql/models/define_model";

/**
 * Same column, both indexed and unique.
 * v1: plain index + unique on email
 * v2: drop the index, keep unique
 * v3: drop unique, add composite unique on (email, name)
 */
export const DualIndexUniqueV1 = defineModel(
  "schema_diff_pgmy_dual_index_unique",
  {
    columns: {
      id: col.bigIncrement(),
      email: col.string({ length: 255 }),
      name: col.string({ length: 100 }),
    },
    indexes: [{ name: "idx_email_v1", columns: ["email"] }],
    uniques: [{ name: "uq_email_v1", columns: ["email"] }],
  },
);

export const DualIndexUniqueV2 = defineModel(
  "schema_diff_pgmy_dual_index_unique",
  {
    columns: {
      id: col.bigIncrement(),
      email: col.string({ length: 255 }),
      name: col.string({ length: 100 }),
    },
    uniques: [{ name: "uq_email_v1", columns: ["email"] }],
  },
);

export const DualIndexUniqueV3 = defineModel(
  "schema_diff_pgmy_dual_index_unique",
  {
    columns: {
      id: col.bigIncrement(),
      email: col.string({ length: 255 }),
      name: col.string({ length: 100 }),
    },
    indexes: [{ name: "idx_email_v1", columns: ["email"] }],
    uniques: [{ name: "uq_email_name_v3", columns: ["email", "name"] }],
  },
);
