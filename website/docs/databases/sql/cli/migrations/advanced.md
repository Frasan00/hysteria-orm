---
title: Advanced Migration Patterns
description: Advisory locking, lifecycle hooks, and programmatic control for Hysteria ORM migrations.
keywords: [hysteria-orm, migrations, advisory lock, hooks, programmatic]
---

# Advanced migration patterns

These patterns cover concurrency safety, lifecycle hooks, and custom migration workflows.

## Advisory locking

Hysteria ORM acquires an advisory lock before running migration commands. This prevents multiple application instances from running migrations at the same time, which avoids race conditions and duplicate migrations.

### Database support

| Database    | Lock mechanism                                | Supported |
| ----------- | --------------------------------------------- | --------- |
| PostgreSQL  | `pg_advisory_lock()` / `pg_advisory_unlock()` | Yes       |
| CockroachDB | `pg_advisory_lock()` / `pg_advisory_unlock()` | Yes       |
| MySQL       | `GET_LOCK()` / `RELEASE_LOCK()`               | Yes       |
| MariaDB     | `GET_LOCK()` / `RELEASE_LOCK()`               | Yes       |
| MSSQL       | `sp_getapplock` / `sp_releaseapplock`         | Yes       |
| SQLite      | File-based locking                            | Yes       |

### Configuration

Locking is enabled by default. Configure it on the datasource, or leave it to the CLI default. See [Migrations](/databases/sql/cli/migrations/basics#configuration) for the full configuration table.

```typescript
const sqlDs = new SqlDataSource({
  type: "postgres",
  // connection config: see /databases/sql/introduction
  migrations: {
    path: "database/migrations",
    lock: true, // or { enabled: true, timeout: 60000, customValue: "my_lock" }
  },
});
```

CLI flags take priority over the datasource configuration.

### CLI usage

Every migration command supports locking and the `--lock-timeout` flag:

```bash
hysteria-orm migrate -d ./database/index.ts
hysteria-orm rollback -d ./database/index.ts
hysteria-orm refresh -d ./database/index.ts

# Disable locking (not recommended in production)
hysteria-orm migrate -d ./database/index.ts --no-lock
```

### Programmatic usage

`acquireLock` and `releaseLock` are public methods, so you can use them for purposes other than migrations:

```typescript
import { SqlDataSource, defineMigrator } from "hysteria-orm";

const sqlDs = new SqlDataSource({
  type: "postgres",
  // ...connection config
});
await sqlDs.connect();

const migrator = defineMigrator("database/migrations", sqlDs);
const acquired = await sqlDs.acquireLock("hysteria_migration_lock", 30000);

if (acquired) {
  try {
    await migrator.up();
  } finally {
    await sqlDs.releaseLock("hysteria_migration_lock");
  }
} else {
  console.error("Could not acquire migration lock");
}
```

Programmatic migrators created with `defineMigrator` do not acquire locks themselves, so wrap them manually when multiple processes may run at once.

### Lock behavior

- The CLI uses `hysteria_migration_lock` as the default key and waits 30 seconds by default.
- Acquisition is non-blocking: `acquireLock` returns `false` immediately if another process holds the lock.
- Locks are always released in a `finally` block, on success and on error.
- `refresh` acquires the lock once and holds it across both the reset and the re-run.

### API reference

| Method                              | Returns            | Description                                                            |
| ----------------------------------- | ------------------ | ---------------------------------------------------------------------- |
| `acquireLock(lockKey?, timeoutMs?)` | `Promise<boolean>` | Acquires an advisory lock. Defaults to `"hysteria_lock"` and 30000 ms. |
| `releaseLock(lockKey?)`             | `Promise<boolean>` | Releases an advisory lock. Defaults to `"hysteria_lock"`.              |

### Database notes

- **PostgreSQL / CockroachDB**: session-level advisory locks that release automatically when the connection closes; acquisition uses `pg_try_advisory_lock()`.
- **MySQL / MariaDB**: named, session-scoped locks with timeout support, released on connection close.
- **MSSQL**: application locks with session ownership and immediate-failure or timeout behavior.
- **SQLite**: automatic file-based locking; explicit lock calls succeed immediately.

### Best practices

- Keep locking enabled in production.
- Use distinct lock keys for distinct operation types.
- Increase the timeout for slow database operations.
- Alert on lock acquisition failures.
- Ensure database users have lock-related permissions.

## Hooks and lifecycle

A migration can define an optional `afterMigration(sqlDataSource)` hook that runs after `up()` or `down()` completes. Use it for logic that must not go through the schema builder, such as data backfills or cache invalidation.

```typescript
import { Migration, SqlDataSource } from "hysteria-orm";

export default class extends Migration {
  async up(): Promise<void> {
    this.schema.alterTable("users", (table) => {
      table.string("display_name");
    });
  }

  async down(): Promise<void> {
    this.schema.alterTable("users", (table) => {
      table.dropColumn("display_name");
    });
  }

  async afterMigration(sqlDataSource: SqlDataSource): Promise<void> {
    await sqlDataSource.rawQuery(
      "UPDATE users SET display_name = name WHERE display_name IS NULL",
    );
  }
}
```

## Custom paths and programmatic control

- Pass `-m, --migration-path` to any migration command to target a specific directory or glob, which suits multi-tenant or modular applications.
- Use `defineMigrator(path, datasource)` to run migrations up or down from your own code. See [Programmatic migrations](/databases/sql/cli/migrations/basics#programmatic-migrations).
- To generate migration files from a model diff, see [Generate Migrations from Models](/databases/sql/cli/migrations/generate-migrations).

## See also

- [Migrations](/databases/sql/cli/migrations/basics)
- [CLI Reference](/databases/sql/cli/overview)
- [Generate Migrations from Models](/databases/sql/cli/migrations/generate-migrations)
