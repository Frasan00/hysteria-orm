import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const LargeV1 = defineModel("schema_diff_large", {
  columns: {
    id: col.bigIncrement(),
    col1: col.string({ length: 100 }),
    col2: col.string({ length: 255 }),
    col3: col.text({ nullable: true }),
    col4: col.integer(),
    col5: col.bigInteger(),
    col6: col.boolean({ default: false }),
    col7: col.decimal({ precision: 10, scale: 2 }),
    col8: col.float({ nullable: true }),
    col9: col.json({ nullable: true }),
    col10: col.date({ nullable: true }),
    col11: col.timestamp({ nullable: true }),
    col12: col.string({ length: 50, default: "pending" }),
    col13: col.integer({ default: 0 }),
    col14: col.string({ length: 500, nullable: true }),
    col15: col.boolean({ default: true }),
    col16: col.string({ length: 36, nullable: true }),
    col17: col.integer({ nullable: true }),
    col18: col.string({ length: 100, nullable: true }),
    col19: col.bigInteger({ nullable: true }),
    col20: col.string({ length: 255, nullable: true }),
  },
});
