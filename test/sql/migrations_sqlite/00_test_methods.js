import { Migration } from "../../../lib/index.js";

export default class extends Migration {
  async up() {
    const table = "__test_methods_temp";

    this.schema.createTable(table, (t) => {
      t.increment("id");
      t.varchar("name", 255);
      t.integer("age");
      t.timestamp("created_at");
      t.timestamp("updated_at");
    });

    this.schema.alterTable(table, (tab) => {
      tab.addColumn((col) => col.integer("a").notNullable().default(1));
      tab.renameColumn("a", "a_renamed");
      tab.dropColumn("a_renamed");
    });

    this.schema.createIndex(table, ["name"], {
      constraintName: "idx_name_test",
    });
    this.schema.dropIndex("idx_name_test", table);

    this.schema.renameTable(table, `${table}_renamed`);
    this.schema.renameTable(`${table}_renamed`, table);

    this.schema.rawQuery(`ALTER TABLE ${table} ADD COLUMN tmp_col INTEGER`);
    this.schema.rawQuery(`ALTER TABLE ${table} DROP COLUMN tmp_col`);

    this.schema.dropTable(table);
  }

  async down() {}
}
