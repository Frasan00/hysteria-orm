import { Migration } from "../../../../lib/index.js";

export default class extends Migration {
  async up() {
    this.schema.createTable("users_with_bigint", (table) => {
      table.bigSerial("id").primary();
      table.string("name");
      table.string("email").unique();
      table.string("password");
      table.integer("age");
      table.decimal("salary", {
        precision: 10,
        scale: 2,
      });
      table.char("gender", 1);
      table.binary("image").nullable();
      table.float("height");
      table.longtext("description");
      table.tinytext("short_description");
      table.double("weight");
      table.date("birth_date");
      table.jsonb("json");
      table.boolean("is_active");
      table.enum("status", ["active", "inactive"]);
      table.timestamp("created_at");
      table.timestamp("updated_at");
      table.timestamp("deleted_at").default("NULL").nullable();
    });

    this.schema.alterTable("users_with_bigint", (table) => {
      table.addColumn("test", "integer", {
        notNullable: true,
        default: 1,
      });
      table.dropColumn("test");
    });

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
        json: {
          name: "John Doe",
          email: "john.doe@example.com",
        },
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
    this.schema.alterTable("users_with_bigint", (table) => {
      table.renameColumn("name", "first_name");
      table.renameColumn("email", "email_address");
      table.renameColumn("password", "pass");
      table.setDefaultValue("age", "0");
      table.addEnumColumn("status_2", ["active", "inactive"]);
      table.addDateColumn("birth_date_2", "timestamp");
      table.modifyColumnType("salary", "decimal", {
        precision: 2,
        scale: 1,
      });
      table.addColumn("is_admin", "boolean", {
        default: false,

        autoIncrement: false,
      });
    });

    this.schema.dropTable("users_with_bigint");

    this.afterMigration = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return;
    };
  }
}
