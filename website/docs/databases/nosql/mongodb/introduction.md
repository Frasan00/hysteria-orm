---
title: MongoDB Introduction
description: "MongoDB support in Hysteria ORM: collections, queries, sessions, and transactions."
keywords: [hysteria-orm, MongoDB, NoSQL, document database, collections]
sidebar_position: 1
---

# MongoDB Introduction (Experimental)

Hysteria ORM provides experimental support for MongoDB, allowing you to define collections, perform CRUD operations, and use a fluent query builder with a similar API to SQL models.

## Key Features

- Functional collection definition with `defineCollection` and `prop`
- Type-safe queries and models
- Query builder with chaining and filtering
- Session and transaction support (with replica sets)
- Automatic mapping of `id` to MongoDB `_id`

> **Note:** MongoDB support is experimental. Some features may be missing or unstable.

## Connecting to MongoDB

```typescript
import { MongoDataSource } from "hysteria-orm";

// Create instance with configuration
const mongo = new MongoDataSource({
  url: "mongodb://root:root@localhost:27017",
});

// Explicitly connect before querying
await mongo.connect();
const users = await mongo.from(User).find();

// Or use lazyLoad to auto-connect on first query
const lazyMongo = new MongoDataSource({
  url: "mongodb://root:root@localhost:27017",
  lazyLoad: true,
});
const users = await lazyMongo.from(User).find(); // auto-connects
```

If no URL is provided, the `MONGO_URL` environment variable is used:

```typescript
// Uses MONGO_URL from environment
const mongo = new MongoDataSource();
await mongo.connect();
const users = await mongo.from(User).find();
```

### Configuration Options

```typescript
const mongo = new MongoDataSource({
  url: "mongodb://root:root@localhost:27017",
  logs: true,
  options: {
    // MongoDB driver options (MongoClientOptions)
    maxPoolSize: 10,
    minPoolSize: 5,
  },
});
await mongo.connect();
```

### Closing Connections

```typescript
await mongo.disconnect();
```

## Example Usage

```typescript
import { MongoDataSource, defineCollection, prop } from "hysteria-orm";

const mongo = new MongoDataSource({
  url: "mongodb://root:root@localhost:27017",
});
await mongo.connect();

const User = defineCollection("users", {
  properties: {
    name: prop.string(),
    email: prop.string(),
    age: prop.number(),
    isActive: prop.boolean(),
  },
});

// Insert
const user = await mongo
  .from(User)
  .insert({ name: "John", email: "john@test.com" });

// Find
const users = await mongo.from(User).find();
const found = await mongo.from(User).findOne({ where: { id: user.id } });

// Disconnect
await mongo.disconnect();
```

---

Next: [Defining Collections](./collections.md)
