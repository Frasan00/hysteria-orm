---
id: generate-migrations
title: Generate migrations from models
sidebar_label: Generate migrations
description: "Auto-generate migrations from model changes in Hysteria ORM."
keywords: [hysteria-orm, generate migrations, auto-migrate, schema sync]
---

> Warning: This feature is only supported for MySQL, MariaDB, PostgreSQL and CockroachDB.

The `generate:migrations` command inspects your live database schema and your registered models, computes a diff, and writes a migration file to reconcile them.

By default the generated file uses the **schema builder API** (`code` mode), producing readable TypeScript that mirrors how you'd write a migration by hand. You can switch to **raw SQL** mode with `--output raw` if you prefer.

## Usage

```bash
npx hysteria generate:migrations \
  --datasource ./database/index.ts \
  --tsconfig ./tsconfig.json \
  --migration-path ./database/migrations \
  --name add_user_fields \
  --output code
```

## Options

- `-d, --datasource [path]` — Path to a file exporting a default `sql` instance. Required.
- `-c, --tsconfig [tsconfigPath]` — Path to tsconfig.json to load TypeScript files. Defaults to `./tsconfig.json`.
- `-m, --migration-path [path]` — Output directory for migration files. Defaults to `./database/migrations`.
- `-n, --name [name]` — Base name for the migration. A millisecond timestamp is prefixed automatically.
- `-j, --javascript` — Generate a JavaScript migration file instead of TypeScript.
- `-f, --dry` — Preview the migration output without writing a file.
- `-o, --output [mode]` — Output mode: `code` (default) or `raw`. See below.

## Output modes

### `--output code` (default)

Generates a migration using the schema builder API — the same API you use when writing migrations by hand. The `up()` method contains readable builder calls and a `down()` method is generated automatically.

```typescript
import { Migration } from "hysteria-orm";

export default class extends Migration {
  async up() {
    // Structure creation
    this.schema.createTable("users", (table) => {
      table.increment("id").primaryKey({ constraintName: "pk_users_id" });
      table.varchar("name");
      table.varchar("email");
      table.timestamp("created_at", { withTimezone: true });
    });

    // Constraints and indexes
    this.schema.alterTable("posts", (table) => {
      table.foreignKey("user_id", "users", "id", { constraintName: "fk_posts_user_id_users", onDelete: "cascade" });
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

Generates a migration using raw SQL strings via `this.schema.rawQuery(...)`. Use this if you need full control over the exact SQL or prefer the old behaviour.

```typescript
import { Migration } from "hysteria-orm";

export default class extends Migration {
  async up() {
    this.schema.rawQuery('CREATE TABLE users (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255), PRIMARY KEY (id))');
    this.schema.rawQuery('ALTER TABLE posts ADD CONSTRAINT fk_posts_user_id_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
  }

  async down() {}
}
```

## Behavior

- If no differences are detected, the command logs: `No new changes detected between database schema and models metadata` and exits with code 0.
- On differences, a file named `<timestamp>(_auto_generated_migration|{name}).(ts|js)` is written to the output directory.
- The output directory is created if it does not exist.
- With `--dry`, the generated code (or SQL) is printed to stdout instead of written to disk.

### Destructive operations (drops)

- The generator may emit drops for foreign keys, indexes, unique constraints, and columns when required to align with the models.
- Tables are never auto-dropped. If you need to remove a table, write a manual migration to drop it. This avoids accidental data loss and to never delete ad hoc tables that are not part of the models.

## Caveats

- Always review generated SQL. Some databases/drivers normalize types (e.g., floating precision, text families), which may affect diffs.
- Run the generated migration in a safe environment first. Back up your database and test rollbacks as needed.
- Ensure the `sql` instance passed via `--datasource` is fully configured for the target environment and registers your models.
- SQLite has some limitations due to its limited alter table capabilities and it's not recommended to use this feature with SQLite
- CockroachDB is not supported due to differences in schema introspection and column type handling that may produce incorrect migration statements
- Crucial or complex operations should be done manually, this is intended as a tool to help you generate the SQL statements for your migrations in a standard way but it's not suggested to use it as a full replacement for manual migrations.

## Using `col` for Schema Metadata

To make your model's intended database schema explicit and help the migration generator produce accurate diffs, use the `col` namespace with `defineModel` to specify database metadata such as `default` values and `nullable` status directly on your model fields.

!! Columns without the `type` option will be ignored !!

**Example:**

```typescript
import { defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(), // automatically has the `integer` type for the generator
    status: col.string({ default: "active", nullable: false }), // automatically has the `varchar` type for the generator
    description: col.text({ nullable: true }), // automatically has the `text` type for the generator
    randomColumnIgnored: col<unknown>(), // no type or metadata, will be ignored by the generator
    randomColumnWithType: col<string>({ type: "varchar" }), // will be treated as a varchar column by the generator
    customColumn: col<number[]>({ type: "vector", length: 100 }), // custom that wil generate a `vector(100)` column
  },
});
```

This metadata is used by the migration generator to compare your model definitions with the live database schema and generate the correct SQL statements for changes.
