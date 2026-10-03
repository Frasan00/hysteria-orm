---
title: Generate Migrations from Models
description: Diff your models against the live database and generate a migration file with the generate:migrations command.
keywords: [hysteria-orm, generate migrations, schema diff, auto migrate, CLI]
---

# Generate migrations from models

The `generate:migrations` command inspects your live database schema and your registered models, computes a diff, and writes a migration file to reconcile them.

By default the generated file uses the schema builder API (`code` mode), which mirrors how you would write a migration by hand. Switch to raw SQL with `--output raw` if you prefer.

:::warning
This command is only supported for PostgreSQL, MySQL, MariaDB, and CockroachDB.
:::

## Usage

```bash
hysteria-orm generate:migrations \
  --datasource ./database/index.ts \
  --tsconfig ./tsconfig.json \
  --migration-path ./database/migrations \
  --name add_user_fields \
  --output code
```

## Options

| Flag                          | Description                                                                     | Default                             |
| ----------------------------- | ------------------------------------------------------------------------------- | ----------------------------------- |
| `-d, --datasource <path>`     | Datasource file that default-exports a `SqlDataSource`. Required.               | —                                   |
| `-c, --tsconfig <path>`       | Path to `tsconfig.json` used to load TypeScript files.                          | `./tsconfig.json`                   |
| `-m, --migration-path <path>` | Output directory for migration files.                                           | `migrations.path` on the datasource |
| `-n, --name <name>`           | Base name for the migration. A millisecond timestamp is prefixed automatically. | `auto_generated_migration`          |
| `-j, --javascript`            | Generate a JavaScript migration file instead of TypeScript.                     | `false`                             |
| `-f, --dry`                   | Print the generated output without writing a file.                              | `false`                             |
| `-o, --output <mode>`         | Output mode: `code` for schema builder calls or `raw` for raw SQL.              | `code`                              |

## Output modes

### `--output code` (default)

Generates a migration using the schema builder API, the same API you use when writing migrations by hand. The `up()` method contains builder calls, and a `down()` method is generated automatically.

```typescript
import { Migration } from "hysteria-orm";

export default class extends Migration {
  async up() {
    this.schema.createTable("users", (table) => {
      table.increment("id").primaryKey({ constraintName: "pk_users_id" });
      table.varchar("name");
      table.varchar("email");
      table.timestamp("created_at", { withTimezone: true });
    });

    this.schema.alterTable("posts", (table) => {
      table.foreignKey("user_id", "users", "id", {
        constraintName: "fk_posts_user_id_users",
        onDelete: "cascade",
      });
    });
  }

  async down() {
    this.schema.alterTable("posts", (table) => {
      table.dropConstraint("fk_posts_user_id_users");
    });
    this.schema.dropTable("users");
  }
}
```

### `--output raw`

Generates a migration made of raw SQL strings executed through `this.schema.rawQuery(...)`. Use this when you need control over the exact SQL.

```typescript
import { Migration } from "hysteria-orm";

export default class extends Migration {
  async up() {
    this.schema.rawQuery(
      "CREATE TABLE users (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255), PRIMARY KEY (id))",
    );
    this.schema.rawQuery(
      "ALTER TABLE posts ADD CONSTRAINT fk_posts_user_id_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE",
    );
  }

  async down() {}
}
```

## Behavior

- If there are no differences, the command logs `No new changes detected between database schema and models metadata` and exits with code 0.
- On differences, it writes `<timestamp>(_auto_generated_migration|{name}).(ts|js)` to the output directory, creating the directory if needed.
- With `--dry`, the generated code or SQL is printed to stdout instead of written to disk.

### Destructive operations

The generator may emit drops for foreign keys, indexes, unique constraints, and columns when required to align with your models. It never drops tables automatically; write a manual migration to remove one. This protects against accidental data loss and avoids deleting ad hoc tables that are not part of your models.

## Caveats

- Always review the generated SQL. Some databases and drivers normalize types (floating precision, text families), which affects diffs.
- Run the generated migration in a safe environment first, back up your data, and test rollbacks.
- Ensure the datasource passed with `--datasource` is fully configured for the target environment and registers your models.
- SQLite has limited alter-table support and is not recommended for this command.
- CockroachDB schema introspection differences can produce incorrect statements, so review `--dry` output carefully.
- Treat this as a tool to standardize the migration skeleton. For crucial or complex changes, review the result and adjust it manually.

## Using `col` for schema metadata

To make your model's intended database schema explicit and help the generator produce accurate diffs, use the `col` namespace with `defineModel` to specify database metadata such as default values and nullability directly on model fields.

:::warning
Columns without the `type` option are ignored by the generator.
:::

```typescript
import { defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(), // treated as an integer column
    status: col.string({ default: "active", nullable: false }), // treated as varchar
    description: col.text({ nullable: true }), // treated as text
    randomColumnIgnored: col<unknown>(), // no type or metadata, ignored by the generator
    randomColumnWithType: col<string>({ type: "varchar" }), // treated as varchar
    customColumn: col<number[]>({ type: "vector", length: 100 }), // generates vector(100)
  },
});
```

The generator compares this metadata with the live database schema to produce the correct statements for each change.

## See also

- [Migrations](/databases/sql/cli/migrations/basics)
- [Advanced Migration Patterns](/databases/sql/cli/migrations/advanced)
- [CLI Reference](/databases/sql/cli/overview)
