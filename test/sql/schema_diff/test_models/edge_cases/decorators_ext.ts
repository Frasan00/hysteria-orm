import { col, defineModel } from "../../../../../src/sql/models/define_model";

export const DecoratorsExtModel = defineModel("schema_diff_decorators_ext", {
  columns: {
    id: col.bigIncrement(),
    strCol: col.string({ length: 150 }),
    textCol: col.text({ nullable: true }),
    intCol: col.integer(),
    bigintCol: col.bigInteger({ nullable: true }),
    floatCol: col.float({ nullable: true }),
    decCol: col.decimal({ precision: 12, scale: 3 }),
    boolCol: col.boolean({ default: false }),
    jsonCol: col.json({ nullable: true }),
    dateCol: col.date({ nullable: true }),
    datetimeCol: col.datetime({ nullable: true }),
    tsCol: col.timestamp({ nullable: true }),
    timeCol: col.time({ nullable: true }),
    binCol: col.binary({ nullable: true }),
    uuidCol: col.uuid({ nullable: true }),
  },
});
