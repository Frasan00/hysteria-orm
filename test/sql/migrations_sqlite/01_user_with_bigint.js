import { Migration } from "../../../lib/index.js";

export default class extends Migration {
  async up() {
    this.schema.createTable("users_with_bigint", (table) => {
      table.bigSerial("id");
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

    this.afterMigration = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return;
    };
  }

  async down() {
    this.schema.alterTable("users_with_bigint", (table) => {
      table.addEnumColumn("status_2", ["active", "inactive"]);
      table.addDateColumn("birth_date_2", "timestamp");
      table.addColumn("is_admin", "boolean", {
        default: false,
        autoIncrement: false,
      });
    });

    this.schema.dropTable("users_with_bigint");
  }
}
