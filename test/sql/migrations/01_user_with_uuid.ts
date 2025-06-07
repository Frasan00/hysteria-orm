import { Migration } from "../../../../lib/index.js";

export default class extends Migration {
  async up() {
    this.schema.createTable("users_with_uuid", (table) => {
      table.uuid("id").primary();
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
  }

  async down() {
    this.schema.alterTable("users_with_uuid", (table) => {
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

    this.schema.dropTable("users_with_uuid");
  }
}
