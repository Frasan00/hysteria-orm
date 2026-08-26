---
title: Caching
description: "Query result caching strategies and cache adapters in Hysteria ORM."
keywords: [hysteria-orm, caching, query cache, performance]
sidebar_position: 5
---

# Caching

Hysteria ORM provides a flexible caching system that allows you to cache expensive computations, database queries, or any async operations. The caching system is fully integrated with `SqlDataSource` and supports multiple cache adapters.

## Cache Adapters

Hysteria ORM comes with two built-in cache adapters:

### InMemoryAdapter

A simple in-memory cache adapter that stores values in a `Map`. Ideal for development, testing, or single-instance applications.

```typescript
import { SqlDataSource, InMemoryAdapter } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  database: "mydb",
  cacheStrategy: {
    cacheAdapter: new InMemoryAdapter(), // default adapter can be omitted
    keys: {
      // Define your cache keys here
    },
  },
});

await sql.connect();
```

### RedisCacheAdapter

A production-ready Redis cache adapter using `ioredis`. Perfect for distributed applications and multi-instance deployments.

```typescript
import { SqlDataSource, RedisCacheAdapter } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  database: "mydb",
  cacheStrategy: {
    cacheAdapter: new RedisCacheAdapter({
      host: "localhost",
      port: 6379,
      username: "default",
      password: "your-password",
      db: 0,
    }),
    keys: {
      // Define your cache keys here
    },
  },
});

await sql.connect();
```

:::note
The `RedisCacheAdapter` requires the `ioredis` package to be installed in your project.
:::

## Defining Cache Keys

Cache keys are defined as async handler functions in the `cacheStrategy.keys` configuration. Each key maps to a function that computes the value when it's not cached.

```typescript
const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  database: "mydb",
  cacheStrategy: {
    cacheAdapter: new InMemoryAdapter(),
    keys: {
      // Handler with no arguments
      appConfig: async () => {
        return fetchAppConfiguration();
      },

      // Handler with arguments
      userById: async (userId: string) => {
        return sql.from(User).where("id", userId).one();
      },

      // Handler with multiple arguments
      searchResults: async (query: string, page: number, limit: number) => {
        return sql
          .from(Product)
          .where("name", "LIKE", `%${query}%`)
          .limit(limit)
          .offset((page - 1) * limit)
          .many();
      },
    },
  },
});

await sql.connect();
```

## Using the Cache

### Basic Usage

Use `useCache` to get a cached value or compute and cache it if not present:

```typescript
// Handler with no arguments
const config = await sql.useCache("appConfig");

// Handler with arguments
const user = await sql.useCache("userById", "user-123");

// Handler with multiple arguments
const results = await sql.useCache("searchResults", "laptop", 1, 10);
```

### With TTL (Time-To-Live)

You can specify a TTL in milliseconds as the first argument after the key:

```typescript
// Cache for 5 minutes (300,000 ms)
const config = await sql.useCache("appConfig", 300_000);

// Cache user for 1 minute with arguments
const user = await sql.useCache("userById", 60_000, "user-123");

// Cache search results for 30 seconds
const results = await sql.useCache("searchResults", 30_000, "laptop", 1, 10);
```

:::tip
When TTL is `0` or not provided, the value is cached indefinitely (or until manually invalidated).
:::

### Invalidating Cache

Use `invalidCache` to remove a cached value:

```typescript
// Invalidate a key with no arguments
await sql.invalidCache("appConfig");

// Invalidate a specific cached entry (with arguments)
await sql.invalidCache("userById", "user-123");
```

:::info
Cache keys are automatically hashed based on their arguments, so invalidating `userById` with `"user-123"` only removes that specific user's cache, not all cached users.
:::

### Invalidating All Cache Entries

Use `invalidateAllCache` to remove all cached entries for a given key regardless of the arguments:

```typescript
await sql.invalidateAllCache("appConfig");
```

## Argument-Based Caching

The caching system automatically generates unique cache keys based on the arguments passed to the handler. This means the same cache key with different arguments will store separate cached values:

```typescript
// These are cached separately
const user1 = await sql.useCache("userById", "user-1");
const user2 = await sql.useCache("userById", "user-2");

// Invalidating one doesn't affect the other
await sql.invalidCache("userById", "user-1");
// user2 is still cached
```

### Complex Arguments

The caching system supports complex arguments including objects and arrays:

```typescript
const keys = {
  filteredProducts: async (filter: { category: string; minPrice: number }) => {
    return sql
      .from(Product)
      .where("category", filter.category)
      .where("price", ">=", filter.minPrice)
      .many();
  },
};

// These are cached separately
await sql.useCache("filteredProducts", {
  category: "electronics",
  minPrice: 100,
});
await sql.useCache("filteredProducts", {
  category: "electronics",
  minPrice: 200,
});
```

## Type Safety

The cache system is fully type-safe. TypeScript will infer the return type of `useCache` based on the handler's return type, and it will enforce the correct arguments:

```typescript
const keys = {
  userById: async (id: string) => {
    return { id, name: "John" };
  },
  sum: async (a: number, b: number) => {
    return a + b;
  },
};

// TypeScript knows this returns { id: string, name: string }
const user = await sql.useCache("userById", "123");

// TypeScript enforces correct argument types
const result = await sql.useCache("sum", 1, 2); // Returns number

// TypeScript error: Expected 2 arguments
await sql.useCache("sum", 1);

// TypeScript error: Argument must be number
await sql.useCache("sum", "1", "2");
```

## Error Handling

If a cache handler throws an error, the error is propagated and the value is not cached:

```typescript
const keys = {
  riskyOperation: async () => {
    const result = await someExternalApi();
    if (!result.success) {
      throw new Error("API call failed");
    }
    return result.data;
  },
};

try {
  await sql.useCache("riskyOperation");
} catch (error) {
  // Error is propagated, nothing is cached
  // Next call will attempt to compute again
}
```

## Using with Secondary Connections

Cache works with secondary connections:

```typescript
const secondaryDb = new SqlDataSource({
  type: "mysql",
  host: "localhost",
  database: "secondary",
  cacheStrategy: {
    cacheAdapter: new RedisCacheAdapter({ host: "localhost", port: 6379 }),
    keys: {
      expensiveQuery: async () => {
        return await runExpensiveQuery();
      },
    },
  },
});

await secondaryDb.connect();
const result = await secondaryDb.useCache("expensiveQuery", 60_000);

// Don't forget to disconnect (this also closes the Redis connection)
await secondaryDb.disconnect();
```

## Using with useConnection

Cache is also supported within `useConnection`:

```typescript
const tempSql = new SqlDataSource({
  type: "sqlite",
  database: ":memory:",
  cacheStrategy: {
    cacheAdapter: new InMemoryAdapter(),
    keys: {
      computeValue: async () => "computed",
    },
  },
});

await tempSql.connect();
const value = await tempSql.useCache("computeValue");
await tempSql.disconnect();
```

## Custom Cache Adapter

You can create your own cache adapter by implementing the `CacheAdapter` interface:

```typescript
import { CacheAdapter } from "hysteria-orm";

export class MyCustomAdapter implements CacheAdapter {
  async get<T = void>(key: string): Promise<T> {
    // Return cached value or undefined
  }

  async set<T = any>(key: string, data: T, ttl?: number): Promise<void> {
    // Store the value, optionally with TTL in milliseconds
  }

  async invalidate(key: string): Promise<void> {
    // Remove the cached value
  }

  // Optional
  async disconnect(): Promise<void> {
    // Clean up connections when SqlDataSource disconnects
  }
}
```

## Best Practices

1. **Use meaningful key names**: Choose descriptive names that indicate what's being cached.

2. **Set appropriate TTLs**: Consider how fresh the data needs to be. Use shorter TTLs for frequently changing data.

3. **Invalidate on mutations**: When updating data, remember to invalidate related cache entries.

4. **Use Redis for production**: The `InMemoryAdapter` doesn't share state across instances. Use `RedisCacheAdapter` for distributed applications.

5. **Handle cache misses gracefully**: The handler is called on cache miss, so ensure it handles errors appropriately.

```typescript
const keys = {
  userData: async (userId: string) => {
    const user = await sql.from(User).where("id", userId).one();
    if (!user) {
      throw new NotFoundError(`User ${userId} not found`);
    }
    return user;
  },
};

// In your application code
try {
  const user = await sql.useCache("userData", userId);
} catch (error) {
  if (error instanceof NotFoundError) {
    // Handle missing user
  }
  throw error;
}
```

---

See also:

- [Transactions](./transactions.md)
- [CTE](./cte.md)
- [JSON Columns](./json.md)
