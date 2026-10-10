---
title: Transactions
description: Group SQL operations into atomic units with callback, manual, nested, concurrent, and global transactions in Hysteria ORM.
keywords: [hysteria-orm, transactions, commit, rollback, savepoint, atomic]
---

# Transactions

A transaction groups several operations into a single atomic unit. Hysteria ORM supports callback and manual control, isolation levels, nested savepoints, concurrent transactions, global transactions, and the `@atomic` decorator. The `sql` instance below is created as described in [SQL ORM Introduction](/databases/sql/introduction).

## Basic usage

Pass a callback to `transaction`. The transaction commits when the callback resolves and rolls back when it throws.

```typescript
await sql.transaction(async (trx) => {
  await sql
    .from(User, { trx })
    .insert({ name: "John", email: "john@test.com" });
});
```

An error triggers an automatic rollback:

```typescript
await sql.transaction(async (trx) => {
  await sql
    .from(User, { trx })
    .insert({ name: "John", email: "john@test.com" });
  throw new Error("Test error");
});
```

The transaction exposes its own data source through `trx.sql`, which also works for raw queries:

```typescript
await sql.transaction(async (trx) => {
  await trx.sql.from("users").insert({ name: "John" });
});
```

## Automatic propagation (CLS)

By default, the transaction is propagated with `AsyncLocalStorage` (CLS), so queries inside the callback use the active transaction without passing `{ trx }`:

```typescript
await sql.transaction(async () => {
  await sql.from(User).insert({ name: "John", email: "john@test.com" });
  await sql.from(User).where({ name: "John" }).update({ active: true });
});
```

### Disabling CLS

Set `clsEnabled: false` to opt out. You must then pass `{ trx }` manually.

```typescript
const sql = new SqlDataSource({
  type: "postgres" /* ... */,
  clsEnabled: false,
});

const trx = await sql.transaction();
await sql.from(User, { trx }).insert({ name: "John", email: "john@test.com" });
await trx.commit();
```

### How CLS works

1. `sql.transaction(callback)` stores the transaction in async context.
2. Queries within the callback read the active transaction from that context.
3. Explicit `{ trx }` always takes precedence over CLS.
4. The context lasts as long as the callback runs. Committing or rolling back does not clear it, and a task the callback starts but does not await still sees the transaction in context.

### Concurrent propagation

Each async chain has its own context, so parallel transactions stay isolated:

```typescript
await Promise.all([
  sql.transaction(async () => {
    await sql.from(User).insert({ name: "John" });
  }),
  sql.transaction(async () => {
    await sql.from(User).insert({ name: "Jane" });
  }),
]);
```

## Isolation level

Pass an isolation level when starting a transaction. SQLite accepts only `SERIALIZABLE`.

```typescript
await sql.transaction(
  async () => {
    await sql.from(User).insert({ name: "John", email: "john@test.com" });
  },
  { isolationLevel: "SERIALIZABLE" },
);
```

Available levels: `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`.

## Manual control

Call `transaction()` without a callback to commit and roll back yourself:

```typescript
const trx = await sql.transaction();
await sql.from(User, { trx }).insert({ name: "John", email: "john@test.com" });
await trx.commit();
```

```typescript
const trx = await sql.transaction();
try {
  await sql
    .from(User, { trx })
    .insert({ name: "John", email: "john@test.com" });
  await trx.commit();
} catch {
  await trx.rollback();
}
```

## Nested transactions (savepoints)

A transaction started inside an active transaction becomes a nested transaction on the same connection, so no new connection is opened. The nested transaction maps to a savepoint: committing releases it, rolling back returns to it without affecting the outer transaction. Savepoint names are stable (`sp_<depth>_<transactionId>`).

This applies when the outer transaction is still running, which means a callback transaction or a global transaction. Two manual `transaction()` calls at the top level are independent, not nested; see [Concurrent transactions](#concurrent-transactions).

With CLS, calling `sql.transaction()` inside an active transaction nests automatically:

```typescript
await sql.transaction(async () => {
  await sql.from(User).insert({ name: "John" });

  await sql.transaction(async () => {
    await sql.from(Profile).insert({ userId: 1 });
  });
});
```

You can also nest explicitly with `nestedTransaction`:

```typescript
const outerTrx = await sql.transaction();
await sql.from(User, { trx: outerTrx }).insert({ name: "John" });

try {
  await outerTrx.nestedTransaction(async (innerTrx) => {
    await sql.from(User, { trx: innerTrx }).insert({ name: "Jane" });
  });
} catch (error) {
  // Only the savepoint rolled back
}

await outerTrx.commit();
```

Passing `isolationLevel` to a nested call has no effect: it is a savepoint on the outer connection, which keeps its own level. Hysteria logs a warning when a level is requested and dropped.

## Concurrent transactions

Independent `transaction()` calls run on separate connections and can be committed independently:

```typescript
const trx1 = await sql.transaction();
const trx2 = await sql.transaction();

await sql.from(User, { trx: trx1 }).insert({ name: "John" });
await sql.from(User, { trx: trx2 }).insert({ name: "Jane" });

await trx1.commit();
await trx2.commit();
```

## Global transactions

A global transaction applies to every query on a `SqlDataSource` instance. It is intended for integration tests, not production.

```typescript
await sql.startGlobalTransaction();
await sql.from(User).insert({ name: "John" });
await sql.commitGlobalTransaction();
```

```typescript
await sql.startGlobalTransaction();
await sql.from(User).insert({ name: "John" });
await sql.rollbackGlobalTransaction();
```

Starting a global transaction while another is active throws `GLOBAL_TRANSACTION_ALREADY_STARTED`.

## Error handling and transaction state

Commit or roll back an inactive transaction with `throwErrorOnInactiveTransaction`:

```typescript
const trx = await sql.transaction();
await trx.rollback();
await trx.rollback({ throwErrorOnInactiveTransaction: true }); // Throws HysteriaError
```

The default is `false`, which logs a warning and returns silently.

## The @atomic decorator

`@atomic` wraps an async class method in a transaction with CLS propagation. It commits when the method resolves and rolls back when it throws. Enable `experimentalDecorators` in `tsconfig.json`.

```typescript
import { SqlDataSource, atomic } from "hysteria-orm";

class UserService {
  sql = new SqlDataSource({ type: "postgres" /* ... */ });

  @atomic()
  async createUser(data: UserData): Promise<User> {
    const user = await this.sql.from(User).insert(data);
    await this.sql.from(Profile).insert({ userId: user.id });
    return user;
  }
}
```

### Resolving the data source

The decorator resolves the `SqlDataSource` in this order:

1. The `dataSource` option.
2. `atomic.sqlDataSource` (global default).
3. `this.sql`.

```typescript
// Custom property name
@atomic({ dataSource: "db" })
async createUser(data: UserData) { /* ... */ }

// Getter function
@atomic({ dataSource: (instance) => instance._sql })
async createUser(data: UserData) { /* ... */ }

// Direct instance
@atomic({ dataSource: db })
async createUser(data: UserData) { /* ... */ }
```

```typescript
import { atomic } from "hysteria-orm";

atomic.sqlDataSource = new SqlDataSource({ type: "postgres" /* ... */ });
await atomic.sqlDataSource.connect();
```

### Options

| Option           | Type                                                            | Description                                         |
| ---------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| `dataSource`     | `string \| SqlDataSource \| ((instance: any) => SqlDataSource)` | Where to find the data source. Defaults to `"sql"`. |
| `isolationLevel` | `TransactionIsolationLevel`                                     | Transaction isolation level.                        |

A legacy overload accepts the property name and isolation level directly: `@atomic("db", "SERIALIZABLE")`.

### Requirement: CLS must be enabled

`@atomic` requires the resolved `SqlDataSource` to have CLS enabled (`clsEnabled: true`, the default). With `clsEnabled: false` it throws `HysteriaError` with code `ATOMIC_CLS_DISABLED`.

```typescript
const sql = new SqlDataSource({ type: "postgres", clsEnabled: false });
// @atomic() on a class using this data source throws ATOMIC_CLS_DISABLED
```

If no data source can be resolved, the decorator throws `ATOMIC_DATASOURCE_RESOLUTION_FAILED`. Nested `@atomic` calls create savepoints, the same as a `sql.transaction()` nested inside an active transaction.

:::note
SQLite `:memory:` databases create a new empty database per connection. Transactions may not see tables created on the main connection. Use `file::memory:?cache=shared` or a file database for transactional SQLite tests.
:::

:::caution
Global transactions mutate data-source-wide state. Use them only in tests.
:::

## See also

- [SQL ORM Introduction](/databases/sql/introduction)
- [Caching](/databases/sql/advanced/caching)
- [Read Replication](/databases/sql/advanced/replication)
- [Query Observers](/databases/sql/advanced/observers)
