import { Migration } from "../../../../lib/index.js";

export default class extends Migration {
  async up() {
    this.schema.createTable("users_with_bigint", (table) => {
      table.bigint("id").primaryKey().increment();
      table.varchar("name");
      table.varchar("email").unique();
      table.varchar("password");
      table.integer("age");
      table.decimal("salary", 10, 2);
      table.char("gender", 1);
      table.binary("image").nullable();
      table.float("height");
      table.text("description");
      table.text("short_description");
      table.double("weight");
      table.date("birth_date");
      table.jsonb("json");
      table.boolean("is_active");
      table.enum("status", ["active", "inactive"]);
      table.timestamp("created_at", { withTimezone: true });
      table.timestamp("updated_at", { withTimezone: true });
      table.timestamp("deleted_at").default("NULL").nullable();
    });

    this.schema.alterTable("users_with_bigint", (table) => {
      table.addColumn((col) =>
        col.integer("test").notNullable().default(1).after("id"),
      );
      table.alterColumn((col) =>
        col.varchar("test").notNullable().default("test"),
      );
      table.renameColumn("test", "test_2");
      table.dropColumn("test_2");
    });

    this.schema.createIndex("users_with_bigint", ["name"], "test_index");
    this.schema.dropIndex("test_index", "users_with_bigint");
    this.schema.renameTable("users_with_bigint", "users_with_bigint_renamed");
    this.schema.renameTable("users_with_bigint_renamed", "users_with_bigint");
    this.schema.rawQuery(
      "ALTER TABLE users_with_bigint ADD COLUMN test_2 INTEGER",
    );
    this.schema.rawQuery("ALTER TABLE users_with_bigint DROP COLUMN test_2");

    this.afterMigration = async (sqlDataSource) => {
      await sqlDataSource.query("users_with_bigint").insert({
        name: "John Doe",
        email: "john.doe@example.com",
        password: "password",
        age: 25,
        salary: 100000,
        gender: "M",
        height: 180,
        description: "John Doe is a software engineer",
        short_description: "John Doe is a software engineer",
        weight: 80,
        birth_date: new Date("1990-01-01"),
        json: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
        }),
        is_active: true,
        status: "active",
      });

      const all = await sqlDataSource.query("users_with_bigint").many();
      if (!all.length) {
        throw new Error(
          "Migration 01_user_with_bigint failed, no records found",
        );
      }

      await sqlDataSource.query("users_with_bigint").update({
        name: "Jane Doe",
      });

      const all2 = await sqlDataSource.query("users_with_bigint").many();
      if (all2.length !== 1) {
        throw new Error("Migration 01_user_with_bigint failed, records found");
      }

      await sqlDataSource.query("users_with_bigint").delete();

      const all3 = await sqlDataSource.query("users_with_bigint").many();
      if (all3.length) {
        throw new Error("Migration 01_user_with_bigint failed, records found");
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      return;
    };
  }

  async down() {
    this.schema.dropTable("users_with_bigint");
    this.afterMigration = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return;
    };
  }
}
