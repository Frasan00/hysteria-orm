---
title: Atomic Decorator
description: "Declarative transaction wrapper using the @atomic decorator with AsyncLocalStorage auto-propagation in Hysteria ORM."
keywords: [hysteria-orm, transactions, atomic, decorator, cls, async-local-storage]
sidebar_position: 8
---

# Atomic Decorator

The `@atomic` decorator wraps any async class method in a database transaction with automatic CLS (Continuation-Local Storage) propagation. If the method succeeds, the transaction commits; if it throws, the transaction rolls back automatically.

## Setup

```typescript
import { SqlDataSource, defineModel, col, atomic } from "hysteria-orm";

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

Decorate an async method on a class that exposes a `sql` property:

```typescript
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

- Transaction starts before `createUser` executes.
- All queries inside the method auto-detect and use the active transaction via CLS.
- Transaction commits when the method returns.
- Transaction rolls back if the method throws.

## How It Works

`@atomic` leverages the same CLS mechanism as `sql.transaction(callback)`:

1. The decorator wraps the method in `sql.transaction(callback, options)`.
2. The callback is executed inside `AsyncLocalStorage` context.
3. Queries inside the method read the active transaction from async context automatically.
4. Commit or rollback is handled by `SqlDataSource` — no manual `trx.commit()` needed.

## Resolving the SqlDataSource

The decorator resolves the `SqlDataSource` in the following priority order:

1. **Explicit `dataSource` option** (property name string or getter function)
2. **`atomic.sqlDataSource`** (global default)
3. **`this.sql`** (convention fallback on the class instance)

### Default: `this.sql`

```typescript
class UserService {
  sql = new SqlDataSource({ type: "postgres" /* ... */ });

  @atomic()
  async createUser(data: UserData): Promise<User> {
    return await this.sql.from(User).insert(data);
  }
}
```

### Custom Property Name

```typescript
class UserService {
  db = new SqlDataSource({ type: "postgres" /* ... */ });

  @atomic({ dataSource: "db" })
  async createUser(data: UserData): Promise<User> {
    return await this.db.from(User).insert(data);
  }
}
```

### Getter Function

Use a function when the data source is private or computed:

```typescript
class UserService {
  private readonly _sql = new SqlDataSource({ type: "postgres" /* ... */ });

  @atomic({ dataSource: (instance) => instance._sql })
  async createUser(data: UserData): Promise<User> {
    return await this._sql.from(User).insert(data);
  }
}
```

### Direct Instance

Pass a `SqlDataSource` reference directly when it is defined outside the class:

```typescript
const db = new SqlDataSource({ type: "postgres" /* ... */ });

class UserService {
  @atomic({ dataSource: db })
  async createUser(data: UserData): Promise<User> {
    return await db.from(User).insert(data);
  }
}
```

### Global Default

Set `atomic.sqlDataSource` once to avoid repeating it in every service class:

```typescript
import { atomic } from "hysteria-orm";

atomic.sqlDataSource = new SqlDataSource({ type: "postgres" /* ... */ });
await atomic.sqlDataSource.connect();

class UserService {
  @atomic()
  async createUser(data: UserData): Promise<User> {
    // Uses atomic.sqlDataSource automatically
    return await atomic.sqlDataSource!.from(User).insert(data);
  }
}
```

## Isolation Level

Pass an isolation level per decorator:

```typescript
class UserService {
  sql = new SqlDataSource({ type: "postgres" /* ... */ });

  @atomic({ isolationLevel: "SERIALIZABLE" })
  async transferFunds(from: number, to: number, amount: number): Promise<void> {
    await this.sql.from(Account).where({ id: from }).decrement({ balance: amount });
    await this.sql.from(Account).where({ id: to }).increment({ balance: amount });
  }
}
```

## Error Handling

If the decorated method throws, the transaction is rolled back and the error propagates:

```typescript
class UserService {
  sql = new SqlDataSource({ type: "postgres" /* ... */ });

  @atomic()
  async createUser(data: UserData): Promise<User> {
    const user = await this.sql.from(User).insert(data);
    if (!user.email.includes("@")) {
      throw new Error("Invalid email"); // Triggers rollback
    }
    return user;
  }
}
```

## Nested Atomic Calls

Calling another `@atomic` decorated method from within an `@atomic` method creates a nested transaction (savepoint) on the same connection:

```typescript
class PaymentService {
  sql = new SqlDataSource({ type: "postgres" /* ... */ });

  @atomic()
  async chargeUser(userId: number, amount: number): Promise<void> {
    await this.sql.from(Payment).insert({ userId, amount });
  }
}

class OrderService {
  sql = new SqlDataSource({ type: "postgres" /* ... */ });
  payments = new PaymentService();

  @atomic()
  async createOrder(userId: number, items: OrderItem[]): Promise<Order> {
    const order = await this.sql.from(Order).insert({ userId });
    for (const item of items) {
      await this.sql.from(OrderItem).insert({ orderId: order.id, ...item });
    }
    await this.payments.chargeUser(userId, computeTotal(items));
    return order;
  }
}
```

- `createOrder` starts a top-level transaction.
- `chargeUser` opens a savepoint on the same connection.
- If `chargeUser` throws, only the savepoint rolls back; `createOrder` can still commit or roll back independently.

## Compatibility

- Requires `experimentalDecorators: true` in `tsconfig.json`.
- Decorated methods must be `async` and return a `Promise`.
- CLS auto-propagation works identically to `sql.transaction(callback)`.
- Manual `{ trx }` passing is still respected and takes precedence over CLS when both are present.
- Works with all supported SQL dialects (PostgreSQL, MySQL, SQLite, MSSQL, Oracle, CockroachDB, MariaDB).

## CLS Requirement

The `@atomic` decorator **requires** the resolved `SqlDataSource` to have CLS enabled (`clsEnabled: true`, the default). If CLS is disabled, the decorator throws a `HysteriaError` with code `ATOMIC_CLS_DISABLED`:

```typescript
const sql = new SqlDataSource({ type: "postgres", clsEnabled: false /* ... */ });

class UserService {
  sql = sql;

  @atomic()
  async createUser(data: UserData): Promise<User> {
    // HysteriaError: ATOMIC_CLS_DISABLED
    return await this.sql.from(User).insert(data);
  }
}
```

## Notes

- The decorator mutates `descriptor.value` at class definition time; it does not create a new property.
- If the class instance does not expose a resolvable `SqlDataSource`, the decorator throws a `HysteriaError` with code `ATOMIC_DATASOURCE_RESOLUTION_FAILED`.
- `atomic.sqlDataSource` is shared mutable state — useful for singleton data sources, but avoid in multi-tenant or connection-per-request architectures unless isolated explicitly.

---

See also:

- [Transactions](./transactions.md)
- [CTE](./cte.md)
- [Observers](./observers.md)
