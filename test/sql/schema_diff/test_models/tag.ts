import { col, defineModel } from "../../../../src/sql/models/define_model";

/**
 * Tag model for manyToMany relation testing
 */
export const TagMigration = defineModel("schema_diff_tags", {
  columns: {
    id: col.bigIncrement(),
    name: col.string({ length: 100 }),
    slug: col.string({ length: 50, nullable: true }),
  },
});
