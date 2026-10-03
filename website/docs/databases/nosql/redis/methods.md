---
title: Redis Methods
description: Typed Redis commands for keys, hashes, lists, sets, sorted sets, expiry, and pub/sub in Hysteria ORM.
keywords: [hysteria-orm, Redis methods, key-value, caching, pub/sub]
---

# Redis methods

Every method below is an instance method on `RedisDataSource` (imported as `redis`). Set up and connect an instance first; see [Redis Introduction](/databases/nosql/redis/introduction).

## Supported types

Values can be `string`, `number`, `boolean`, `object`, `array`, or `Buffer`. Pass a type argument to `get` and other read methods to control the returned type.

## Keys

```typescript
await redis.set("key", "value", 1000); // expires in 1s
await redis.set("key", { foo: "bar" }, 5000);

const value = await redis.get<string>("key");
const obj = await redis.get<{ foo: string }>("key");

await redis.set("buffer", Buffer.from("value"), 1000);
const buffer = await redis.getBuffer("buffer");

const consumed = await redis.consume<string>("key"); // get and delete
await redis.delete("key");
await redis.flushAll();
```

## Expiry and metadata

```typescript
const exists = await redis.exists("key");
await redis.expire("key", 60);
await redis.expireat("key", Math.floor(Date.now() / 1000) + 60);
await redis.pexpire("key", 60000);
const ttl = await redis.ttl("key");
const pttl = await redis.pttl("key");
await redis.persist("key");
const keys = await redis.keys("prefix:*");
await redis.rename("old", "new");
const type = await redis.type("key");
```

## Lists

```typescript
await redis.lpush("list", "a", "b");
await redis.rpush("list", "c");
const range = await redis.lrange<string>("list", 0, -1);
const len = await redis.llen("list");
const left = await redis.lpop<string>("list");
const right = await redis.rpop<string>("list");
```

## Hashes

```typescript
await redis.hset("hash", "field", "value");
await redis.hmset("hash", { f1: "v1", f2: "v2" });
const val = await redis.hget<string>("hash", "field");
const all = await redis.hgetall<string>("hash");
const multi = await redis.hmget<string>("hash", "f1", "f2");
const exists = await redis.hexists("hash", "field");
const keys = await redis.hkeys("hash");
const len = await redis.hlen("hash");
await redis.hdel("hash", "field");
```

## Sets

```typescript
await redis.sadd("set", "a", "b", "c");
const members = await redis.smembers<string>("set");
await redis.srem("set", "a");
const isMember = await redis.sismember("set", "b");
const card = await redis.scard("set");
const inter = await redis.sinter<string>("set1", "set2");
const union = await redis.sunion<string>("set1", "set2");
const diff = await redis.sdiff<string>("set1", "set2");
```

## Sorted sets

```typescript
await redis.zadd("zset", 1, "a");
await redis.zadd("zset", [
  [2, "b"],
  [3, "c"],
]);
const range = await redis.zrange<string>("zset", 0, -1);
const rev = await redis.zrevrange<string>("zset", 0, -1);
const score = await redis.zscore("zset", "a");
const card = await redis.zcard("zset");
await redis.zrem("zset", "a");
```

## Pub/sub

```typescript
await redis.subscribe(["channel1", "channel2"], (channel, message) => {
  console.log(`${channel}: ${message}`);
});

await redis.psubscribe(["news:*"], (pattern, message) => {
  console.log(`${pattern}: ${message}`);
});

// Publish from a separate instance
await publisher.publish("channel1", "hello");

await redis.unsubscribe("channel1");
await redis.punsubscribe("news:*");
```

## Best practices

- Set expiry on cache keys.
- Pass type arguments for type safety.
- Use separate instances for subscribers and publishers.

## See also

- [Redis Introduction](/databases/nosql/redis/introduction)
- [Utilities & Errors](/utils/api)
