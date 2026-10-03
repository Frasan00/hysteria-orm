---
title: Collection Methods
description: Insert, find, update, and delete MongoDB documents through mongo.from(Collection) in Hysteria ORM.
keywords: [hysteria-orm, MongoDB methods, CRUD, document operations]
---

# Collection methods

CRUD operations go through `mongo.from(Collection)`. Set up a connection and a collection first (see [MongoDB Introduction](/databases/nosql/mongodb/introduction) and [Defining Collections](/databases/nosql/mongodb/collections)).

```typescript
import { MongoDataSource, defineCollection, prop } from "hysteria-orm";

const User = defineCollection("users", {
  properties: {
    name: prop.string(),
    email: prop.string(),
  },
});

const mongo = new MongoDataSource({
  url: "mongodb://root:root@localhost:27017",
});
await mongo.connect();
```

## CRUD methods

### `find`

Fetch multiple documents.

```typescript
const users = await mongo
  .from(User)
  .find({ where: { email: "test@example.com" } });
```

### `findOne`

Fetch a single document, or `null`.

```typescript
const user = await mongo
  .from(User)
  .findOne({ where: { email: "test@example.com" } });
```

### `findOneOrFail`

Fetch a single document or throw when none matches. Pass `customError` to throw your own error.

```typescript
const user = await mongo
  .from(User)
  .findOneOrFail({ where: { email: "test@example.com" } });
```

### `insert`

Insert one document and return the serialized record.

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

## Raw collection access

Access the underlying MongoDB driver collection directly:

```typescript
const rawCollection = mongo.getCurrentConnection().db().collection("users");
```

## Untyped queries

Pass a string to `mongo.from()` to query any collection without a typed model:

```typescript
const results = await mongo.from("users").many();
```

## Best practices

- Prefer `mongo.from(Collection)` so results are typed and hooks run.
- Use `findOneOrFail` for required lookups.

## See also

- [MongoDB Query Builder](/databases/nosql/mongodb/query-builder)
- [Sessions & Transactions](/databases/nosql/mongodb/sessions)
