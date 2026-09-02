---
title: QueryBuilder (Raw SQL)
description: "Low-level Knex-like API for raw SQL queries with performance optimizations in Hysteria ORM."
keywords: [hysteria-orm, query builder, raw SQL, advanced queries, subqueries]
sidebar_position: 3
---

# QueryBuilder (Raw SQL)

The `QueryBuilder` is a low-level, Knex-like API for building raw SQL queries. Access it via `sql.from('table')`.
It's suitable for performance crucial database queries since there is no serialization and the driver rows are directly returned from the query.

## Unified `from()` API

The `from()` method is the unified entry point for query building:

### From a Model (Type-Safe)

```typescript
// Returns ModelQueryBuilder with full type inference, hooks, relations
const users = await sql.from(User).select("name").many();
// users: User[]
```

### From a Table Name (Raw SQL)

```typescript
// Returns QueryBuilder for raw table queries
const rows = await sql.from("users").select("name").many();
// rows: Record<string, any>[]
```

| Feature | `from(Model)` | `from("table")` |
|---------|---------------|-----------------|
| Type Safety | ✅ Full model types | ❌ `Record<string, any>` |
| Hooks | ✅ beforeFetch/afterFetch | ❌ No hooks |
| Relations | ✅ `.load()`, `.havingRelated()` | ❌ No relations |
| Serialization | ✅ Model serialization | ❌ Raw driver rows |
| Use Case | App logic | Migrations, admin scripts |

## Key Features

- Works with any table (even without a model)
- **Type-safe select methods** - column types are inferred from select calls
- Flexible for migrations, admin scripts, or advanced SQL
- Supports filtering, selecting, joining, pagination, CTEs, truncate, softDelete, and more

> **Best Practice:** Use QueryBuilder for raw SQL, migrations, or when want the max performance in a query. For app logic, prefer the ModelQueryBuilder.

## Basics

For type-safe application queries use the ModelQueryBuilder. This page focuses on raw SQL with `sql.from("table")`.

### Basic Usage

```typescript
const users = await sql.from("users").where("status", "active").many();
```

### Pagination with Cursor

Paginate with cursor is a pagination method that allows you to paginate the results with a cursor that does not use the offset clause (more efficient for large datasets).
The `orderBy` clause is the source of truth for the cursor — it determines the column(s) and direction used to paginate. Calling `paginateWithCursor` without an `orderBy` clause throws an error.

```typescript
// Get the first page
const { data: users, nextCursor } = await sql
  .from("users")
  .orderBy("age", "asc")
  .paginateWithCursor(1);

// Get the second page
const { data: users2 } = await sql
  .from("users")
  .orderBy("age", "asc")
  .paginateWithCursor(1, nextCursor);
```

### Joins

```typescript
const postsWithUsers = await sql
  .from("posts")
  .join("users", "posts.userId", "users.id")
  .select("posts.*", "users.name")
  .many();

// Alias are supported in `join` and `from`
const postsWithUsersWithAlias = await sql
  .from("posts")
  .join("users as u", "posts.userId", "u.id")
  .select("posts.*", "u.name")
  .many();

// Add additional conditions with a callback
const postsWithActiveUsers = await sql
  .from("posts")
  .join("users", "posts.userId", "users.id", (q) =>
    q.where("users.isActive", true),
  )
  .select("posts.*", "users.name")
  .many();
```

### Advanced Features

#### `pluck`

Extract a single column as an array.

```typescript
const names = await sql.from(User).pluck("name"); // string[]
```

#### `increment` / `decrement`

Atomically increment or decrement a column.

```typescript
await sql.from("users").increment("age", 1);
await sql.from("users").decrement("age", 1);
```

#### `lockForUpdate` / `forShare`

Apply row-level locking (Postgres/MySQL only).

```typescript
const users = await sql.from("users").lockForUpdate().many();
const users = await sql.from("users").forShare().many();
```

#### `with` (Common Table Expressions, CTE)

Use CTEs for advanced queries. Callbacks accept a `QueryBuilder` to mutate **or** return a `SubQueryable` (any query builder — QB or MQB):

```typescript
// Mutate style — modify the passed builder in-place (returns void)
const users = await sql
  .from("users")
  .with("active_users", (qb) => {
    qb.select("name").from("users").where("isActive", true);
  })
  .from("active_users")
  .many();

// Return style — return any QueryBuilder / ModelQueryBuilder
const users2 = await sql
  .from("users")
  .with("active_users", () =>
    sql.from("users").select("name").where("isActive", true),
  )
  .from("active_users")
  .many();
```

## Example Usage

```typescript
// After connecting with SqlDataSource
const users = await sql.from("users").where("status", "active").many();
```

## Filtering

```typescript
const users = await sql.from("users").where("age", ">", 18).many();
```

### Raw right-hand side with rawStatement

When you need to compare a column to another column or an expression without creating a binding, use `sql.rawStatement`. Identifiers inside the raw string are automatically quoted per database dialect.

```typescript
// After connecting with SqlDataSource
await sql.from("users").where("id", sql.rawStatement("user.id")).many();
```

### Column-to-Column Comparison with whereColumn

Use `whereColumn` to compare two columns directly without parameter bindings. Supports `whereColumn`, `andWhereColumn`, and `orWhereColumn`.

```typescript
// Default operator is "="
await sql.from("users").whereColumn("age", "salary").many();

// Custom operator
await sql.from("users").whereColumn("age", ">", "salary").many();

// Chaining with AND / OR
await sql
  .from("users")
  .where("status", "active")
  .andWhereColumn("age", ">=", "salary")
  .many();

await sql
  .from("users")
  .where("name", "Alice")
  .orWhereColumn("age", "salary")
  .many();

// Table-qualified columns
await sql.from("users").whereColumn("users.age", ">", "users.salary").many();
```

## Insert

By default, `insert` and `insertMany` on the QueryBuilder return `void`. Pass a `returning` array as the second argument to get data back.

```typescript
// Fire-and-forget (returns void)
await sql.from("users").insert({
  id: crypto.randomUUID(),
  name: "John Doe",
  email: "john@example.com",
});

// Return specific columns
const user = await sql
  .from("users")
  .insert(
    { id: crypto.randomUUID(), name: "John Doe", email: "john@example.com" },
    ["id", "name", "email"],
  );

// Return all columns
const fullUser = await sql
  .from("users")
  .insert(
    { id: crypto.randomUUID(), name: "John Doe", email: "john@example.com" },
    ["*"],
  );

// Insert many (fire-and-forget)
await sql.from("users").insertMany([
  { id: crypto.randomUUID(), name: "Alice" },
  { id: crypto.randomUUID(), name: "Bob" },
]);

// Insert many with returning
const users = await sql.from("users").insertMany(
  [
    { id: crypto.randomUUID(), name: "Alice" },
    { id: crypto.randomUUID(), name: "Bob" },
  ],
  ["*"],
);
```

:::info Cross-Database `returning` Support
The `returning` array works across all supported databases. PostgreSQL and CockroachDB use the native `RETURNING` clause. For MySQL, MariaDB, SQLite, and Oracle, Hysteria ORM automatically performs a follow-up `SELECT` query to fetch the requested columns after the write operation.
:::

## Insert & Update with Raw Statements

You can use `sql.rawStatement()` in insert and update operations to reference column values, expressions, or SQL functions without creating parameter bindings.

### Raw Statements in Insert

```typescript
// Insert with raw SQL expression
await sql.from("users").insert({
  name: sql.rawStatement("'John Doe'"),
  email: "john@example.com",
});

// Insert with column reference
await sql.from("audit_logs").insert({
  user_id: sql.rawStatement(
    "(SELECT id FROM users WHERE email = 'admin@example.com')",
  ),
  action: "login",
});
```

### Raw Statements in Update

```typescript
// Update a column to reference another column
await sql.from("users").update({
  display_name: sql.rawStatement("name"),
});

// Update with SQL expression
await sql.from("users").update({
  full_name: sql.rawStatement("CONCAT(first_name, ' ', last_name)"),
});
```

### Common Use Cases

**Copy column values:**

```typescript
await sql
  .from("users")
  .where("old_email", null)
  .update({
    old_email: sql.rawStatement("email"),
  });
```

**Set timestamps:**

```typescript
await sql.from("users").update({
  last_login: sql.rawStatement("CURRENT_TIMESTAMP"),
});
```

**Conditional updates:**

```typescript
await sql.from("products").update({
  status: sql.rawStatement(
    "CASE WHEN stock > 0 THEN 'available' ELSE 'out_of_stock' END",
  ),
});
```

> **Note:** Raw statements bypass parameter binding, so ensure the SQL is safe from injection. Never use raw statements with user input directly.

## Automatic JSON Serialization

When using `insert()` or `update()` with the QueryBuilder, plain objects and arrays are automatically serialized to JSON strings. This means you don't need to manually call `JSON.stringify()`.

```typescript
// Objects are automatically stringified
await sql.from("users").insert({
  name: "John",
  metadata: { preferences: { theme: "dark" }, tags: ["admin", "active"] },
});

// Arrays are automatically stringified
await sql.from("users").update({
  roles: ["admin", "editor"],
});
```

### What Gets Serialized

| Value Type                            | Auto-Stringify                     |
| ------------------------------------- | ---------------------------------- |
| Plain objects `{ key: "value" }`      | ✅ Yes                             |
| Arrays `[1, 2, 3]`                    | ✅ Yes                             |
| `null` / `undefined`                  | ❌ No                              |
| Primitives (string, number, boolean)  | ❌ No                              |
| `Date` instances                      | ❌ No (handled by database driver) |
| `RawNode` (from `sql.rawStatement()`) | ❌ No                              |

This behavior applies to both the raw `QueryBuilder` and `ModelQueryBuilder`. For models using `col.json()` in `defineModel`, the column's `prepare` function takes precedence.

## Selecting Columns

### Basic Select

```typescript
const names = await sql.from("users").select("name").many();
```

### Select with Alias (Tuple Syntax)

Use `[column, alias]` tuples to alias columns:

```typescript
// Select with alias
const users = await sql
  .from("users")
  .select(["name", "userName"], ["email", "userEmail"])
  .many();

// users[0].userName - aliased from name
// users[0].userEmail - aliased from email
```

### Mixed Selection

```typescript
// Mix regular columns and aliased columns
const users = await sql
  .from("users")
  .select("id", ["name", "userName"], "status")
  .many();
```

:::tip Avoid Wildcards for Better Type Safety
While `select("*")` works, it's recommended to select specific columns for better type inference:

```typescript
// ✅ Preferred: Explicit columns
const users = await sql.from("users").select("id", "name", "email").many();

// ⚠️ Less precise: Wildcard returns Record<string, any>
const users = await sql.from("users").select("*").many();
```

:::

## Pagination

For detailed documentation on pagination strategies including `paginate()`, `paginateWithCursor()`, chunking, and the deferred join optimization, see: **[Pagination](./pagination.md)**

```typescript
const page = await sql.from("users").paginate(1, 10);
console.log(page.data, page.paginationMetadata);
```

### Chunking Large Datasets

The `chunk` method processes large datasets in manageable pieces without loading everything into memory:

```typescript
// Process users in chunks of 250
for await (const users of sql.from("users").chunk(250)) {
  await processUserBatch(users);
}
```

### Pagination Methods

| Method                    | Use Case                    | Return                         |
| ------------------------- | --------------------------- | ------------------------------ |
| `paginate(page, perPage)` | API responses with metadata | `{ data, paginationMetadata }` |
| `limit(n).offset(m)`      | Manual pagination           | Array of results               |
| `chunk(size)`             | Large dataset processing    | Async iterable                 |

## From

```typescript
const users = await sql
  .from("users")
  .from((qb) => {
    qb.select("name")
      .from("users as internal_users")
      .where("internal_users.age", ">", 18);
  }, "external_users")
  .many();
```

## Joins

### Basic Joins

```typescript
const postsWithUsers = await sql
  .from("posts")
  .join("users", "posts.userId", "users.id")
  .select("posts.*", "users.name")
  .many();
```

### Joins with Additional Conditions

You can add additional conditions to the join ON clause by passing a callback:

```typescript
const postsWithActiveUsers = await sql
  .from("posts")
  .join("users", "posts.userId", "users.id", (q) =>
    q.where("users.isActive", true),
  )
  .select("posts.*", "users.name")
  .many();

// This generates SQL similar to:
// SELECT posts.*, users.name FROM posts
// INNER JOIN users ON posts.userId = users.id AND users.isActive = true
```

The callback receives a query builder that supports all where methods:

```typescript
// Multiple conditions
await sql
  .from("posts")
  .join("users", "posts.userId", "users.id", (q) =>
    q.where("users.isActive", true).andWhere("users.verified", true),
  )
  .many();

// Using different operators
await sql
  .from("posts")
  .innerJoin("users", "posts.userId", "users.id", (q) =>
    q
      .whereIn("users.status", ["active", "pending"])
      .andWhere("users.age", ">=", 18),
  )
  .many();

// Works with all join types: join, innerJoin, leftJoin, rightJoin, fullJoin
await sql
  .from("posts")
  .leftJoin("comments", "comments.postId", "posts.id", (q) =>
    q.where("comments.approved", true),
  )
  .many();
```

## CTEs (Common Table Expressions)

```typescript
const users = await sql
  .from("users")
  .with("users_cte", (qb) => qb.select("name").where("isActive", true))
  .many();
```

## Truncate

```typescript
await sql.from("users").truncate();
```

## Soft Delete

```typescript
await sql.from("users").softDelete({ column: "deleted_at" });
```

## Limitations

- Column values are typed as `any` (no model column type inference)
- No decorator or relation support
- Use with caution in app logic

## Comparison to ModelQueryBuilder

- **Type Safety:** QueryBuilder infers column names from selects; ModelQueryBuilder infers both names and types from the model.
- **Decorator/Relation Support:** Only ModelQueryBuilder supports model decorators and relations.
- **Use Case:** Use QueryBuilder for raw SQL, migrations, or admin scripts.

## Full API Reference

### Filtering

- `where`, `orWhere`, `andWhere`, `whereNot`, `andWhereNot`, `orWhereNot`, `whereIn`, `whereNotIn`, `whereNull`, `whereNotNull`, `whereBetween`, `whereLike`, `whereNotLike`, `andWhereLike`, `andWhereNotLike`, `orWhereLike`, `orWhereNotLike`, `whereExists`, `whereNotExists`

```typescript
await sql.from("users").where("email", "like", "%@example.com").many();
await sql.from("users").whereIn("status", ["active", "pending"]).many();
await sql.from("users").whereNull("deletedAt").many();
await sql.from("users").whereBetween("age", [18, 30]).many();
await sql.from("users").whereNot("name", "Alice").many();
```

### Subqueries & Nested Conditions

- Overloads on `where`/`andWhere`/`orWhere` and `whereIn`/`whereNotIn` support callbacks and subqueries.

Callbacks are typed as `(subQuery: QueryBuilder<T>) => void | SubQueryable`.  
`SubQueryable` is the minimal interface `{ extractQueryNodes(): QueryNode[] }` — satisfied by both `QueryBuilder` **and** `ModelQueryBuilder`. This means you can safely return either from any callback.

The **key difference between the two styles**:

| Style      | How it works                                                     | When to use                         |
| ---------- | ---------------------------------------------------------------- | ----------------------------------- |
| **Mutate** | Modifies the passed-in builder in-place; callback returns `void` | Simple subqueries on the same table |
| **Return** | Ignores the passed-in builder; returns a new QB/MQB              | Cross-table/model subqueries        |

**Mutate style** — the subquery builder is passed as a parameter; mutate it in-place:

```typescript
// Grouped conditions (only where clauses are used)
await sql
  .from("users")
  .where((qb) => {
    qb.where("age", ">", 18).orWhere("isActive", true);
  })
  .many();

// Subquery via mutate style
await sql
  .from("users")
  .whereIn("id", (sub) => {
    sub.select("userId").from("posts").where("published", true);
  })
  .many();
```

**Return style** — return any QueryBuilder (including from another model/table):

```typescript
// Pass a pre-built QueryBuilder or return one from the callback
await sql
  .from("users")
  .whereIn("id", (sub) =>
    sub.select("userId").from("posts").where("published", true),
  )
  .many();

// Use a completely different model/table as the subquery source
await sql
  .from("users")
  .whereIn("id", () =>
    sql.from("posts").select("userId").where("published", true),
  )
  .many();

// Or pass a QueryBuilder instance directly (no callback needed)
const postSub = sql.from("posts").select("userId").where("published", true);
await sql.from("users").whereIn("id", postSub).many();
```

**Explicit operator**:

```typescript
await sql
  .from("users")
  .where("id", "not in", (sub) => sub.select("userId").from("posts"))
  .many();

await sql
  .from("users")
  .orWhere("id", (sub) => sub.select("ownerId").from("teams"))
  .many();
```

### Joins

- `join`, `leftJoin`, `rightJoin`, `innerJoin`

```typescript
// Basic join
await sql.from("posts").join("users", "posts.userId", "users.id").many();

// Join with additional conditions via callback
await sql
  .from("posts")
  .join("users", "posts.userId", "users.id", (q) =>
    q.where("users.isActive", true),
  )
  .many();
```

### Group By & Having

- `groupBy`, `having`

```typescript
await sql.from("users").groupBy("status").having("COUNT(*)", ">", 1).many();
```

### Unions

- `union`, `unionAll`

```typescript
await sql.from("users").select("name").union("SELECT name FROM users").many();
```

### Aggregates

- `getCount`, `getMax`, `getMin`, `getAvg`, `getSum`

```typescript
const count = await sql.from("users").getCount();
const maxAge = await sql.from("users").getMax("age");
```

### Select & Raw Select

- `select`, `selectRaw`, `selectFunc`, `clearSelect`

```typescript
await sql.from("users").select("name", "email").many();
await sql.from("users").selectRaw("count(*) as count").one();
await sql.from("users").selectFunc("count", "*", "total").one();
await sql.from("users").clearSelect().many();
```

### Type-Safe Selects

The QueryBuilder provides type inference for select methods. Column names and aliases are tracked, giving you autocomplete and type checking on the result.

```typescript
// Inferred type: { name: any, userEmail: any } | null
const user = await sql
  .from("users")
  .select("name", ["email", "userEmail"])
  .one();

console.log(user?.name); // ✓ Valid
console.log(user?.userEmail); // ✓ Valid (aliased)
```

#### Explicit Types with `selectRaw`

Use the generic parameter to specify exact types:

```typescript
// Inferred type: { total: number } | null
const result = await sql
  .from("users")
  .selectRaw<{ total: number }>("count(*) as total")
  .one();

console.log(result?.total); // number
```

#### Type-Safe SQL Functions with `selectFunc`

The `selectFunc` method auto-infers return types based on the function name:

```typescript
// Return types are auto-inferred!
const stats = await sql
  .from("users")
  .selectFunc("count", "*", "userCount") // userCount: number
  .selectFunc("avg", "age", "avgAge") // avgAge: number
  .selectFunc("upper", "name", "upperName") // upperName: string
  .one();

console.log(stats?.userCount); // number
console.log(stats?.avgAge); // number
console.log(stats?.upperName); // string
```

#### Type-Safe JSON Selects

JSON selection methods also support type inference:

```typescript
// Inferred type: { userName: any } | null
const user = await sql
  .from("users")
  .selectJson("data", "$.user.name", "userName")
  .one();

// With explicit type
const typed = await sql
  .from("users")
  .selectJson<string, "userName">("data", "$.user.name", "userName")
  .one();
// typed?.userName is string
```

#### Subquery Type Safety

Subqueries also track their alias:

```typescript
// Inferred type: { latestPost: any } | null
const user = await sql
  .from("users")
  .select((sub) => {
    sub.select("title").from("posts").where("userId", 1).limit(1);
  }, "latestPost")
  .one();

// With explicit type
const typed = await sql
  .from("users")
  .select<string, "latestPost">((sub) => {
    sub.select("title").from("posts").limit(1);
  }, "latestPost")
  .one();
// typed?.latestPost is string
```

#### Chaining Selects

Types accumulate when chaining multiple select calls:

```typescript
// Inferred type: { name: any, total: number, avgAge: number }
const result = await sql
  .from("users")
  .select("name")
  .selectFunc("count", "*", "total")
  .selectFunc("avg", "age", "avgAge")
  .one();
```

| Method                             | Inferred Type         |
| ---------------------------------- | --------------------- |
| `select("col")`                    | `{ col: any }`        |
| `select(["col", "alias"])`         | `{ alias: any }`      |
| `selectRaw<T>(...)`                | `T`                   |
| `selectFunc("count", col, alias)`  | `{ [alias]: number }` |
| `selectFunc("sum", col, alias)`    | `{ [alias]: number }` |
| `selectFunc("avg", col, alias)`    | `{ [alias]: number }` |
| `selectFunc("upper", col, alias)`  | `{ [alias]: string }` |
| `selectFunc("lower", col, alias)`  | `{ [alias]: string }` |
| `selectJson(col, path, alias)`     | `{ [alias]: any }`    |
| `selectJsonText(col, path, alias)` | `{ [alias]: string }` |
| `select(cb, alias)`                | `{ [alias]: any }`    |

### selectRaw with CAST

`CAST` expressions are fully supported. The type after `AS` inside `CAST()` is recognized as a SQL type, not an alias:

```typescript
// CAST type is not treated as alias
await sql.from("users").selectRaw("CAST(age AS VARCHAR) as ageString").one();
```

### Pluck

- `pluck`

```typescript
const names = await sql.from("users").pluck("name");
```

### Pagination

- `paginate`, `limit`, `offset`, `chunk`

```typescript
const page = await sql.from("users").paginate(1, 10);
await sql.from("users").limit(5).offset(10).many();

// Process large datasets in chunks
for await (const users of sql.from("users").chunk(100)) {
  // Process each chunk of 100 users
  console.log(`Processing ${users.length} users...`);
}
```

### Streaming (experimental)

Process query results as a stream without loading everything at once. No hooks or serialization are run.

```typescript
// Async generator
for await (const user of await sql.from("users").stream()) {
  console.log(`Processing user: ${user.name}`);
}

// Node.js Readable stream
const stream = await sql.from("users").stream();
stream.on("data", (user) => console.log(user));
stream.on("end", () => console.log("Done"));
```

### Locking

- `lockForUpdate`, `forShare`

```typescript
await sql.from("users").lockForUpdate().many();
await sql.from("users").forShare().many();
```

### CTEs (Common Table Expressions)

- `with`, `withRecursive`, `withMaterialized`

```typescript
await sql
  .from("users")
  // Normal CTE
  .with("users_cte", (qb) => qb.select("name"))
  // Recursive CTE
  .withRecursive("users_cte", (qb) => qb.select("name"))
  // Materialized CTE (PostgreSQL/CockroachDB only)
  .withMaterialized("users_cte", (qb) => qb.select("name"))
  .many();
```

### Copying & Query Output

- `copy`, `toQuery`, `unWrap`

```typescript
const qb = sql.from("users").where("isActive", true);
const qbCopy = qb.clone();
const sqlString = qb.toQuery();
```

## Raw Queries

You can use the `rawQuery` method to execute raw SQL queries.

```typescript
const users = await sql.rawQuery("SELECT * FROM users");
```

### Raw Query with Parameters

You can use the `rawQuery` method to execute raw SQL queries with parameters. You can use `?` as a placeholder for the parameters regardless of the database dialect. You can still use the database specific placeholder syntax.

```typescript
// Generic placeholder syntax
const users = await sql.rawQuery("SELECT * FROM users WHERE age > ?", [18]);

// Database specific placeholder syntax
const users = await sql.rawQuery("SELECT * FROM users WHERE age > $1", [18]);
```

### QueryBuilder Only

- All methods are available on QueryBuilder, but no model/relation helpers.

---

Next: [Relations](../relations/overview.md)
