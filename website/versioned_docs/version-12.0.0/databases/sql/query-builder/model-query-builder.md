---
title: ModelQueryBuilder (Type-Safe)
description: "Type-safe query builder for Hysteria ORM models with intellisense and relation loading support."
keywords:
  [hysteria-orm, model query builder, type-safe queries, SQL, ModelQueryBuilder]
sidebar_position: 2
---

# ModelQueryBuilder (Type-Safe)

The `ModelQueryBuilder` is the primary, partially type-safe query API for Hysteria ORM models. You obtain a `ModelQueryBuilder` by calling `sql.from(Model)` on a `SqlDataSource` instance.
The query builder is partially type safe, triggering intellisense for developer experience but still allowing the developer to write whatever he wants.
The ModelQueryBuilder by default returns a `ModelWithoutRelations<T>` type, which is a type that does not have any relations. You can add Relations using the `load` method.

## Setup

```typescript
import { SqlDataSource, defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string(),
    age: col.integer().nullable(),
    status: col.string().default("active"),
    isActive: col.boolean().default(true),
    salary: col.integer().nullable(),
  },
});

const Post = defineModel("posts", {
  columns: {
    id: col.increment(),
    title: col.string(),
    content: col.string(),
    userId: col.integer(),
  },
});

const sql = new SqlDataSource({ type: "sqlite", database: "app.db" });
await sql.connect();
```

```typescript
const users = await sql.from(User).where("status", "active").many();
```

## Key Features

- Partially type-safe queries and results
- `defineModel` and `col` namespace for model definitions
- Rich API for filtering, selecting, joining, and more
- Supports advanced features like CTEs, pagination, and soft deletes
- Model columns are parsed to database columns based on the case convention of the model, this applies both on column names like `isActive` and on table.column scenarios like `users.isActive`

## Example Usage

```typescript
const users = await sql.from(User).where("status", "active").many();
```

## Filtering

```typescript
// Here if model has snake case convention, the columns will be parsed to snake case
const users = await sql
  .from(User)
  .where("age", ">", 18)
  .andWhere("isActive", true)
  .andWhere("users.isActive", true)
  .many();
```

### Raw right-hand side with rawStatement

When you need to compare a column to another column or an expression without creating a binding, use `sql.rawStatement`. Identifiers inside the raw string are automatically quoted per database dialect.

```typescript
await sql.from(User).where("id", sql.rawStatement("user.id")).many();
```

### Column-to-Column Comparison with whereColumn

Use `whereColumn` to compare two columns directly without parameter bindings. Column names benefit from model intellisense. Supports `whereColumn`, `andWhereColumn`, and `orWhereColumn`.

```typescript
// Default operator is "="
await sql.from(User).whereColumn("age", "salary").many();

// Custom operator
await sql.from(User).whereColumn("age", ">", "salary").many();

// Chaining with AND / OR
await sql
  .from(User)
  .where("status", "active")
  .andWhereColumn("age", ">=", "salary")
  .many();

await sql
  .from(User)
  .where("name", "Alice")
  .orWhereColumn("age", "salary")
  .many();

// Table-qualified columns
await sql.from(User).whereColumn("users.age", ">", "users.salary").many();
```

### Subqueries in WHERE conditions

Subquery callbacks are typed as `(subQuery: QueryBuilder<T>) => void | SubQueryable`.  
`SubQueryable` is the minimal interface `{ extractQueryNodes(): QueryNode[] }` — satisfied by both `QueryBuilder` **and** `ModelQueryBuilder`, so you can return either from any callback.

| Style      | How it works                                                     | When to use                         |
| ---------- | ---------------------------------------------------------------- | ----------------------------------- |
| **Mutate** | Modifies the passed-in builder in-place; callback returns `void` | Simple subqueries on the same table |
| **Return** | Ignores the passed-in builder; returns a new QB/MQB              | Cross-table/model subqueries        |

**Mutate style** — mutate the passed builder in-place (no return value needed):

```typescript
await sql
  .from(User)
  .whereIn("id", (sub) => {
    sub.select("userId").from("posts").where("published", true);
  })
  .many();
```

**Return style** — return any `QueryBuilder` or `ModelQueryBuilder` from the callback, including builders built from a completely different model or table:

```typescript
// Using a different model as the subquery source
await sql
  .from(User)
  .whereIn("id", () => sql.from(Post).select("userId").where("published", true))
  .many();

// Or pass a QueryBuilder instance directly
const postSub = sql.from(Post).select("userId").where("published", true);
await sql.from(User).whereIn("id", postSub).many();

// Works with all subquery-capable methods: whereIn, whereNotIn, where, andWhere, orWhere, etc.
await sql
  .from(User)
  .where("id", "not in", () => sql.from(Post).select("userId"))
  .orWhereIn("teamId", () => sql.from(Team).select("id").where("active", true))
  .many();
```

## Selecting Columns

By default, queries return all columns from the model's table. Use `select()` to pick specific columns:

```typescript
// Only returns name and email
const users = await sql.from(User).select("name", "email").many();

// TypeScript knows only name and email are available
users[0].name; // ✓ OK
users[0].email; // ✓ OK
users[0].age; // ✗ Type error - not selected
```

:::warning
The `select()` method only allows selecting columns that are part of the model definition. For columns outside the model (e.g., computed columns, columns from unrelated tables, or raw expressions), use [`selectRaw()`](#custom-properties-with-selectraw) instead:

```typescript
// ❌ Error - 'metadata' is not a column in the User model
await sql.from(User).select("metadata").many();

// ✅ Correct - use selectRaw for non-model columns
await sql.from(User).selectRaw<{ metadata: string }>("metadata").many();
```

:::

### Column Selection Formats

```typescript
// Direct column names with intellisense
const users = await sql.from(User).select("name", "age", "email").many();

// Qualified columns (table.column) - useful with JOINs
const posts = await sql
  .from(Post)
  .select("posts.title", "posts.content")
  .leftJoin("users", "users.id", "posts.userId")
  .many();

// Column aliases using tuple syntax [column, alias]
const users = await sql
  .from(User)
  .select(["name", "userName"], ["age", "userAge"])
  .many();

users[0].userName; // ✓ OK (string - type from name)
users[0].userAge; // ✓ OK (number - type from age)

// Wildcards - returns all model columns
const users = await sql.from(User).select("*").many();
```

:::tip Type-safe column references
Instead of raw strings, you can use the static column references exposed directly on the model class. Each column property resolves to a qualified `"table.column"` string and works in all query builder methods:

```typescript
// User.id → "users.id", User.name → "users.name", etc.
const users = await sql.from(User).select(User.id, User.name).many();

// With alias
const users = await sql.from(User).select([User.id, "userId"]).many();

// In where, groupBy, orderBy, join
await sql.from(User).where(User.isActive, true).orderBy(User.id, "desc").many();
await sql
  .from(Post)
  .join(User, User.id, Post.userId)
  .select(Post.title, User.name)
  .many();
```

See [Type-safe Column References](../models/define-model.md#type-safe-column-references) in the `defineModel` docs for the full guide.
:::

:::warning Avoid Using Wildcards
Using `*` or `table.*` in `select()` is **discouraged** as it loses type safety benefits:

```typescript
// ❌ Avoid: Loses type inference for other selections
const user = await sql
  .from(User)
  .select("*", ["name", "aliasedName"]) // aliasedName won't be typed!
  .one();

// ✅ Preferred: Select specific columns for full type safety
const user = await sql
  .from(User)
  .select("id", "name", "email", ["name", "aliasedName"])
  .one();

user.aliasedName; // ✓ Properly typed as string
```

When `*` is present, the return type becomes `ModelWithoutRelations<T>`, and any additional aliased columns from tuples will not be included in the type. Always prefer selecting specific columns for maximum type safety.
:::

### Wildcards and JOINs

When using wildcards with JOINs, columns from joined tables are **automatically filtered out** to prevent data bleeding:

```typescript
// users columns are filtered out, only Post columns appear
const posts = await sql
  .from(Post)
  .select("posts.*")
  .leftJoin("users", "users.id", "posts.userId")
  .many();

posts[0].title; // ✓ OK (Post column)
posts[0].name; // ✗ Filtered out (User column)

// To include columns from joined tables, use explicit aliases
const posts = await sql
  .from(Post)
  .select("posts.*", ["users.name", "authorName"])
  .leftJoin("users", "users.id", "posts.userId")
  .many();

posts[0].title; // ✓ OK (Post column)
posts[0].authorName; // ✓ OK (explicitly aliased)
```

### Chaining Selects

Multiple `select()` calls accumulate at runtime:

```typescript
const users = await sql
  .from(User)
  .select("name")
  .select("age") // Both name and age are selected
  .many(); // returns { name: string; age: number }
```

> **Note**: TypeScript reflects the type of the **last** `select()` call. If you need all columns typed, include them in a single `select()` call.

### Type Safety in Select

The `select()` method is fully type-safe. TypeScript infers the return type based on which columns you select.

#### Basic Type Inference

```typescript
// Using the User model defined above with defineModel
// User has columns: id (number), name (string), email (string), age (number), etc.

// Selecting specific columns - return type is { name: string; email: string }
const user = await sql.from(User).select("name", "email").one();

user?.name; // ✓ string
user?.email; // ✓ string
user?.age; // ✗ Type error - property 'age' does not exist
user?.id; // ✗ Type error - property 'id' does not exist
```

#### Alias Type Inference

When using `[column, alias]` tuple syntax, TypeScript creates the aliased property with the original column's type:

```typescript
const user = await sql
  .from(User)
  .select(["name", "userName"], ["age", "userAge"])
  .one();

user?.userName; // ✓ string (type from 'name')
user?.userAge; // ✓ number (type from 'age')
user?.name; // ✗ Type error - use the alias instead
```

#### Wildcard Behavior

Using `*` returns the full model type:

```typescript
// Returns ModelWithoutRelations<User> (all columns)
const users = await sql.from(User).select("*").many();

users[0].id; // ✓ number
users[0].name; // ✓ string
users[0].email; // ✓ string
users[0].age; // ✓ number
```

#### Qualified Columns

Table-qualified columns extract the column name for typing:

```typescript
const result = await sql.from(User).select("users.name", "users.age").many();

result[0].name; // ✓ string (extracted from 'users.name')
result[0].age; // ✓ number (extracted from 'users.age')
```

#### Custom Properties with `selectRaw`

For custom expressions, use the type parameter to define the return shape:

```typescript
const result = await sql
  .from(User)
  .select("name")
  .selectRaw<{ totalOrders: number }>("COUNT(orders.id) as totalOrders")
  .one();

result?.name; // ✓ string (from select)
result?.totalOrders; // ✓ number (from selectRaw type parameter)
```

#### Type Safety Summary

| Selection                  | Return Type                              |
| -------------------------- | ---------------------------------------- |
| No `select()`              | `ModelWithoutRelations<T>` (all columns) |
| `select('*')`              | `ModelWithoutRelations<T>` (all columns) |
| `select('col1', 'col2')`   | `{ col1: Type1; col2: Type2 }`           |
| `select(['col', 'alias'])` | `{ alias: ColType }`                     |
| `select('table.col')`      | `{ col: ColType }`                       |
| `selectRaw<T>(...)`        | Merges `T` with current selection        |

### Scalar Subqueries in SELECT

You can embed a correlated scalar subquery as a selected column using a callback. Both styles are supported:

**Mutate style** — mutate the passed builder (callback returns void):

```typescript
const users = await sql
  .from(User)
  .select("name")
  .select<number>((sub) => {
    sub
      .selectRaw<{ postCount: number }>("COUNT(*) as postCount")
      .from("posts as p")
      .whereRaw("p.user_id = users.id");
  }, "postCount")
  .many();

users[0].postCount; // number
```

**Return style** — return a builder from a different model/table:

```typescript
const users = await sql
  .from(User)
  .select("name")
  .select<number>(
    () =>
      sql
        .from(Post)
        .selectRaw("COUNT(*) as postCount")
        .whereRaw("posts.user_id = users.id"),
    "postCount",
  )
  .many();

users[0].postCount; // number
```

All query results from the `ModelQueryBuilder` include instance methods (`save`, `update`, `delete`, `softDelete`, `refresh`, `mergeProps`) regardless of whether you use `.select()` or not:

```typescript
// Without select - full model with instance methods
const user = await sql.from(User).where("id", 1).one();
if (user) {
  await user.update({ name: "New Name" });
  await user.refresh();
  await user.delete();
}

// With select - partial data but still has instance methods
const user = await sql.from(User).select("id", "name").where("id", 1).one();

if (user) {
  user.mergeProps({ name: "Updated" });
  await user.save(); // ✓ Available
  await user.update({ name: "Another" }); // ✓ Available
  await user.delete(); // ✓ Available
  await user.refresh(); // ✓ Available
}
```

:::note
Instance methods require the primary key to be present in the result. If you use `.select()` without including the primary key, methods like `save()`, `update()`, and `delete()` will throw an error.
:::

## SQL Functions with selectFunc

Hysteria ORM provides a unified `selectFunc()` method for SQL functions with **auto-inferred return types**:

```typescript
const result = await sql
  .from(User)
  .selectFunc("count", "*", "totalUsers") // totalUsers: number
  .selectFunc("avg", "age", "avgAge") // avgAge: number
  .selectFunc("upper", "name", "upperName") // upperName: string
  .one();
```

For the full list of supported functions (aggregates, string, numeric), `selectRaw`, CAST expressions, and database compatibility notes, see: **[SQL Functions](./sql-functions.md)**

## Pagination

For detailed documentation on pagination strategies including `paginate()`, `paginateWithCursor()`, chunking, and the deferred join optimization, see: **[Pagination](./pagination.md)**

```typescript
const page = await sql.from(User).paginate(1, 10);
console.log(page.data, page.paginationMetadata);
```

## Joins

- Joins do not use the joined table hooks, only the caller model hooks are used
- Joined model columns are cased based on the case convention of the model

### Basic Joins

```typescript
const postsWithUsers = await sql
  .from(Post)
  .select("posts.*", "users.name")
  .join("users", "posts.userId", "users.id")
  .many();

const postsWithUsersFromModel = await sql
  .from(Post)
  .select("posts.*", "users.name")
  .join(User, "userId", "id")
  .many();
```

### Joins with Additional Conditions

You can add additional conditions to the join ON clause by passing a callback as the last parameter:

```typescript
const postsWithActiveUsers = await sql
  .from(Post)
  .select("posts.*")
  .join("users", "users.id", "posts.userId", (q) =>
    q.where("users.isActive", true),
  )
  .many();

// This generates SQL similar to:
// SELECT posts.* FROM posts
// INNER JOIN users ON users.id = posts.userId AND users.isActive = true
```

The callback receives a `JoinOnQueryBuilder` that supports all where methods:

```typescript
// Multiple conditions
await sql
  .from(Post)
  .join("users", "users.id", "posts.userId", (q) =>
    q.where("users.isActive", true).andWhere("users.verified", true),
  )
  .many();

// Using different operators
await sql
  .from(Post)
  .innerJoin(User, "id", "userId", (q) =>
    q
      .whereIn("users.status", ["active", "pending"])
      .andWhere("users.age", ">=", 18),
  )
  .many();

// Works with all join types: join, innerJoin, leftJoin, rightJoin, fullJoin
await sql
  .from(Post)
  .leftJoin("comments", "comments.postId", "posts.id", (q) =>
    q.where("comments.approved", true),
  )
  .many();
```

## CTEs (Common Table Expressions)

Callbacks accept a `QueryBuilder` to mutate **or** return a `SubQueryable` (QB or MQB):

```typescript
// Mutate style — mutate the passed builder in-place (returns void)
const users = await sql
  .from(User)
  .with("active_users", (qb) => {
    qb.select("name").where("isActive", true);
  })
  .many();

// Return style — return any QueryBuilder or ModelQueryBuilder
const users2 = await sql
  .from(User)
  .with("active_users", () =>
    sql.from(User).select("name").where("isActive", true),
  )
  .many();
```

## Pluck

```typescript
const names = await sql.from(User).pluck("name"); // string[]
```

## Increment / Decrement

```typescript
await sql.from(User).increment("age", 1);
await sql.from(User).decrement("age", 1);
```

## Locking

```typescript
const users = await sql.from(User).lockForUpdate().many();
const users = await sql.from(User).forShare().many();
```

## clearSelect

```typescript
const users = await sql.from(User).select("name").clearSelect().many();
```

## Soft Delete

```typescript
await sql.from(User).softDelete({ column: "deleted_at" });
```

## Type Safety Example

```typescript
// users: ModelWithoutRelations<User>
const users = await sql
  .from(User)
  .where("email", "like", "%@example.com")
  .many();
```

## Comparison to QueryBuilder

For raw SQL reference (filtering, joins, pagination, streaming, chunking), see: [QueryBuilder (Raw SQL)](./query-builder.md)

## Selected API Highlights

- Filtering: `where`, `orWhere`, `andWhere`, `whereIn`, `whereNull`, `whereBetween`, `whereLike`, `whereExists`
- Joins: `join`, `leftJoin`, `rightJoin`, `innerJoin`
- Aggregates: `getCount`, `getMax`, `getMin`, `getAvg`, `getSum`, `selectFunc`
- Select: `select`, `selectRaw`, `selectFunc`, `clearSelect`
- Pagination: `paginate`, `paginateWithCursor`, `limit`, `offset`, `chunk`
- Relations: `load`, `clearRelations`, `havingRelated`, `notHavingRelated`

Refer to the tests under `test/sql` for comprehensive examples aligned with the implementation.

---

Next: [QueryBuilder (Raw SQL)](./query-builder.md)
