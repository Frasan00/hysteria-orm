---
title: Migrations
description: "Database migrations basics: create, run, rollback migrations in Hysteria ORM."
keywords: [hysteria-orm, migrations, database schema, migrate, rollback]
sidebar_position: 1
---

# Migrations

Migrations allow you to version and evolve your database schema safely.

## Creating a Migration

Create a migration file in your migrations directory:

```typescript
import { Migration } from 'hysteria-orm';

export default class extends Migration {
  async up() {
    this.schema.createTable('users', (table) => {
      table.bigint('id').primaryKey().increment();
      table.string('name');
      table.string('email').unique();
      table.integer('age');
      table.boolean('is_active');
      table.timestamp('created_at');
      table.timestamp('updated_at');
    });
  }

  async down() {
    this.schema.dropTable('users');
  }
}

> Note: Date/time columns in migrations support `autoCreate` and `autoUpdate` options. For `autoUpdate`, MySQL/MariaDB use the native `ON UPDATE CURRENT_TIMESTAMP` clause; for other databases, Hysteria will automatically generate an update trigger after the table is created or when adding a column to implement auto-update behavior. Trigger names follow the pattern `trg_{table}_{column}_auto_update`. If your table uses a primary key other than `id`, you may need to adjust the generated trigger for MSSQL manually.
```

## Migration Configuration

You can configure migration behavior directly in your `SqlDataSource` instance:

```typescript
import { SqlDataSource } from "hysteria-orm";

const sqlDs = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "root",
  password: "root",
  database: "mydb",
  migrations: {
    path: "database/migrations", // Migration files location
    tsconfig: "./tsconfig.json", // TypeScript config path
    lock: true, // Enable advisory locking
    transactional: true, // Run in transaction (PostgreSQL/CockroachDB only)
  },
});
```

### Configuration Options

| Option          | Type      | Default                 | Description                                                          |
| --------------- | --------- | ----------------------- | -------------------------------------------------------------------- |
| `path`          | `string`  | `"database/migrations"` | Path to migration files directory or a glob pattern                  |
| `tsconfig`      | `string`  | `"./tsconfig.json"`     | Path to TypeScript configuration file                                |
| `lock`          | `boolean` | `true`                  | Enable advisory locking to prevent concurrent migrations             |
| `transactional` | `boolean` | `true`                  | Run migrations in a single transaction (PostgreSQL/CockroachDB only) |

#### Glob Pattern Support

The migration `path` option supports glob patterns (requires Node.js >= 22), allowing flexible file discovery:

```typescript
const sqlDs = new SqlDataSource({
  type: "postgres",
  // ...
  migrations: {
    // Plain directory: auto-expands to "database/migrations/**/*.{ts,js}" (recursive)
    path: "database/migrations",

    // Explicit glob: only match top-level .ts files
    // path: 'database/migrations/*.ts',

    // Multi-directory glob: match migrations across modules
    // path: 'src/modules/*/migrations/*.ts',
  },
});
```

**Behavior:**

- **Plain directory** (e.g., `"database/migrations"`): Automatically expands to `database/migrations/**/*.{ts,js}`, recursively matching all `.ts` and `.js` files. If the directory does not exist, it is auto-created.
- **Glob pattern** (e.g., `"src/modules/*/migrations/*.ts"`): Used as-is for file matching via `fs.globSync`.

:::note
Migration names stored in the database are always the **basename** of each file (e.g., `001_create_users.ts`), regardless of subdirectory structure. Ensure migration file basenames are unique across all matched directories.
:::

### Priority Order

Configuration is resolved in the following priority order:

1. **CLI flags** (highest priority)
2. **SqlDataSource config** (migrations object)
3. **Environment variables** (lowest priority)

Example:

```bash
# CLI flag overrides SqlDataSource config
hysteria migrate -d ./database/index.ts -m ./custom/path --no-lock
```

## Running Migrations

In order to run typescript migrations, you need have `typescript`, `jiti` packages sinstalled.
It's suggested to use traspiled migrations in production since `typescript`, `jiti` should be marked as dev dependencies.

```bash
npx hysteria migrate -d ./database/index.ts
yarn hysteria migrate -d ./database/index.ts
```

## Rolling Back

```bash
npx hysteria rollback -d ./database/index.ts
yarn hysteria rollback -d ./database/index.ts
```

## Schema Builder Behavior

The Schema Builder implements `PromiseLike`, which means you can choose to either **execute queries when awaited** or **get the SQL without executing**.

### Execute on Await

When you `await` a schema builder, it will execute all the queries:

```typescript
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres",
  // ... other config
});

await sql.connect();

// Execute immediately on await
await sql.schema().createTable("users", (table) => {
  table.integer("id").primaryKey().increment();
  table.string("email").unique();
});
```

### Get SQL Without Executing

You can retrieve the SQL query without executing it using `.toQuery()`:

```typescript
// Get the SQL string without executing
const sqlQuery = sql
  .schema()
  .createTable("users", (table) => {
    table.integer("id").primaryKey();
    table.string("name");
  })
  .toQuery();

console.log(sqlQuery);
// "CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR(255));"
```

### Multiple Operations

You can chain multiple schema operations and execute them all at once:

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
builder.createIndex("users", ["email"]);

// Execute all operations at once
await builder;
```

### Query Retrieval Methods

| Method         | Returns                            | Description                                              |
| -------------- | ---------------------------------- | -------------------------------------------------------- |
| `.toQuery()`   | `string \| string[]`               | Returns single statement as string, or array if multiple |
| `.toQueries()` | `string[]`                         | Always returns an array of statements                    |
| `.toSql()`     | `{ sql: string, bindings: any[] }` | Returns an object with SQL string and bindings array     |

### Double Execution Prevention

The schema builder prevents accidental double execution. Multiple awaits on the same builder will only execute once:

```typescript
const builder = sql.schema().createTable('users', (table) => { ... });
await builder; // Executes
await builder; // Does NOT re-execute
```

## Schema Builder API

- `createTable`, `alterTable`, `dropTable`, `renameTable`, `truncateTable`
- Column types: `string`, `integer`, `bigSerial`, `boolean`, `date`, `jsonb`, `enum`, etc.
- Constraints: `primary`, `unique`, `references`, `notNullable`, `default`, etc.

### API Reference

#### createTable

Create a new table with columns and constraints.

```typescript
schema.createTable("users", (table) => {
  table.integer("id").increment().primary();
  table.string("email").unique();
});
```

- `table` (string): Table name
- `cb` (function): Callback to define columns
- `options` (object): Table configuration options, includes database-specific options

The `options` parameter can include database-specific table configurations:

**MySQL/MariaDB:** `engine`, `charset`, `collate`, `rowFormat`, `autoIncrement`, `dataDirectory`, `comment`, etc.

```typescript
schema.createTable(
  "users",
  (table) => {
    table.integer("id").increments();
    table.string("name");
  },
  {
    engine: "InnoDB",
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
);
```

**PostgreSQL:** `tablespace`, `unlogged`, `temporary`, `with` (storage parameters)

```typescript
schema.createTable(
  "users",
  (table) => {
    table.bigInteger("id").increments();
    table.string("name");
  },
  {
    tablespace: "fast_storage",
    unlogged: true,
  },
);
```

**SQLite:** `strict`, `withoutRowId`, `temporary`

```typescript
schema.createTable(
  "users",
  (table) => {
    table.bigInteger("id").increments();
    table.string("name");
  },
  {
    strict: true,
    withoutRowId: true,
  },
);
```

**MSSQL:** `onFilegroup`, `dataCompression`

```typescript
schema.createTable(
  "sales",
  (table) => {
    table.integer("id").identity();
    table.decimal("amount", 18, 2);
  },
  {
    onFilegroup: "sales_fg",
    dataCompression: "PAGE",
  },
);
```

**OracleDB:** `tablespace`, `compress`, `storage`, `logging`, `cache`, `inMemory`

```typescript
schema.createTable(
  "orders",
  (table) => {
    table.bigInteger("id").increments();
    table.date("order_date");
  },
  {
    tablespace: "users_ts",
    compress: true,
  },
);
```

**Column COLLATE** (MySQL only): `column.collate()`

```typescript
schema.createTable("users", (table) => {
  table.varchar("name").collate("utf8mb4_unicode_ci");
});
```

- `table` (string): Table name
- `cb` (function): Callback to define alterations

#### dropTable

Drop a table.

```typescript
schema.dropTable("users");
```

- `table` (string): Table name
- `ifExists` (boolean, optional): Only drop if exists

#### renameTable

Rename a table.

```typescript
schema.renameTable("old_users", "users");
```

- `oldtable` (string): Current table name
- `newtable` (string): New table name

#### truncateTable

Remove all rows from a table.

```typescript
schema.truncateTable("users");
```

- `table` (string): Table name

#### unique

Add a unique constraint to columns.

```typescript
schema.unique("users", ["email"]);
```

- `table` (string): Table name
- `columns` (string[]): Column names
- `constraintName` (string, optional): Custom constraint name

## Best Practices

- Use one migration per schema change.
- Always provide a `down` method.
- Test migrations in CI.

---

Next: [Programmatic Migrations](./programmatic.md)
