import { Migration } from "../../../src/sql/migrations/migration";

export default class extends Migration {
  async up() {
    const table = "temp_test";

    this.schema.createTable(table, (t) => {
      t.bigint("id").primaryKey().increment();
      t.bigint("parent_id").nullable();
      t.varchar("name", 255);
      t.varchar("email", 255).unique();
      t.integer("age");
      t.decimal("balance", 10, 2);
      t.boolean("active");
      t.timestamp("created_at", { withTimezone: true });
      t.timestamp("updated_at", { withTimezone: true, precision: 2 });
      t.timestamp("deleted_at").default(null).nullable();
    });

    this.schema.runFile("test/sql/test.sql");

    this.schema.createIndex(table, ["name"], {
      constraintName: "idx_name_test",
    });
    this.schema.dropIndex("idx_name_test", table);

    this.schema.addUnique(table, ["name"]);
    this.schema.dropUnique(table, ["name"]);

    this.schema.dropTable(table);

    const tablePk = "__test_methods_pk";
    this.schema.createTable(tablePk, (t) => {
      t.bigint("id");
      t.varchar("dummy");
    });

    this.schema.dropTable(tablePk);
  }

  async down() {
    this.schema.dropTable("temp_test", true);
    this.schema.dropTable("__test_methods_pk", true);
  }
}
