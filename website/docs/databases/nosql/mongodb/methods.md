---
title: Collection Methods
description: "MongoDB collection methods: insert, update, delete, find in Hysteria ORM."
keywords: [hysteria-orm, MongoDB methods, CRUD, document operations]
sidebar_position: 3
---

# Collection Methods

All CRUD operations go through the `mongo.from(Collection)` API.

## Setup

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
  },
});
```

## CRUD Methods

### `find`

Fetch multiple documents.

```typescript
const users = await mongo
  .from(User)
  .find({ where: { email: "test@example.com" } });
```

### `findOne`

Fetch a single document.

```typescript
const user = await mongo
  .from(User)
  .findOne({ where: { email: "test@example.com" } });
```

### `findOneOrFail`

Fetch a single document or throw if not found.

```typescript
const user = await mongo
  .from(User)
  .findOneOrFail({ where: { email: "test@example.com" } });
```

### `insert`

Insert a new document.

```typescript
const user = await mongo
  .from(User)
  .insert({ name: "Test", email: "test@example.com" });
```

### `insertMany`

Insert multiple documents.

```typescript
const users = await mongo.from(User).insertMany([
  { name: "Test 1", email: "test1@example.com" },
  { name: "Test 2", email: "test2@example.com" },
]);
```

### `updateRecord`

Update a document by id.

```typescript
user.name = "Updated";
const updated = await mongo.from(User).updateRecord(user);
```

### `deleteRecord`

Delete a document by id.

```typescript
await mongo.from(User).deleteRecord(user);
```

## Raw Collection Access

Access the underlying MongoDB driver collection directly:

```typescript
const rawCollection = mongo.getCurrentConnection().db().collection("users");
```

## Untyped Raw Queries

Use `mongo.from()` with a string for untyped queries against any collection:

```typescript
const results = await mongo.from("users").many();
```

## Best Practices

- Always use `mongo.from(Collection)` for database operations.
- Use `findOneOrFail` for required lookups.

---

Next: [MongoDB Query Builder](./query-builder.md)
