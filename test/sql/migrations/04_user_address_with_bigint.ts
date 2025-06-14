import { Migration } from "../../../../lib/index.js";

export default class extends Migration {
  async up() {
    this.schema.createTable("user_address_with_bigint", (table) => {
      table.bigSerial("id").primary();
      table.bigInteger("user_id").references("users_with_bigint", "id");
      table.bigInteger("address_id").references("address_with_bigint", "id");

      table.timestamp("created_at");
      table.timestamp("updated_at");
      table.timestamp("deleted_at").default(null).nullable();
    });

    this.schema.alterTable("user_address_with_bigint", (table) => {
      table.addColumn("test_bigint", "bigint", {
        notNullable: true,
      });

      table.addForeignKey("test_bigint", {
        references: {
          table: "users_with_bigint",
          column: "id",
          constraintName: "user_address_with_bigint_test_bigint_fk",
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
      });

      table.dropForeignKey(
        "test_bigint",
        "user_address_with_bigint_test_bigint_fk",
      );

      table.dropColumn("test_bigint");
    });
  }

  async down() {
    this.schema.dropTable("user_address_with_bigint");
  }
}
