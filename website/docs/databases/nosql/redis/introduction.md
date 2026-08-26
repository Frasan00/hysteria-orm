---
title: Redis Introduction
description: "Redis support in Hysteria ORM: key-value operations, caching, pub/sub."
keywords: [hysteria-orm, Redis, key-value store, caching, pub/sub]
sidebar_position: 1
---

# Redis Introduction (Experimental)

Hysteria ORM provides a simple, type-safe interface for Redis, supporting instance-based connections.

## Key Features

- Built on top of `ioredis` (dynamically imported — no module-level dependency)
- Instance-based connections
- Type-safe set/get for strings, numbers, booleans, objects, arrays, buffers
- Expiry, consume, and flush operations
- LazyLoad support for auto-connecting on first command
- Access to raw ioredis connection

## Connecting

```typescript
import { redis as RedisDataSource } from "hysteria-orm";

// Create an instance with connection options
const redis = new RedisDataSource({
  host: "localhost",
  port: 6379,
  username: "default",
  password: "root",
});

// Explicitly connect
await redis.connect();

// Use redis
await redis.set("key", "value", 1000);
const value = await redis.get<string>("key");
```

### LazyLoad

By default, you must call `.connect()` before using any Redis command. With `lazyLoad: true`, the connection is established automatically on the first command:

```typescript
const redis = new RedisDataSource({
  host: "localhost",
  port: 6379,
  lazyLoad: true,
});

// No explicit connect() needed — auto-connects on first command
await redis.set("key", "value");
const value = await redis.get<string>("key");
```

### Multiple Instances

Each `RedisDataSource` instance maintains its own connection:

```typescript
const cache = new RedisDataSource({ host: "localhost", port: 6379, db: 0 });
const sessions = new RedisDataSource({ host: "localhost", port: 6379, db: 1 });

await cache.connect();
await sessions.connect();
```

### Disconnecting

```typescript
await redis.disconnect();
```

---

Next: [Redis Methods](./methods.md)
