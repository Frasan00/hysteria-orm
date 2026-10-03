---
title: Model Embedding
description: Attach models to a SqlDataSource for schema awareness and the sql.from(Model) API in Hysteria ORM.
keywords:
  [hysteria-orm, model embedding, embedded models, sql.from, composition]
---

# Model embedding

Passing models to a `SqlDataSource` makes the instance schema-aware and enables `sql.from(Model)` for typed queries across that connection.

## Basic usage

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

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  database: "mydb",
  models: { User, Post },
});

await sql.connect();

const users = await sql.from(User).many();
const posts = await sql.from(Post).many();
```

Embedding is also what powers `sql.models`, where accessing a key returns a fresh query builder:

```typescript
const users = await sql.models.User.many();
```

## Secondary and cloned connections

Models are declared on a per-instance basis, so a secondary or cloned connection must be given its own `models` map to expose `sql.from(Model)`.

```typescript
const replica = new SqlDataSource({
  type: "postgres",
  host: "replica.db.com",
  database: "mydb",
  models: { User, Post },
});

await replica.connect();
const users = await replica.from(User).many();
```

For global transactions, rolling back writes, and connection reuse on secondary connections, see [Transactions](/databases/sql/advanced/transactions).

## Error handling

A model key that collides with an existing `SqlDataSource` property or method throws a `HysteriaError`. Avoid reserved names such as `connect`, `disconnect`, `transaction`, and `schema`.

```typescript
// Throws: 'connect' is a reserved method
new SqlDataSource({
  type: "postgres",
  models: { connect: User },
});

// Works
new SqlDataSource({
  type: "postgres",
  models: { User, Post },
});
```

## Best practices

1. Use descriptive model keys that reflect the table's purpose.
2. Avoid reserved keywords as model keys.
3. Give each secondary or cloned connection the models it needs.
4. Handle `HysteriaError` when constructing instances with embedded models.

## See also

- [Defining Models](/databases/sql/models/define-model)
- [Transactions](/databases/sql/advanced/transactions)
- [SQL ORM Introduction](/databases/sql/introduction)
