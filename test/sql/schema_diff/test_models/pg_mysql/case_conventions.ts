import { col, defineModel } from "../../../../../src/sql/models/define_model";

/**
 * Case convention interaction family.
 * Model: camelCase property names, database: snake_case column names.
 * v1 + v2 share conventions; v2 adds a new camelCase field to verify
 * the snake_case derivation picks it up correctly.
 */
export const CaseConventionsV1 = defineModel("schema_diff_pgmy_case_conv", {
  columns: {
    id: col.bigIncrement(),
    firstName: col.string({ length: 50 }),
    lastName: col.string({ length: 50 }),
  },
  options: {
    modelCaseConvention: "camel",
    databaseCaseConvention: "snake",
  },
});

export const CaseConventionsV2 = defineModel("schema_diff_pgmy_case_conv", {
  columns: {
    id: col.bigIncrement(),
    firstName: col.string({ length: 50 }),
    lastName: col.string({ length: 50 }),
    emailAddress: col.string({ length: 255 }),
  },
  options: {
    modelCaseConvention: "camel",
    databaseCaseConvention: "snake",
  },
});
