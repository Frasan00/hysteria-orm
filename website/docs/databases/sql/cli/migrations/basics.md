---
title: Migrations
description: Create, run, roll back, and inspect Hysteria ORM migrations, and understand the migration file structure.
keywords: [hysteria-orm, migrations, migrate, rollback, schema, database]
---

# Migrations

Migrations apply versioned changes to your database schema. Each migration is a class with an `up()` method that applies a change and a `down()` method that reverts it.

## Migration file structure

A migration default-exports a class that extends `Migration`:

```typescript
import { Migration } from "hysteria-orm";

export default class extends Migration {
  async up(): Promise<void> {
    // Apply the change
  }

  async down(): Promise<void> {
    // Revert the change
  }
}
```

Use the schema builder inside `up()` and `down()`. A create-table migration:

```typescript
import { Migration } from "hysteria-orm";

export default class extends Migration {
  async up(): Promise<void> {
    this.schema.createTable("users", (table) => {
      table.increments("id").primary();
      table.string("name");
      table.string("email").unique();
      table.timestamp("created_at");
    });
  }

  async down(): Promise<void> {
    this.schema.dropTable("users");
  }
}
```

An alter-table migration adds or changes columns on an existing table:

```typescript
import { Migration } from "hysteria-orm";

export default class extends Migration {
  async up(): Promise<void> {
    this.schema.alterTable("users", (table) => {
      table.string("nickname");
      table.boolean("is_active").default(true);
    });
  }

  async down(): Promise<void> {
    this.schema.alterTable("users", (table) => {
      table.dropColumn("nickname");
      table.dropColumn("is_active");
    });
  }
}
```

You can also run raw SQL with `this.schema.rawQuery("...")` when the schema builder cannot express a change.

:::note
Date and time columns in migrations support the `autoCreate` and `autoUpdate` options. For `autoUpdate`, MySQL and MariaDB use the native `ON UPDATE CURRENT_TIMESTAMP` clause; other databases get an update trigger created automatically after the table is created or when a column is added. Trigger names follow `trg_{table}_{column}_auto_update`. If your table uses a primary key other than `id`, adjust the generated trigger manually for MSSQL.
:::

## Creating a migration

Use `create:migration` to scaffold a file in your migrations directory. The CLI prefixes the filename with a timestamp.

```bash
hysteria-orm create:migration add_users_table --create --table users
```

Pass `--alter` to scaffold an alter-table template instead, or no template flag for a bare migration. See [CLI Reference](/databases/sql/cli/overview#create-migration) for every flag. The `generate:migrations` command writes the same file format automatically from a model diff; see [Generate Migrations from Models](/databases/sql/cli/migrations/generate-migrations).

## Configuration

Configure migration behavior on your `SqlDataSource`. For connection details, see [SQL ORM Introduction](/databases/sql/introduction).

```typescript
import { SqlDataSource } from "hysteria-orm";

const sqlDs = new SqlDataSource({
  type: "postgres",
  // connection config: see /databases/sql/introduction
  migrations: {
    path: "database/migrations",
    tsconfig: "./tsconfig.json",
    lock: true,
    transactional: true,
  },
});
```

| Option          | Type                             | Default                 | Description                                                           |
| --------------- | -------------------------------- | ----------------------- | --------------------------------------------------------------------- |
| `path`          | `string`                         | `"database/migrations"` | Path to the migration files directory or a glob pattern.              |
| `tsconfig`      | `string`                         | `"./tsconfig.json"`     | Path to the TypeScript configuration file.                            |
| `lock`          | `boolean \| MigrationLockConfig` | `true`                  | Advisory locking to prevent concurrent migrations.                    |
| `transactional` | `boolean`                        | `true`                  | Run migrations in a single transaction (PostgreSQL/CockroachDB only). |

### Glob pattern support

The `path` option accepts glob patterns, so you can discover migrations across modules:

```typescript
const sqlDs = new SqlDataSource({
  type: "postgres",
  migrations: {
    // Plain directory: expands to "database/migrations/**/*.{ts,js}" (recursive)
    path: "database/migrations",

    // Explicit glob: only top-level .ts files
    // path: "database/migrations/*.ts",

    // Multi-directory glob: migrations across modules
    // path: "src/modules/*/migrations/*.ts",
  },
});
```

- A **plain directory** expands to `database/migrations/**/*.{ts,js}` and is created automatically if it does not exist.
- A **glob pattern** is passed to `fs.globSync` as-is.

:::note
Applied migration names are stored as the file **basename** (for example, `001_create_users.ts`), regardless of subdirectory. Keep basenames unique across every directory a glob matches.
:::

### Priority order

Configuration resolves in this order:

1. CLI flags (highest priority)
2. `migrations` object on the `SqlDataSource`
3. Environment variables (lowest priority)

```bash
hysteria-orm migrate -d ./database/index.ts -m ./custom/path --no-lock
```

## Running migrations

TypeScript migrations require `typescript` and `esbuild` as dev dependencies. Prefer transpiled migrations in production so those packages can stay in `devDependencies`.

```bash
hysteria-orm migrate -d ./database/index.ts
```

Pass a migration name to stop after it:

```bash
hysteria-orm migrate 001_create_users -d ./database/index.ts
```

See [Migrate](/databases/sql/cli/overview#migrate) for transactional and locking flags.

## Rolling back

```bash
hysteria-orm rollback -d ./database/index.ts
```

Pass a migration name to roll back down to and including it:

```bash
hysteria-orm rollback 001_create_users -d ./database/index.ts
```

See [Rollback](/databases/sql/cli/overview#rollback) for every flag.

## Migration status

Hysteria records applied migrations in a `migrations` table with `name` and `timestamp` columns. The migrator creates the table on first use. Query it to see what has run:

```sql
SELECT name, timestamp FROM migrations ORDER BY id;
```

## Schema builder

The schema builder implements `PromiseLike`, so you can either execute queries when you `await` it or retrieve the SQL without executing.

```typescript
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({ type: "postgres" });
await sql.connect();

// Executes immediately
await sql.schema().createTable("users", (table) => {
  table.integer("id").primaryKey().increment();
  table.string("email").unique();
});
```

Retrieve the generated SQL without executing it:

```typescript
const query = sql
  .schema()
  .createTable("users", (table) => {
    table.integer("id").primaryKey();
    table.string("name");
  })
  .toQuery();
```

| Method         | Returns                            | Description                                            |
| -------------- | ---------------------------------- | ------------------------------------------------------ |
| `.toQuery()`   | `string \| string[]`               | Single statement as a string, or an array if multiple. |
| `.toQueries()` | `string[]`                         | Always an array of statements.                         |
| `.toSql()`     | `{ sql: string, bindings: any[] }` | SQL string with its bindings.                          |

Multiple awaits on the same builder execute only once, so chaining operations is safe:

```typescript
const builder = sql.schema();
builder.createTable("users", (table) => {
  table.integer("id").primaryKey();
  table.string("name");
});
builder.createTable("posts", (table) => {
  table.integer("id").primaryKey();
  table.string("title");
});

await builder; // Executes both operations once
await builder; // Does not re-execute
```

The builder exposes `createTable`, `alterTable`, `dropTable`, `renameTable`, and `truncateTable`, along with column types (`string`, `integer`, `bigSerial`, `boolean`, `date`, `jsonb`, `enum`, and more) and constraints (`primary`, `unique`, `references`, `notNullable`, `default`, and more). `createTable` also accepts database-specific options:

| Database        | Table `options` keys                                                                     |
| --------------- | ---------------------------------------------------------------------------------------- |
| MySQL / MariaDB | `engine`, `charset`, `collate`, `rowFormat`, `autoIncrement`, `dataDirectory`, `comment` |
| PostgreSQL      | `tablespace`, `unlogged`, `temporary`, `with`                                            |
| SQLite          | `strict`, `withoutRowId`, `temporary`                                                    |
| MSSQL           | `onFilegroup`, `dataCompression`                                                         |

On MySQL, columns also accept `collate()`:

```typescript
this.schema.createTable("users", (table) => {
  table.varchar("name").collate("utf8mb4_unicode_ci");
});
```

## Programmatic migrations

Run migrations from your own code with `defineMigrator`. It returns a migrator with `up()` and `down()` methods and is useful for custom workflows and CI.

```typescript
import { defineMigrator } from "hysteria-orm";

const migrator = defineMigrator("database/migrations", {
  type: "postgres",
  host: "localhost",
  database: "mydb",
  // ...connection config
});

await migrator.up(); // Run all pending migrations
await migrator.down(); // Roll back all migrations
```

The second argument accepts a `SqlDataSource` instance or its input object. If you omit it, the migrator falls back to environment variables.

## Best practices

- Use one migration per schema change.
- Always provide a `down()` method so rollbacks stay reversible.
- Test migrations in CI.
- Use descriptive filenames; the CLI's timestamp prefix keeps ordering deterministic.

## See also

- [CLI Reference](/databases/sql/cli/overview)
- [Advanced Migration Patterns](/databases/sql/cli/migrations/advanced)
- [Generate Migrations from Models](/databases/sql/cli/migrations/generate-migrations)
