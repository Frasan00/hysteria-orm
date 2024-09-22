# Redis

- Redis driver is built on top of ioredis
- it's intended to be a superset that abstracts some logics from the base library maintain all base features

## Envs
```dotenv
REDIS_HOST=127.0.0.1
REDIS_USERNAME=default
REDIS_PORT=6379
REDIS_PASSWORD=root
```

## Connection
- While connecting, user input params will be used first
- If none is passed, Envs will be used instead

```typescript
import { Redis } from "hysteria-orm";

// You can use a Singleton Redis class using it's static methods connecting weith the main class
await Redis.connect({
    host: "localhost",
    port: 6379,
    username: "default",
    password: "root",
    <ioredisConnectionOptions>
});

// You can also get single connections to redis
const redisInstance = await Redis.getConnection({
    host: "localhost",
    port: 6379,
    username: "default",
    password: "password",
    <ioredisConnectionOptions>
});
```

## Setters and Getters
- Redis main class static methods and instance methods can be used in the same way

```typescript
// Storable types
export type RedisStorable =
  | string
  | number
  | boolean
  | Buffer
  | Array<any>
  | Record<string, any>;

// Retrievable types
export type RedisGiveable =
  | string
  | number
  | boolean
  | Record<string, any>
  | Array<any>
  | null;  
```

```typescript
import { Redis } from "hysteria-orm";

// Key, value, expiresIn (in milliseconds)
Redis.set("key", "value", 1000);
// You can specify the type to infer to you variable based on the RedisGiveable types
const value = await Redis.get<string>("key"); // string
const nullableValue = await Redis.get<string | null>("key"); // string | null

// Object
Redis.set("key", { key: "value" }, 1000);
const objectValue = await Redis.get<{ key: string }>("key");

// Number
Redis.set("key", 1, 1000);
const numberValue = await Redis.get<number>("key");

// Booleam
Redis.set("key", true, 1000);
const booleanValue = await Redis.get<boolean>("key");

// Array
Redis.set("key", [1, 2, 3], 1000);
const arrayValue = await Redis.get<number[]>("key");
```

## Buffers
- getBuffer method must be used to retrieve a Buffer,
- Using get<Buffer> will always return you the relative string

```typescript
import { Redis } from "hysteria-orm";

Redis.set("key", Buffer.from("value"), 1000);
const bufferValue = await Redis.getBuffer("key");
```

## Base Features
- You can use all ioredis features using getRawConnection method
```typescript
import { Redis } from "hysteria-orm";

const redisInstance = await Redis.getConnection({
    host: "localhost",
    port: 6379,
    username: "default",
    password: "password",
});

Redis.getRawConnection();
redisInstance.getRawConnection();
```