---
title: Advanced Migration Patterns
description: "Advanced migration patterns: complex schema changes, data migrations in Hysteria ORM."
keywords: [hysteria-orm, advanced migrations, schema changes, data migration]
sidebar_position: 6
---

# Advanced Migration Patterns

Explore advanced migration features and patterns in Hysteria ORM.

## Advisory Locking

Hysteria ORM includes built-in advisory locking to prevent concurrent migrations from running simultaneously. This is critical in production environments where multiple application instances might attempt to run migrations at the same time.

### Overview

By default, all migration commands acquire an advisory lock before executing. This ensures that only one migration process can run at a time, preventing race conditions, duplicate migrations, and database corruption.

### Database Support

| Database    | Lock Mechanism                                | Status       |
| ----------- | --------------------------------------------- | ------------ |
| PostgreSQL  | `pg_advisory_lock()` / `pg_advisory_unlock()` | ✅ Supported |
| CockroachDB | `pg_advisory_lock()` / `pg_advisory_unlock()` | ✅ Supported |
| MySQL       | `GET_LOCK()` / `RELEASE_LOCK()`               | ✅ Supported |
| MariaDB     | `GET_LOCK()` / `RELEASE_LOCK()`               | ✅ Supported |
| MSSQL       | `sp_getapplock` / `sp_releaseapplock`         | ✅ Supported |
| Oracle      | `DBMS_LOCK` package                           | ✅ Supported |
| SQLite      | File-based locking (automatic)                | ✅ Built-in  |

### Configuration

You can configure locking behavior in your `SqlDataSource`:

```typescript
const sqlDs = new SqlDataSource({
  type: "postgres",
  // ... connection config
  migrations: {
    path: "database/migrations",
    lock: true, // Enable advisory locking (default)
  },
});
```

### CLI Usage

All migration commands support the `--lock` option (enabled by default):

```bash
# Run migrations with locking (default behavior)
hysteria-orm migrate -d ./database/index.ts

# Disable locking (not recommended for production)
hysteria-orm migrate -d ./database/index.ts --no-lock

# Other commands also support locking
hysteria-orm rollback -d ./database/index.ts
hysteria-orm refresh -d ./database/index.ts
```

**Priority**: CLI flags override SqlDataSource configuration.

### Programmatic Usage

The lock methods are generic and can be used for any purpose beyond migrations:

```typescript
import { SqlDataSource } from "hysteria-orm";

const sqlDs = new SqlDataSource({
  type: "postgres",
  // ... connection config
});

await sqlDs.connect();

// Acquire a lock for migrations
const migrationLock = await sqlDs.acquireLock("hysteria_migration_lock");
if (migrationLock) {
  try {
    // Run your migrations
    await runMigrationsConnector(sqlDs, undefined, migrationPath);
  } finally {
    // Always release in finally block
    await sqlDs.releaseLock("hysteria_migration_lock");
  }
} else {
  console.error("Could not acquire migration lock");
}

// Use custom lock keys for other operations
const jobLock = await sqlDs.acquireLock("background_job_lock", 60000); // 60s timeout
if (jobLock) {
  try {
    // Run background job
  } finally {
    await sqlDs.releaseLock("background_job_lock");
  }
}
```

### Lock Behavior

1. **Lock Acquisition**:
   - Default lock key for migrations: `hysteria_migration_lock`
   - Default timeout: 30 seconds (configurable)
   - If lock cannot be acquired, the operation fails immediately
   - Non-blocking: returns `false` if lock is held by another process

2. **Lock Release**:
   - Always released in `finally` blocks
   - Automatic release on successful completion
   - Automatic release on error/exception
   - Warnings logged if release fails

3. **Refresh Command**:
   - Acquires lock once at the start
   - Maintains lock for both rollback and run operations
   - Prevents double-locking across internal operations

### API Reference

#### `acquireLock(lockKey?, timeoutMs?)`

Acquires an advisory lock.

**Parameters:**

- `lockKey` (string, optional): Lock identifier. Defaults to `'hysteria_lock'`
- `timeoutMs` (number, optional): Maximum wait time in milliseconds. Defaults to `30000`

**Returns:** `Promise<boolean>` - `true` if lock acquired, `false` otherwise

#### `releaseLock(lockKey?)`

Releases an advisory lock.

**Parameters:**

- `lockKey` (string, optional): Lock identifier. Defaults to `'hysteria_lock'`

**Returns:** `Promise<boolean>` - `true` if lock released, `false` otherwise

### Database-Specific Notes

#### PostgreSQL/CockroachDB

- Uses session-level advisory locks
- Automatically released when connection closes
- Non-blocking with `pg_try_advisory_lock()`

#### MySQL/MariaDB

- Named locks with timeout support
- Locks are session-specific
- Automatically released on connection close

#### MSSQL

- Application locks with session ownership
- Supports immediate failure or timeout
- Return codes: &ge;0 = success, &lt;0 = failure

#### Oracle

- Uses `DBMS_LOCK` package (requires execute permission)
- Lock handle allocated via `ALLOCATE_UNIQUE`
- Exclusive mode (X_MODE) for migrations
- Explicit release required (not auto-released)

#### SQLite

- File-based locking is automatic
- No explicit advisory locks needed
- Lock operations return success immediately

### Best Practices

1. **Always Use Locking in Production**: Keep the default behavior enabled
2. **Custom Lock Keys**: Use different lock keys for different operation types
3. **Timeout Configuration**: Increase timeout for slow database operations
4. **Monitor Lock Failures**: Set up alerts for lock acquisition failures
5. **Database Permissions**: Ensure database users have lock-related permissions

### Disabling Locks

While not recommended for production, you can disable locking:

```bash
# CLI
hysteria-orm migrate --no-lock -d ./database/index.ts

# Programmatic
await runMigrationsConnector(
  sqlDs,
  undefined, // runUntil
  undefined, // migrationPath
  undefined, // tsconfigPath
  true,      // transactional
  false      // useLock - DISABLED
);
```

## Hooks and Lifecycle

- `afterMigration`: Run logic after a migration completes (see `Migration` class).
- Custom hooks for pre/post migration logic.

## Programmatic Control

- Run migrations up/down to a specific migration.
- Use custom migration paths for multi-tenant or modular apps.

## Schema Builder API

- Use advanced column types, constraints, and raw queries.
- Compose complex schema changes with `alterTable`, `renameColumn`, etc.

## Tips

- Keep migrations atomic and focused.
- Use version control for migration files.
- Document intent in migration comments.
- Always use advisory locking in production environments.

See `src/sql/migrations/migration.ts` and `src/sql/migrations/migrator.ts` for more.

---

Back to: [Migrations Basics](./basics.md)
