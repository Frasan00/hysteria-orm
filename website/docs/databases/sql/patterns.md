---
title: ORM Patterns
description: "Common ORM patterns and best practices when using Hysteria ORM with SQL databases."
keywords:
  [
    hysteria-orm,
    SQL patterns,
    ORM patterns,
    model manager,
    model embedding,
    query builder,
  ]
---

# ORM patterns

Hysteria ORM supports three patterns for working with your database models:

1. Query Builder pattern: use `sql.from(Model)` directly (recommended)
2. Model Manager pattern: use `sql.getModelManager(Model)` for dependency injection and testing
3. Model Embedding pattern: use models embedded on the `SqlDataSource` instance

## Defining a model

All patterns use `defineModel` and `col` to declare models, with no class-based decorators:

```typescript
import { SqlDataSource, defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string(),
    isActive: col.boolean({ default: true }),
  },
});
```

## Connecting to the database

`SqlDataSource` is not a singleton. You create and manage instances explicitly. Strict mode is the default; set `lazyLoad: true` to connect on the first query. See [SQL ORM Introduction](/databases/sql/introduction) for the full option reference.

```typescript
const sql = new SqlDataSource({
  type: "sqlite",
  database: "app.db",
  lazyLoad: true,
});
const users = await sql.from(User).many(); // connects on first query
```

## Query Builder pattern (recommended)

The Query Builder pattern is the recommended approach for most applications. Call `sql.from(Model)` to get a fully typed query builder for any model.

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

- Simple method calls, with full TypeScript typing.
- An explicit connection, so it is always clear which data source is being used.
- Different data sources for the same model.
- No hidden global state from singletons.

For the full list of available methods (insert, find, update, delete, upsert, and more), see [CRUD Operations](/databases/sql/standard-methods/basics).

## Model Manager pattern

The Model Manager pattern provides a reusable handle to a model's operations. Use it for dependency injection or testing, or to pass a model-bound manager around your application.

```typescript
const userManager = sql.getModelManager(User);

const user = await userManager.insert({
  name: "John",
  email: "john@example.com",
});
const users = await userManager.find({ where: { isActive: true } });
const userById = await userManager.findOneByPrimaryKey(1);
const results = await userManager.from().where("name", "like", "%John%").many();
```

### When to use the Model Manager pattern

Use the Model Manager pattern when you need:

1. Dependency injection: pass the manager to services or controllers
2. Testing: mock the manager for unit tests
3. Multiple connections: use different data sources for the same model
4. Explicit control: manage the data source connection explicitly

### Example with dependency injection

The manager type is inferred from `getModelManager`, so you can type a constructor parameter with `ReturnType` without importing an internal class:

```typescript
import { SqlDataSource } from "hysteria-orm";

class UserService {
  constructor(
    private userManager: ReturnType<SqlDataSource["getModelManager"]>,
  ) {}

  async createUser(userData: { name: string; email: string }) {
    return this.userManager.insert(userData);
  }

  async findActiveUsers() {
    return this.userManager.find({ where: { isActive: true } });
  }
}

const userManager = sql.getModelManager(User);
const userService = new UserService(userManager);
const users = await userService.findActiveUsers();
```

## Model Embedding pattern

The Model Embedding pattern attaches models directly to the `SqlDataSource` instance, which gives the most concise syntax.

```typescript
const sqlWithModels = new SqlDataSource({
  type: "sqlite",
  database: "app.db",
  models: { user: User },
});

const user = await sqlWithModels.user.insert({
  name: "John",
  email: "john@example.com",
});
const users = await sqlWithModels.user.find({ where: { isActive: true } });
const userById = await sqlWithModels.user.findOneByPrimaryKey(1);
```

For full documentation, see [Model Embedding](/databases/sql/advanced/model-embedding).

## Multiple connections

`SqlDataSource` is not a singleton, so create an additional instance for read replicas or other databases. See [Secondary Connections](/databases/sql/introduction#secondary-connections) and [Replication](/databases/sql/advanced/replication) for details.

## Pattern comparison

| Feature              | Query Builder          | Model Manager | Model Embedding |
| -------------------- | ---------------------- | ------------- | --------------- |
| API Simplicity       | Simple                 | Verbose       | Cleanest        |
| Type Safety          | Full                   | Full          | Full            |
| Dependency Injection | Requires passing `sql` | Yes           | Yes             |
| Testing              | Mock the data source   | Yes           | Yes             |
| Multiple Connections | Yes                    | Yes           | Yes             |

## When to use each pattern

| Pattern         | Best For                                                |
| --------------- | ------------------------------------------------------- |
| Query Builder   | Most apps, quick prototypes, explicit data source usage |
| Model Manager   | Enterprise apps, dependency injection, unit testing     |
| Model Embedding | Service architecture, microservices, cleanest syntax    |

## Migrating between patterns

All patterns use the same underlying `ModelManager`, so you can switch as your application grows:

```typescript
// Start with Query Builder
const user = await sql.from(User).insert({ name: "John" });

// Move to Model Manager for dependency injection
const userManager = sql.getModelManager(User);
const user2 = await userManager.insert({ name: "John" });

// Or use Model Embedding for the cleanest syntax
const sqlWithModels = new SqlDataSource({
  type: "sqlite",
  database: "app.db",
  models: { user: User },
});
const user3 = await sqlWithModels.user.insert({ name: "John" });
```

## See also

- [SQL ORM Introduction](/databases/sql/introduction)
- [Models](/databases/sql/models/define-model)
- [Model Embedding](/databases/sql/advanced/model-embedding)
- [CRUD Operations](/databases/sql/standard-methods/basics)
- [Query Builder Overview](/databases/sql/query-builder/overview)
