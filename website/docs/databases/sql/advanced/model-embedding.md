---
title: Model Embedding
description: "Model embedding patterns for embedding models within data sources in Hysteria ORM."
keywords: [hysteria-orm, model embedding, embedded models, composition]
sidebar_position: 6
---

# Model Embedding

Model embedding allows you to pass models directly to a SQL data source instance, enabling schema management and providing a convenient `sql.from(Model)` API.

## Overview

When you embed models in a SQL data source instance, the data source knows about your schema and you can use `sql.from(Model)` to query them.

## Basic Usage

### Connecting with Embedded Models

```typescript
import { SqlDataSource, defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string(),
  },
});

const Post = defineModel("posts", {
  columns: {
    id: col.increment(),
    title: col.string(),
    userId: col.integer(),
  },
});

// Create instance with embedded models
const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  database: "mydb",
  models: { User, Post },
});

await sql.connect();

// Query models via sql.from()
const users = await sql.from(User).many();
const posts = await sql.from(Post).many();
```

### Using with Transactions

```typescript
await sql.startGlobalTransaction();
await sql.from(User).insert({ name: "John" });

const user = await sql.from(User).one();
expect(user).toBeDefined();
expect(user?.name).toBe("John");

await sql.rollbackGlobalTransaction();
await sql.disconnect();
```

### Using with Secondary Connections

```typescript
// Create a secondary connection with embedded models
const anotherSql = new SqlDataSource({
  type: "postgres",
  host: "replica.db.com",
  database: "mydb",
  models: { User, Post },
});

await anotherSql.connect();

await anotherSql.startGlobalTransaction();
await anotherSql.from(User).insert({ name: "John" });

const user = await anotherSql.from(User).one();

await anotherSql.rollbackGlobalTransaction();
await anotherSql.disconnect();
```

### Using with Cloned Connections

```typescript
const clonedSql = await sql.clone({ shouldRecreatePool: true });
await clonedSql.startGlobalTransaction();
await clonedSql.from(User).insert({ name: "John" });

const user = await clonedSql.from(User).one();

await clonedSql.rollbackGlobalTransaction();
await clonedSql.disconnect();
```

## Error Handling

### Duplicate Model Keys

The most common error occurs when you try to use a model key that conflicts with existing sql properties or methods. The following will throw a `HysteriaError`:

```typescript
// ❌ This will throw an error - 'connect' is a reserved method
new SqlDataSource({
  type: "postgres",
  models: {
    connect: User, // Error: Duplicate model keys while instantiating models
  },
});

// ✅ This works correctly
new SqlDataSource({
  type: "postgres",
  models: { User, Post },
});
```

## Best Practices

1. **Use descriptive model keys**: Choose meaningful names for your model keys that reflect the model's purpose.

2. **Avoid reserved keywords**: Check that your model keys don't conflict with sql methods or properties.

3. **Consider connection scope**: Use embedded models when you need model access within a specific connection context.

4. **Error handling**: Always handle potential `HysteriaError` exceptions when creating instances with embedded models.
