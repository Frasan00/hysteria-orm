---
title: MongoDB Introduction
description: Define MongoDB collections, run typed CRUD and query-builder operations, and use sessions with Hysteria ORM.
keywords: [hysteria-orm, MongoDB, NoSQL, document database, collections]
---

# MongoDB introduction

:::warning Experimental
MongoDB support is experimental. Some features may be missing or unstable.
:::

Hysteria ORM provides experimental MongoDB support with a fluent API close to SQL models: define collections, run CRUD operations, and build queries with chaining.

## Key features

- Functional collection definitions with `defineCollection` and `prop`
- Type-safe documents and filters
- Fluent query builder with filtering and sorting
- Session and transaction support on replica sets
- Automatic mapping of `id` to MongoDB `_id`

## Connecting

Create a `MongoDataSource` and connect before querying. Omit `url` to read `MONGO_URL` from the environment; see [Setup & Configuration](/getting-started/setup) for the shared connection modes, including `lazyLoad`.

```typescript
import { MongoDataSource } from "hysteria-orm";

const mongo = new MongoDataSource({
  url: "mongodb://root:root@localhost:27017",
});

await mongo.connect();
```

Pass driver options and logging through the constructor:

```typescript
const mongo = new MongoDataSource({
  url: "mongodb://root:root@localhost:27017",
  logs: true,
  options: {
    maxPoolSize: 10,
    minPoolSize: 5,
  },
});
```

Close the connection when you are done:

```typescript
await mongo.disconnect();
```

## Example usage

```typescript
import { MongoDataSource, defineCollection, prop } from "hysteria-orm";

const User = defineCollection("users", {
  properties: {
    name: prop.string(),
    email: prop.string(),
    age: prop.number(),
    isActive: prop.boolean(),
  },
});

const mongo = new MongoDataSource({
  url: "mongodb://root:root@localhost:27017",
});
await mongo.connect();

const user = await mongo
  .from(User)
  .insert({ name: "John", email: "john@test.com" });

const users = await mongo.from(User).find();
const found = await mongo.from(User).findOne({ where: { id: user.id } });

await mongo.disconnect();
```

## See also

- [Defining Collections](/databases/nosql/mongodb/collections)
- [Collection Methods](/databases/nosql/mongodb/methods)
- [MongoDB Query Builder](/databases/nosql/mongodb/query-builder)
- [Sessions & Transactions](/databases/nosql/mongodb/sessions)
