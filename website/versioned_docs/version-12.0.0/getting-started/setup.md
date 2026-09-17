---
title: Setup
description: "Configure Hysteria ORM data source connections for SQL, MongoDB, and Redis databases."
keywords:
  [hysteria-orm, setup, configuration, SqlDataSource, MongoDataSource, Redis]
sidebar_position: 3
---

# Setup

## Environment Variables

Hysteria ORM can be configured using environment variables or direct options. For the full list of supported variables, see **[Environment Variables](./environment.md)**.

## SQL Connection

```typescript
import { SqlDataSource, defineModel, col } from "hysteria-orm";

// Define a model
const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string(),
  },
});

// Create and connect
const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "root",
  password: "root",
  database: "test",
  models: { User },
});
await sql.connect();

// Query
const users = await sql.from(User).find();
await sql.disconnect();
```

You can also use environment variables instead of explicit configuration:

```typescript
const sql = new SqlDataSource();
await sql.connect();
```

For detailed SQL connection options, see [SQL ORM Introduction](../databases/sql/introduction.md).

## MongoDB Connection

```typescript
import { MongoDataSource } from "hysteria-orm";

// Using environment variable (MONGO_URL)
const mongo = new MongoDataSource();
await mongo.connect();

// Or with explicit configuration
const mongo = new MongoDataSource({
  url: "mongodb://root:root@localhost:27017",
});
await mongo.connect();
```

## Redis Connection

```typescript
import { redis } from "hysteria-orm";

await redis.connect({
  host: "localhost",
  port: 6379,
  password: "root",
});
```

---

Next: [Environment](./environment.md)
