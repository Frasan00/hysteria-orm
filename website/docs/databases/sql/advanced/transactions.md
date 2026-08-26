---
title: Transactions
description: "Database transactions: commit, rollback, nested and concurrent transactions in Hysteria ORM."
keywords: [hysteria-orm, transactions, commit, rollback, ACID]
sidebar_position: 7
---

# Transactions

Hysteria ORM provides robust transaction support for SQL databases, allowing you to group multiple operations into a single atomic unit. Transactions ensure data consistency and integrity, supporting features like rollback, isolation levels, nested, concurrent, and global transactions.

## Setup

```typescript
import { SqlDataSource, defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string(),
  },
});

const sql = new SqlDataSource({ type: "postgres" /* ... */ });
await sql.connect();
```

## Basic Usage

Use `transaction` with a callback to run operations within a transaction. If an error is thrown, the transaction is rolled back automatically.

```typescript
// Automatically commits the transaction
await sql.transaction(async (trx) => {
  await sql
    .from(User, { trx })
    .insert({ name: "John", email: "john@test.com" });
});
```

If an error occurs, changes are not committed:

```typescript
await sql.transaction(async (trx) => {
  await sql
    .from(User, { trx })
    .insert({ name: "John", email: "john@test.com" });
  throw new Error("Test error"); // Transaction is rolled back automatically
});
```

Raw transaction without models:

```typescript
await sql.transaction(async (trx) => {
  await trx.sql.from("users");
});
```

## Automatic Transaction Propagation (CLS)

By default, Hysteria ORM uses AsyncLocalStorage (CLS) to automatically propagate transactions to queries within a transaction callback. You don't need to manually pass `{ trx }` — queries automatically detect and use the active transaction.

```typescript
// CLS is enabled by default — no need to pass { trx }
await sql.transaction(async (trx) => {
  await sql.from(User).insert({ name: "John", email: "john@test.com" });
  await sql.from(User).where({ name: "John" }).update({ active: true });
  // All queries automatically use the transaction
});
```

### Disabling CLS

If you prefer manual transaction passing or need to disable CLS for specific reasons:

```typescript
const sql = new SqlDataSource({
  type: "postgres",
  /* ... */
  clsEnabled: false, // Disable automatic transaction propagation
});

// Now you must pass { trx } manually
const trx = await sql.transaction();
await sql.from(User, { trx }).insert({ name: "John", email: "john@test.com" });
await trx.commit();
```

### How CLS Works

CLS (Continuation-Local Storage) uses Node.js `AsyncLocalStorage` to maintain transaction context across async operations:

1. When you call `sql.transaction(callback)`, the transaction is stored in async context
2. All queries within the callback check the async context for an active transaction
3. If found, the query uses that transaction automatically
4. On commit/rollback, the context is cleared

### Concurrent Transactions

Each async call chain has its own context, so concurrent transactions work correctly:

```typescript
await Promise.all([
  sql.transaction(async () => {
    await sql.from(User).insert({ name: "John" });
  }),
  sql.transaction(async () => {
    await sql.from(User).insert({ name: "Jane" });
  }),
]);
// Each transaction runs in its own isolated context
```

### Compatibility

- CLS is enabled by default for new `SqlDataSource` instances
- Fully backward compatible with manual `{ trx }` passing
- Works with nested transactions (savepoints)
- Compatible with all supported SQL dialects (PostgreSQL, MySQL, SQLite, MSSQL, Oracle)
- Requires Node.js 16+ for `AsyncLocalStorage` support

## Custom Isolation Level

You can specify a transaction isolation level:

```typescript
await sql.transaction(
  async (trx) => {
    await sql
      .from(User, { trx })
      .insert({ name: "John", email: "john@test.com" });
  },
  { isolationLevel: "SERIALIZABLE" },
);
```

## Manual Transaction Control

Start, commit, and rollback transactions manually:

```typescript
const trx = await sql.transaction();
await sql.from(User, { trx }).insert({ name: "John", email: "john@test.com" });
await trx.commit();
```

Rollback on error:

```typescript
const trx = await sql.transaction();
try {
  await sql
    .from(User, { trx })
    .insert({ name: "John", email: "john@test.com" });
  throw new Error("fail");
  await trx.commit();
} catch {
  await trx.rollback();
}
```

## Nested Transactions (Savepoints)

Nested transactions are implemented using database savepoints on the same connection as the outer transaction (no new connections are opened). This enables partial rollbacks without affecting the outer scope.

- No new connections: nested transactions reuse the outer transaction's connection
- Commit: releases the savepoint (does not commit the outer transaction)
- Rollback: rolls back to the savepoint (does not roll back the outer transaction)

Savepoint names are stable and driver-safe: `sp_<nestingDepth>_<transactionIdPrefix>` (for example: `sp_2_AB12CD34`).

```typescript
const outerTrx = await sql.transaction();
await sql
  .from(User, { trx: outerTrx })
  .insert({ name: "John", email: "john@test.com" });

// Creates a savepoint on the same connection
const innerTrx = await outerTrx.savePoint();
try {
  await sql
    .from(User, { trx: innerTrx })
    .insert({ name: "Jane", email: "jane@test.com" });
  await innerTrx.commit(); // RELEASE SAVEPOINT <name>
} catch (e) {
  await innerTrx.rollback(); // ROLLBACK TO (savepoint)
  throw e;
}

await outerTrx.commit(); // commits the top-level transaction and releases the connection
```

## Concurrent Transactions

You can run multiple transactions in parallel on different connections:

```typescript
const trx1 = await sql.transaction();
const trx2 = await sql.transaction();
await sql
  .from(User, { trx: trx1 })
  .insert({ name: "John", email: "john@test.com" });
await sql
  .from(User, { trx: trx2 })
  .insert({ name: "Jane", email: "jane@test.com" });
await trx1.commit();
await trx2.commit();
```

## Global Transactions

For integration tests, you can use global transactions on a `SqlDataSource` instance.
Global transactions are not advised for production use.

```typescript
await sql.startGlobalTransaction();
// All queries on this instance automatically use the global transaction
await sql.from(User).insert({ name: "John", email: "john@test.com" });
await sql.commitGlobalTransaction();
```

Rollback global transaction:

```typescript
await sql.startGlobalTransaction();
await sql.from(User).insert({ name: "John", email: "john@test.com" });
await sql.rollbackGlobalTransaction();
```

## Error Handling and Transaction State

You can enforce error throwing if a transaction is inactive:

```typescript
const trx = await sql.transaction();
await trx.rollback();
await trx.rollback({ throwErrorOnInactiveTransaction: true }); // Throws HysteriaError
```

Or suppress errors:

```typescript
const trx = await sql.transaction();
await trx.rollback();
await trx.rollback({ throwErrorOnInactiveTransaction: false }); // No error
```

## Notes

- Nested transactions never release the connection but only save points; only the top-level transaction releases it on commit/rollback.
- With CLS enabled (default), queries inside a transaction callback automatically use the active transaction. Manual `{ trx }` passing is only required when `clsEnabled: false`.
- Use isolation levels for advanced consistency requirements.
- SQLite `:memory:` databases create a new empty in-memory DB per connection. Transactions on `:memory:` may not see tables created on the main connection. Use `file::memory:?cache=shared` or a file database for transactional SQLite tests.

---

See also:

- [CTE](./cte.md)
- [JSON Columns](./json.md)
- [SQLite JSON Limitations](./sqlite-json-limitations.md)

## Known sharp edges

- The F002/F008 fix introduces a benign `Release called on client which has already been released to the pool` warning in some test paths. This is the F002 defense-in-depth `disconnect()` calling `release()` after `Transaction.releaseConnection()` already did. The pool's release() is idempotent at the driver level; the warning is logged and ignored. See `docs/superpowers/plans/2026-06-03-connection-audit-findings.md` (F002).
- CockroachDB: a forced commit/rollback failure leaves the connection in an in-transaction server-side state. The defense-in-depth release returns the connection to the pool, but cockroach rejects subsequent `BEGIN` on the same connection. Workaround: callers should ensure their failure-injection tests acquire a fresh connection (e.g. `await sql.from(...).delete()` triggers a fresh borrow). See F021 in the audit doc.
- The `@atomic` decorator requires `clsEnabled: true` on the resolved `SqlDataSource`. Setting `clsEnabled: false` causes `ATOMIC_CLS_DISABLED` at decorator-invocation time.
