---
title: Redis Introduction
description: Connect to Redis with Hysteria ORM for typed get/set operations, expiry, and instance-based connections.
keywords: [hysteria-orm, Redis, key-value store, caching, ioredis]
---

# Redis introduction

:::warning Experimental
Redis support is experimental and may change in future versions.
:::

Hysteria ORM provides a small, type-safe Redis client built on top of `ioredis`, which is imported dynamically so it stays an optional dependency.

## Key features

- `ioredis` loaded lazily at runtime
- Instance-based connections
- Type-safe `set`/`get` for strings, numbers, booleans, objects, arrays, and buffers
- Expiry, consume, and flush operations
- Access to the raw `ioredis` connection

## Connecting

Create a `RedisDataSource` with connection options and call `connect()` before issuing commands. Connection modes, including `lazyLoad`, are shared across data sources; see [Setup & Configuration](/getting-started/setup).

```typescript
import { redis as RedisDataSource } from "hysteria-orm";

const redis = new RedisDataSource({
  host: "localhost",
  port: 6379,
  username: "default",
  password: "root",
});

await redis.connect();

await redis.set("key", "value", 1000);
const value = await redis.get<string>("key");
```

Each instance maintains its own connection, so you can target different databases:

```typescript
const cache = new RedisDataSource({ host: "localhost", port: 6379, db: 0 });
const sessions = new RedisDataSource({ host: "localhost", port: 6379, db: 1 });

await cache.connect();
await sessions.connect();
```

Close a connection with `disconnect()`:

```typescript
await redis.disconnect();
```

## See also

- [Redis Methods](/databases/nosql/redis/methods)
- [Setup & Configuration](/getting-started/setup)
