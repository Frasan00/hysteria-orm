---
title: Models as DTOs
description: Model and query-result instances are pure data objects; persistence always goes through sql.from(Model).
keywords:
  [
    hysteria-orm,
    DTO,
    data transfer object,
    model instances,
    instance methods,
    query results,
  ]
---

# Models as DTOs

Hysteria ORM models are **pure Data Transfer Objects (DTOs)**: data properties with type safety and no business logic. The same is true of query results. All persistence goes through `sql.from(Model)` on a `SqlDataSource` instance.

## The distinction

| Instance             | Source                       | Shape                                   | Persistence methods |
| -------------------- | ---------------------------- | --------------------------------------- | ------------------- |
| Plain model instance | `new User({ name: "John" })` | Model columns only                      | None                |
| Query result         | `await sql.from(User).one()` | Selected columns (and loaded relations) | None                |

Both are data-only. A query result is what the serializer produced from a database row: a DTO, not an "active record" object. It does not carry `save`, `update`, `delete`, `softDelete`, `refresh`, or `mergeProps`.

:::note
As of 12.0.0 these instance methods no longer exist on query results. They were part of the pre-12 active-record model and were removed in the zero-per-row-JavaScript refactor. The equivalent operations are query-builder methods on `sql.from(Model)`.
:::

## Builder equivalents

Each former instance method maps to an explicit query-builder call:

| Former instance method  | Current builder API                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `user.save()`           | `sql.from(User).save(data)`, upsert by primary key                                               |
| `user.update(data)`     | `sql.from(User).where("id", id).update(data)` or `sql.from(User).updateRecord(id, data)`         |
| `user.delete()`         | `sql.from(User).where("id", id).delete()` or `sql.from(User).deleteRecord(id)`                   |
| `user.softDelete(opts)` | `sql.from(User).where("id", id).softDelete(opts)` or `sql.from(User).softDeleteRecord(id, opts)` |
| `user.refresh()`        | `sql.from(User).refresh(id)`                                                                     |
| `user.mergeProps(data)` | Merge on the DTO with `{ ...user, ...data }` or `new User({ ...user, ...data })`                 |

```typescript
const user = await sql.from(User).findOne({ where: { id: 1 } });
if (user) {
  await sql.from(User).updateRecord(user.id, { name: "Jane" });
  await sql.from(User).deleteRecord(user.id);
}
```

## Working with model data

```typescript
import { SqlDataSource, defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string({ nullable: false }),
  },
});

const sql = new SqlDataSource({ type: "postgres" /* ... */ });
await sql.connect();

// Insert (use plain column keys, no table prefix)
await sql.from(User).insert({ name: "John", email: "john@example.com" });

// Find
const user = await sql.from(User).findOne({ where: { id: 1 } });

// Update
await sql.from(User).updateRecord(user.id, { name: "Jane" });

// Delete
await sql.from(User).deleteRecord(user.id);
```

See [CRUD Operations](/databases/sql/standard-methods/basics) for the full API, and [Models](/databases/sql/models/define-model) for model definition.

## Why no instance methods

1. **Separation of concerns**: models are data containers, not active records.
2. **Explicit operations**: every database call goes through `sql.from(Model)`.
3. **Type safety**: results reflect exactly the columns selected.
4. **Testability**: operations are separate from data, so they are easier to mock.
5. **Predictability**: no hidden state or behavior on instances.

## Best practices

**Yes**: use `sql.from(Model)` for all operations and treat results as immutable data:

```typescript
const user = await sql.from(User).findOne({ where: { id: 1 } });
if (user) {
  await sql.from(User).updateRecord(user.id, { name: "Updated Name" });
}

const activeUsers = await sql
  .from(User)
  .where("isActive", true)
  .where("age", ">", 18)
  .orderBy("createdAt", "desc")
  .many();

console.log(user?.name, user?.email);
```

**No**: do not call persistence methods on instances, or query methods on the model class directly:

```typescript
// user.save()   // Does not exist
// user.update() // Does not exist
// user.delete() // Does not exist

// User.from()   // Use sql.from(User)
// User.insert() // Use sql.from(User).insert()
```

## See also

- [Models](/databases/sql/models/define-model)
- [CRUD Operations](/databases/sql/standard-methods/basics)
- [Query Builder Overview](/databases/sql/query-builder/overview)
