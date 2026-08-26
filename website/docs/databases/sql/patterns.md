---
title: ORM Patterns
description: "Common ORM patterns and best practices when using Hysteria ORM with SQL databases."
keywords:
  [hysteria-orm, SQL patterns, ORM patterns, repository pattern, active record]
sidebar_position: 2
---

# ORM Patterns

Hysteria ORM supports three distinct patterns for working with your database models:

1. **Query Builder Pattern** — Using `sql.from(Model)` directly (recommended)
2. **Model Manager Pattern** — Using `sql.getModelManager(Model)` for DI/testing
3. **Model Embedding Pattern** — Using embedded models on the `SqlDataSource` instance

## Defining a Model

All patterns use `defineModel` and `col` to declare models — no class-based decorators needed:

```typescript
import { SqlDataSource, defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string(),
    isActive: col.boolean().default(true),
  },
});
```

## Connecting to the Database

`SqlDataSource` is **not** a singleton. You create and manage instances explicitly. Connections are lazy — the connection is established automatically on the first query:

```typescript
const sql = new SqlDataSource({ type: "sqlite", database: "app.db" });
// Connection is established lazily on first query
const users = await sql.from(User).many();
```

## Query Builder Pattern (Recommended)

The Query Builder pattern is the **recommended approach** for most applications. Call `sql.from(Model)` to get a fully typed query builder for any model.

### Example Usage

```typescript
// Insert
const user = await sql
  .from(User)
  .insert({ name: "John", email: "john@example.com" });

// Find with conditions
const users = await sql.from(User).find({ where: { isActive: true } });

// Find by primary key
const userById = await sql.from(User).findOneByPrimaryKey(1);

// Query builder chain
const results = await sql.from(User).where("name", "like", "%John%").many();
```

### Benefits

- **Clean API**: Simple, intuitive method calls
- **Type Safety**: Full TypeScript support with proper typing
- **Explicit Connection**: Always clear which data source is being used
- **Multiple Connections**: Easily use different data sources for the same model
- **No Singletons**: No hidden global state

For the full list of available methods (insert, find, update, delete, upsert, etc.), see **[CRUD Operations](./standard-methods/basics.md)**.

## Model Manager Pattern

The Model Manager pattern provides a reusable handle to a model's operations. It is useful for dependency injection, testing, or when you want to pass a model-bound manager around your application.

### Example Usage

```typescript
const userManager = sql.getModelManager(User);

const user = await userManager.insert({
  name: "John",
  email: "john@example.com",
});
const users = await userManager.find({ where: { isActive: true } });
const userById = await userManager.findOneByPrimaryKey(1);
const results = await userManager
  .from()
  .where("name", "like", "%John%")
  .many();
```

### When to Use Model Manager Pattern

The Model Manager pattern is useful when you need:

1. **Dependency Injection**: Pass the manager to services or controllers
2. **Testing**: Mock the manager for unit tests
3. **Multiple Connections**: Use different data sources for the same model
4. **Explicit Control**: Want to manage the data source connection explicitly

### Example with Dependency Injection

```typescript
import { ModelManager } from "hysteria-orm";

class UserService {
  constructor(private userManager: ModelManager<typeof User>) {}

  async createUser(userData: { name: string; email: string }) {
    return this.userManager.insert(userData);
  }

  async findActiveUsers() {
    return this.userManager.find({
      where: { isActive: true },
    });
  }
}

// Usage
const userManager = sql.getModelManager(User);
const userService = new UserService(userManager);
const users = await userService.findActiveUsers();
```

## Model Embedding Pattern

The Model Embedding pattern attaches models directly to the `SqlDataSource` instance, providing the most concise syntax.

### Example Usage

```typescript
const sqlWithModels = new SqlDataSource({
  type: "sqlite",
  database: "app.db",
  models: { user: User },
});
// Connection is established lazily on first query
const user = await sqlWithModels.user.insert({
  name: "John",
  email: "john@example.com",
});
const users = await sqlWithModels.user.find({ where: { isActive: true } });
const userById = await sqlWithModels.user.findOneByPrimaryKey(1);
```

For full documentation, see **[Model Embedding](./advanced/model-embedding.md)**.

## Using Multiple Connections

Since `SqlDataSource` is not a singleton, you simply create additional instances for read replicas or other databases:

```typescript
const primary = new SqlDataSource({
  type: "postgres",
  host: "primary.example.com",
  database: "app",
});
// Connection established lazily on first query
await primary.from(User).insert({ name: "John", email: "john@example.com" });

const readReplica = new SqlDataSource({
  type: "postgres",
  host: "read-replica.example.com",
  database: "app",
});
// Read from replica (connection established on first query)
const users = await readReplica.from(User).find({ where: { isActive: true } });
```

## Pattern Comparison

| Feature                  | Query Builder             | Model Manager | Model Embedding |
| ------------------------ | ------------------------- | ------------- | --------------- |
| **API Simplicity**       | ✅ Simple                 | ⚠️ Verbose    | ✅ Cleanest     |
| **Type Safety**          | ✅ Full                   | ✅ Full       | ✅ Full         |
| **Dependency Injection** | ⚠️ Requires passing `sql` | ✅ Perfect    | ✅ Perfect      |
| **Testing**              | ⚠️ Mock the data source   | ✅ Easy       | ✅ Easy         |
| **Multiple Connections** | ✅ Full                   | ✅ Full       | ✅ Full         |

## When to Use Each Pattern

| Pattern             | Best For                                                |
| ------------------- | ------------------------------------------------------- |
| **Query Builder**   | Most apps, quick prototypes, explicit data source usage |
| **Model Manager**   | Enterprise apps, dependency injection, unit testing     |
| **Model Embedding** | Service architecture, microservices, cleanest syntax    |

## Migrating Between Patterns

All patterns use the same underlying `ModelManager`, so you can switch as your application grows:

```typescript
// Start with Query Builder
const user = await sql.from(User).insert({ name: "John" });

// Move to Model Manager for DI
const userManager = sql.getModelManager(User);
const user2 = await userManager.insert({ name: "John" });

// Or use Model Embedding for the cleanest syntax
const sqlWithModels = new SqlDataSource({
  type: "sqlite",
  database: "app.db",
  models: { user: User },
});
// Connection is established lazily on first query
const user3 = await sqlWithModels.user.insert({ name: "John" });
```

---

Next: [Defining Models](./models/basics.md)
