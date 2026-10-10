---
title: Caching
description: Cache expensive query results with in-memory or Redis adapters in Hysteria ORM.
keywords: [hysteria-orm, caching, cache adapter, redis, in-memory, performance]
---

# Caching

Hysteria ORM can cache expensive computations, database queries, or any async operation. Caching is configured per `SqlDataSource` through the `cacheStrategy` option. Connection options are covered in [SQL ORM Introduction](/databases/sql/introduction).

```typescript
import { SqlDataSource, InMemoryAdapter } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres" /* connection options: see SQL ORM Introduction */,
  cacheStrategy: {
    cacheAdapter: new InMemoryAdapter(),
    keys: {
      appConfig: async () => fetchAppConfiguration(),
      userById: async (userId: string) =>
        sql.from(User).where("id", userId).one(),
    },
  },
});

await sql.connect();
```

## Cache adapters

### InMemoryAdapter

The default adapter. It stores values in a `Map` and is intended for development, tests, or single-instance applications. It is imported from `hysteria-orm` and used automatically when no adapter is provided.

### RedisCacheAdapter

An adapter for distributed, multi-instance deployments.

```typescript
import { SqlDataSource, RedisCacheAdapter } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres" /* ... */,
  cacheStrategy: {
    cacheAdapter: new RedisCacheAdapter({
      host: "localhost",
      port: 6379,
      username: "default",
      password: "your-password",
      db: 0,
    }),
    keys: {
      appConfig: async () => fetchAppConfiguration(),
    },
  },
});
```

:::note
`RedisCacheAdapter` requires the `ioredis` package to be installed in your project.
:::

## Defining cache keys

`cacheStrategy.keys` maps a key name to an async handler that computes the value on a cache miss.

```typescript
const keys = {
  // No arguments
  appConfig: async () => fetchAppConfiguration(),

  // One argument
  userById: async (userId: string) => sql.from(User).where("id", userId).one(),

  // Multiple arguments
  searchResults: async (query: string, page: number, limit: number) =>
    sql
      .from(Product)
      .where("name", "LIKE", `%${query}%`)
      .limit(limit)
      .offset((page - 1) * limit)
      .many(),
};

const sql = new SqlDataSource({ type: "postgres", cacheStrategy: { keys } });
```

## Using the cache

### `useCache()`

```typescript
async useCache<K extends keyof C>(key: K, ...args: Parameters<C[K]>): Promise<UseCacheReturnType<C, K>>;
async useCache<K extends keyof C>(key: K, ttl: number, ...args: Parameters<C[K]>): Promise<UseCacheReturnType<C, K>>;
```

Returns the cached value or computes and caches it on a miss.

```typescript
const config = await sql.useCache("appConfig");
const user = await sql.useCache("userById", "user-123");
const results = await sql.useCache("searchResults", "laptop", 1, 10);
```

A miss inside a transaction is computed and returned but not written back. The value came from that transaction's view of the data, which can include rows it has not committed, so it does not belong in a cache shared with every other caller. Reads still hit the cache, so a value cached before the transaction started is served normally.

### TTL overload

Pass a TTL in milliseconds as the first argument after the key. A leading number is treated as the TTL only when the remaining arguments exactly match the handler's arity, so numeric arguments still work.

```typescript
const config = await sql.useCache("appConfig", 300_000); // 5 minutes
const user = await sql.useCache("userById", 60_000, "user-123");
const results = await sql.useCache("searchResults", 30_000, "laptop", 1, 10);
```

:::tip
When the TTL is `0` or omitted, the value is cached until it is invalidated.
:::

### `invalidCache()`

Removes a specific cached entry. Cache keys are hashed from their arguments, so invalidating one argument combination leaves the others intact.

```typescript
await sql.invalidCache("appConfig");
await sql.invalidCache("userById", "user-123");
```

### `invalidateAllCache()`

Removes every cached entry for a key regardless of arguments.

```typescript
await sql.invalidateAllCache("userById");
```

### Argument-based caching

The cache key includes a hash of the handler arguments, so different arguments are cached separately.

```typescript
const user1 = await sql.useCache("userById", "user-1");
const user2 = await sql.useCache("userById", "user-2");

await sql.invalidCache("userById", "user-1");
// user2 remains cached
```

Objects and arrays are supported:

```typescript
const keys = {
  filteredProducts: async (filter: { category: string; minPrice: number }) =>
    sql
      .from(Product)
      .where("category", filter.category)
      .where("price", ">=", filter.minPrice)
      .many(),
};

await sql.useCache("filteredProducts", {
  category: "electronics",
  minPrice: 100,
});
await sql.useCache("filteredProducts", {
  category: "electronics",
  minPrice: 200,
});
```

## Type safety

`useCache` infers the return type from the handler and enforces the handler's argument types.

```typescript
const keys = {
  userById: async (id: string) => ({ id, name: "John" }),
  sum: async (a: number, b: number) => a + b,
};

const sql = new SqlDataSource({ type: "postgres", cacheStrategy: { keys } });

const user = await sql.useCache("userById", "123"); // { id: string; name: string }
const total = await sql.useCache("sum", 1, 2); // number
// await sql.useCache("sum", 1);            // TypeScript error: expected 2 arguments
// await sql.useCache("sum", "1", "2");     // TypeScript error: arguments must be numbers
```

## Error handling

If a handler throws, the error propagates and nothing is cached, so the next call retries.

```typescript
try {
  await sql.useCache("riskyOperation");
} catch (error) {
  // Not cached; a later call will compute again
}
```

## Custom cache adapter

Implement the `CacheAdapter` interface to use your own store.

```typescript
import { CacheAdapter } from "hysteria-orm";

export class MyCustomAdapter implements CacheAdapter {
  async get<T = void>(key: string): Promise<T> {
    // Return the cached value or undefined
  }

  async set<T = any>(key: string, data: T, ttl?: number): Promise<void> {
    // Store the value, optionally with a TTL in milliseconds
  }

  async invalidate(key: string): Promise<void> {
    // Remove a single value
  }

  async invalidateAll(key: string): Promise<void> {
    // Remove all values whose key starts with the given prefix
  }

  // Optional
  async disconnect(): Promise<void> {
    // Called when SqlDataSource disconnects
  }
}
```

## Using with other connections

Caching works on any `SqlDataSource` instance, including secondary connections and temporary connections created with `SqlDataSource.useConnection`. The Redis connection is closed when the data source disconnects. A transaction does not close it: transactions run on an internal clone that shares the adapter, and tearing that clone down is bookkeeping rather than a disconnect, so it will not pull the client out from under your other data sources.

```typescript
await SqlDataSource.useConnection(
  {
    type: "sqlite",
    database: ":memory:",
    cacheStrategy: {
      cacheAdapter: new InMemoryAdapter(),
      keys: { computeValue: async () => "computed" },
    },
  },
  async (tempSql) => {
    const value = await tempSql.useCache("computeValue");
  },
);
```

## Best practices

1. Use descriptive key names.
2. Set TTLs that match how fresh the data must be.
3. Invalidate related keys after mutations. For transaction-aware writes, see [Transactions](/databases/sql/advanced/transactions).
4. Use `RedisCacheAdapter` in production; `InMemoryAdapter` state is not shared across instances.
5. Handle handler errors, including cache misses that should fail loudly.

## See also

- [SQL ORM Introduction](/databases/sql/introduction)
- [Transactions](/databases/sql/advanced/transactions)
- [Query Observers](/databases/sql/advanced/observers)
