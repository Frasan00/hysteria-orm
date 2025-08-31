# Hysteria ORM

> ⚠️ **This project is under active development. APIs and features may change, and breaking changes can occur between releases. Do not use in production**

Hysteria ORM is a modern, high-performance, partially type safe Object Relational Mapper for Node.js, supporting SQL (PostgreSQL, MySQL, SQLite) and NoSQL (Experimental) (MongoDB, Redis) databases. Designed for flexibility and developer productivity, it offers a unified API for multiple database engines.

## Installation

To get started, follow the official installation guide:

👉 [Installation Guide](https://frasan00.github.io/hysteria-orm/docs/getting-started/installation)

---

For more details, visit the [full documentation](https://frasan00.github.io/hysteria-orm/docs/getting-started/philosophy).

---

## Experimental: Generate migrations from models metadata

This CLI inspects your live database schema and your registered models, produces a diff, and writes a migration file with SQL statements to reconcile them. This feature is experimental; review and test generated SQL before applying it in production.

Usage:

```bash
npx hysteria-orm generate:migrations \
  --datasource ./database/index.ts \
  --tsconfig ./tsconfig.json \
  --migration-path ./database/migrations \
  --name add_user_fields
```

Options:

- `-d, --datasource [path]`: Path to a file exporting a default `SqlDataSource` instance. Required.
- `-c, --tsconfig [tsconfigPath]`: Path to tsconfig.json to load TypeScript files. Defaults to `./tsconfig.json`.
- `-m, --migration-path [path]`: Output directory for migration files. Defaults to `./database/migrations`.
- `-n, --name [name]`: Base name for the migration. A millisecond timestamp is prefixed automatically.
- `-j, --javascript`: Generate a JavaScript migration file instead of TypeScript.

Behavior:

- If no differences are detected, logs: `No new changes detected between database schema and models metadata` and exits 0.
- On differences, creates `<timestamp>_auto_generated_migration.(ts|js)` in the target folder, containing `this.schema.rawQuery(...)` statements for each change.
- Creates the output directory if it does not exist.

Caveats (experimental):

- Always review the generated SQL. Some drivers normalize types (e.g., float precision, text family) which may affect diffs.
- Run migrations in a safe environment first. Back up your database and test rollbacks as needed.
- Ensure the `SqlDataSource` passed via `--datasource` is fully configured for the target environment and registers your models.
