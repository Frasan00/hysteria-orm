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

    // CockroachDB doesn't support multiple alter table statements
    if (this.dbType === "cockroachdb") {
      this.schema.dropTable(table);
      return;
    }

    this.schema.alterTable(table, (tab) => {
      tab.addColumn((col) => col.integer("a").notNullable().default(1));

      tab.alterColumn((col) =>
        col.varchar("a").notNullable().default("x").unique(),
      );

      tab.renameColumn("a", "a_renamed");

      tab.dropDefault("a_renamed");
      if (this.dbType !== "cockroachdb") {
        tab.dropUnique("a");
      }

      tab.alterColumn((col) =>
        col.varchar("a_renamed").notNullable().default("x").unique({
          constraintName: "uniq_agetest",
        }),
      );

      tab.alterColumn((col) =>
        col.bigint("parent_id").foreignKey(`${table}.id`),
      );

      if (this.dbType !== "cockroachdb") {
        tab.dropConstraint("uniq_agetest");
      }

      tab.dropForeignKey("parent_id", "id");
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

    const tablePk = "__test_methods_pk";
    this.schema.createTable(tablePk, (t) => {
      t.bigint("id");
      t.varchar("dummy");
    });

    this.schema.dropTable(tablePk);
  }

  async down() {}
}
