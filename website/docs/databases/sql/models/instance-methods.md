---
title: Models as DTOs
description: "Models as Data Transfer Objects in Hysteria ORM - pure data properties with type safety."
keywords:
  [hysteria-orm, DTO, data transfer object, model methods, custom behavior]
sidebar_position: 5
---

# Models as Data Transfer Objects

Hysteria ORM models are **pure Data Transfer Objects (DTOs)** that contain only data properties without any business logic. They represent the structure of your database tables and provide type safety for your application.

## Overview

Models in Hysteria ORM follow the principle of separation of concerns:

- **Models**: Pure data containers (DTOs) defined with `defineModel`
- **`sql.from(Model)`**: All database operations are performed through the `SqlDataSource` instance
- **Query Builder**: Complex queries are built using the fluent query builder API

This design ensures clean architecture where data and behavior are separated, making your codebase more maintainable and testable.

## Working with Model Data

All database operations are performed using `sql.from(Model)` on a `SqlDataSource` instance. For the full API with examples (insert, update, delete, upsert, find, etc.), see **[CRUD Operations](../standard-methods/basics.md)**.

Here's a quick overview:

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

## Why No Instance Methods?

Hysteria ORM intentionally avoids instance methods on models for several architectural reasons:

1. **Clear Separation of Concerns**: Models are data containers, not active records
2. **Explicit Operations**: All database operations go through `sql.from(Model)`
3. **Type Safety**: Better type inference and IDE support
4. **Testability**: Easier to mock and test when operations are separate from data
5. **Predictability**: No hidden state or behavior on model instances

## Best Practices

### ✅ Do

```typescript
// Use sql.from(Model) for all operations
const user = await sql.from(User).findOne({ where: { id: 1 } });
if (user) {
  await sql.from(User).updateRecord(user.id, { name: "Updated Name" });
}

// Use query builder for complex operations
const activeUsers = await sql
  .from(User)
  .where("isActive", true)
  .where("age", ">", 18)
  .orderBy("createdAt", "desc")
  .many();

// Access data on returned instances
console.log(user.name);
console.log(user.email);
```

### ❌ Don't

```typescript
// Models do not have instance methods
// user.save()   // ❌ Does not exist
// user.update() // ❌ Does not exist
// user.delete() // ❌ Does not exist

// Don't call query methods directly on the model
// User.from()  // ❌ Use sql.from(User) instead
// User.insert() // ❌ Use sql.from(User).insert() instead
```

---

Next: [Model Views](./views.md)
