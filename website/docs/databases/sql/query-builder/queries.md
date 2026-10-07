---
title: Building Queries
description: "Canonical query builder examples for filtering, joins, grouping, ordering, aggregates, subqueries, CTEs, unions, pagination, locking, and comments in Hysteria ORM."
keywords:
  [
    hysteria-orm,
    query builder,
    where,
    joins,
    group by,
    having,
    subqueries,
    CTE,
    union,
    pagination,
  ]
---

# Building queries

This page is the canonical reference for every clause the query builders share. The examples use the same models throughout and work on both `sql.from(Model)` and `sql.from("table")` unless noted otherwise. See [Query Builder Overview](/databases/sql/query-builder/overview) for the two entry points, cloning, clearing, and conditional building. JSON-specific filters live in [JSON Columns](/databases/sql/advanced/json).

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
    createdAt: col.datetime(),
  },
});

const Post = defineModel("posts", {
  columns: {
    id: col.increment(),
    title: col.string(),
    userId: col.integer(),
    published: col.boolean().default(false),
  },
});

const sql = new SqlDataSource({ type: "sqlite", database: "app.db" });
await sql.connect();
```

## Schema and raw sources

`withSchema` qualifies every table reference in the query with a schema (or database) name. It applies to the base table and joined tables, and survives `clone()`.

```typescript
await sql
  .from(User)
  .withSchema("public")
  .join("posts", "posts.userId", "users.id")
  .select("users.*", "posts.title")
  .many();
// from "public"."users"
// inner join "public"."posts" on "posts"."userId" = "users"."id"
```

`fromRaw` sets a raw SQL fragment as the FROM source, for table-valued functions or derived tables. `?` placeholders are rewritten to the dialect's placeholders and ordered with the rest of the query's bindings.

```typescript
const rows = await sql
  .fromRaw("generate_series(?, ?) as n", [1, 5])
  .where("n", ">", 2)
  .select("*")
  .many();
```

## Filtering

Model columns are converted to the model's database case convention. You can pass plain names (`isActive`) or qualified names (`users.isActive`), and the model exposes static column references such as `User.isActive`.

### `where`, `andWhere`, `orWhere`

```typescript
// Equality shorthand, then chained operators
const users = await sql
  .from(User)
  .where("age", ">", 18)
  .andWhere("isActive", true)
  .orWhere("status", "pending")
  .many();

// Equality uses the two-argument form
await sql.from(User).where("status", "active").many();

// Group conditions with a callback
await sql
  .from(User)
  .where((q) => {
    q.where("age", ">", 18).orWhere("isActive", true);
  })
  .many();
```

`whereNot`, `andWhereNot`, and `orWhereNot` negate a comparison or a subquery:

```typescript
await sql.from(User).whereNot("name", "Alice").many();
await sql.from(User).whereNot("age", ">", 65).many();
```

### Raw right-hand side with `rawStatement`

Use `sql.rawStatement()` to compare against an expression without a binding. Identifiers are quoted per dialect.

```typescript
await sql.from(User).where("id", sql.rawStatement("user.id")).many();
```

### `whereColumn`

Compare two columns directly. Supports `whereColumn`, `andWhereColumn`, and `orWhereColumn`.

```typescript
await sql.from(User).whereColumn("age", "salary").many(); // defaults to "="
await sql.from(User).whereColumn("age", ">", "salary").many();
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
```

`whereNotColumn`, `andWhereNotColumn`, and `orWhereNotColumn` add the negated comparison. With two arguments they emit `!=`; with an explicit operator they negate it.

```typescript
await sql.from(User).whereNotColumn("age", "salary").many(); // age != salary
await sql.from(User).whereNotColumn("age", ">", "salary").many(); // NOT (age > salary)
```

### `whereIn` and `whereNotIn`

Both accept an array of values or a subquery. An empty `whereIn` array produces an always-false predicate; an empty `whereNotIn` array produces an always-true predicate.

```typescript
await sql.from(User).whereIn("status", ["active", "pending"]).many();
await sql.from(User).whereNotIn("id", [1, 2, 3]).many();

// Subquery - return style
await sql
  .from(User)
  .whereIn("id", () => sql.from(Post).select("userId").where("published", true))
  .many();

// Or pass a pre-built builder
const postSub = sql.from(Post).select("userId").where("published", true);
await sql.from(User).whereIn("id", postSub).many();
```

### `whereNull` and `whereNotNull`

```typescript
await sql.from(User).whereNull("salary").many();
await sql.from(User).whereNotNull("email").many();
```

### `whereBetween` and `whereNotBetween`

```typescript
await sql.from(User).whereBetween("age", [18, 30]).many();
await sql.from(User).whereNotBetween("age", [18, 30]).many();
```

### `whereLike`, `whereILike`, and negations

`LIKE` is case-sensitive; `ILIKE` is the case-insensitive form. Each has `andWhere*` and `orWhere*` variants.

```typescript
await sql.from(User).whereLike("email", "%@example.com").many();
await sql.from(User).whereNotLike("email", "%spam%").many();
await sql.from(User).whereILike("name", "%john%").many();
await sql.from(User).whereNotILike("name", "%test%").many();
```

### `whereRegexp` and `whereNotRegexp`

```typescript
await sql
  .from(User)
  .whereRegexp("email", /^[a-z]+@example\.com$/)
  .many();
await sql.from(User).whereNotRegexp("name", /^test/i).many();
```

### `whereExists` and `whereNotExists`

The callback builds a nested query; change its table with `table()` when needed.

```typescript
await sql
  .from(User)
  .whereExists((q) => {
    q.table("posts")
      .select("userId")
      .where("published", true)
      .whereColumn("posts.userId", "users.id");
  })
  .many();

await sql
  .from(User)
  .whereNotExists((q) => {
    q.table("posts").select("userId").whereColumn("posts.userId", "users.id");
  })
  .many();
```

### `whereRaw`, `andWhereRaw`, `orWhereRaw`

Raw predicates accept `?` placeholders regardless of dialect.

```typescript
await sql.from(User).whereRaw("LOWER(name) = ?", ["alice"]).many();
await sql
  .from(User)
  .where("isActive", true)
  .andWhereRaw("age > ?", [18])
  .many();
await sql
  .from(User)
  .where("status", "active")
  .orWhereRaw("age > ?", [65])
  .many();
```

### Where method reference

Every family has `and*` and `or*` variants unless noted.

| Family             | Methods                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Basic comparison   | `where`, `andWhere`, `orWhere`, `whereNot`, `andWhereNot`, `orWhereNot`                                           |
| Columns            | `whereColumn`, `andWhereColumn`, `orWhereColumn`                                                                  |
| Sets               | `whereIn`, `andWhereIn`, `orWhereIn`, `whereNotIn`, `andWhereNotIn`, `orWhereNotIn`                               |
| Range              | `whereBetween`, `andWhereBetween`, `orWhereBetween`, `whereNotBetween`, `andWhereNotBetween`, `orWhereNotBetween` |
| Match              | `whereLike`, `whereILike`, `whereNotLike`, `whereNotILike` and `and*`/`or*`                                       |
| Regular expression | `whereRegexp`, `whereNotRegexp` and `and*`/`or*`                                                                  |
| Null               | `whereNull`, `whereNotNull` and `and*`/`or*`                                                                      |
| Existence          | `whereExists`, `whereNotExists` and `and*`/`or*`                                                                  |
| Raw                | `whereRaw`, `andWhereRaw`, `orWhereRaw`                                                                           |

## Joins

`join` and `innerJoin` are equivalent. Available join types are `innerJoin`, `join`, `leftJoin`, `rightJoin`, `fullJoin`, and `crossJoin`. The referencing and primary columns can be table-qualified strings or model-aware references.

```typescript
// Basic join
await sql
  .from(Post)
  .select("posts.*", "users.name")
  .join("users", "posts.userId", "users.id")
  .many();

// Join with a model
await sql
  .from(Post)
  .join(User, "id", "userId")
  .select("posts.*", "users.name")
  .many();

// Table aliases
await sql
  .from(Post)
  .join("users as u", "posts.userId", "u.id")
  .select("posts.*", "u.name")
  .many();
```

### Joins with extra conditions

Pass a callback as the last argument. It receives a join-on builder that supports the full where API, and the conditions are appended to the `ON` clause.

```typescript
await sql
  .from(Post)
  .select("posts.*")
  .join("users", "users.id", "posts.userId", (q) =>
    q.where("users.isActive", true).andWhere("users.status", "active"),
  )
  .many();

await sql
  .from(Post)
  .leftJoin("users", "users.id", "posts.userId", (q) =>
    q
      .whereIn("users.status", ["active", "pending"])
      .andWhere("users.age", ">=", 18),
  )
  .many();
```

### Cross joins

`crossJoin` joins every row of one table with every row of another. Pass a table name (with an optional alias) or a model.

```typescript
await sql.from(User).crossJoin("settings").select("*").many();
await sql.from(User).crossJoin("settings", "s").select("*").many();
await sql.from(User).crossJoin(Settings).select("*").many();
```

### Joins with `USING`

`using` replaces the `ON` clause of the most recent join with `USING (columns)`. It needs a preceding join and at least one column. It works on PostgreSQL, MySQL/MariaDB, CockroachDB, and SQLite; MSSQL has no `USING` and throws when the query is compiled.

```typescript
await sql.from(User).join("posts").using("userId").select("*").many();
// ... inner join "posts" using ("userId")
```

### Raw joins

Use raw variants when the join clause cannot be expressed with columns. `crossJoinRaw` and `naturalJoinRaw` cover the join types that have no dedicated method.

| Method           | Join type  |
| ---------------- | ---------- |
| `joinRaw`        | INNER      |
| `leftJoinRaw`    | LEFT       |
| `rightJoinRaw`   | RIGHT      |
| `fullJoinRaw`    | FULL OUTER |
| `crossJoinRaw`   | CROSS      |
| `naturalJoinRaw` | NATURAL    |

```typescript
await sql
  .from("posts")
  .joinRaw("JOIN users ON users.id = posts.userId")
  .select("posts.*", "users.name")
  .many();
```

## Grouping and having

`groupBy` accepts one or more columns; `groupByRaw` adds a raw expression. `having`, `andHaving`, and `orHaving` accept the same value/operator forms as `where`. Use `havingRaw`, `andHavingRaw`, or `orHavingRaw` for aggregate expressions.

```typescript
// Aggregate alias in HAVING
await sql
  .from(Post)
  .select("userId")
  .selectFunc("count", "*", "postCount")
  .groupBy("userId")
  .having("postCount", ">", 1)
  .many();

// Raw grouping and having
await sql
  .from(Post)
  .groupByRaw("date_trunc('month', created_at)")
  .havingRaw("count(*) > 1")
  .many();
```

The HAVING helpers mirror the where family, each with `and...` and `or...` variants:

```typescript
await sql.from(User).groupBy("status").havingNull("status").many();
await sql.from(User).groupBy("status").havingNotNull("status").many();
await sql.from(User).groupBy("status").havingIn("status", ["active"]).many();
await sql.from(User).groupBy("status").havingNotIn("status", ["banned"]).many();
await sql.from(Post).groupBy("userId").havingBetween("userId", [1, 100]).many();
await sql
  .from(Post)
  .groupBy("userId")
  .havingNotBetween("userId", [1, 100])
  .many();
```

`havingIn` and `havingNotIn` also take a subquery instead of an array.

`havingWrapped` groups a set of HAVING conditions. `havingExists` and `havingNotExists` accept a subquery callback.

```typescript
await sql
  .from(User)
  .groupBy("status")
  .havingWrapped((q) =>
    q.having("status", "active").orHaving("status", "pending"),
  )
  .many();

await sql
  .from(User)
  .groupBy("status")
  .havingExists((q) => q.select("name").where("name", "Alice"))
  .many();
```

## Ordering, distinct, limit, and offset

```typescript
await sql.from(User).orderBy("age", "desc").orderByRaw("RANDOM()").many();

// DISTINCT
await sql.from(User).distinct().select("status").many();

// DISTINCT ON - PostgreSQL only; pair it with a matching orderBy
await sql
  .from(User)
  .distinctOn("status")
  .select("status", "createdAt")
  .orderBy("createdAt", "desc")
  .many();

await sql.from(User).limit(10).offset(20).many();
```

## Aggregates

The aggregate helpers return a single number. They ignore `select`, `groupBy`, `orderBy`, `limit`, and `offset`; for `groupBy`, `having`, or `distinct` queries the count wraps the original query in a derived table.

```typescript
const total = await sql.from(User).getCount();
const nonNull = await sql.from(User).getCount("email");
const maxAge = await sql.from(User).getMax("age");
const minAge = await sql.from(User).getMin("age");
const avgAge = await sql.from(User).getAvg("age");
const totalSalary = await sql.from(User).getSum("salary");
```

For typed aggregate columns in a single row, use `selectFunc` and `selectRaw` as described in [SQL Functions, Aggregates & Raw SQL](/databases/sql/query-builder/sql-functions).

## Subqueries

Subquery callbacks can mutate the builder passed to them ("mutate" style) or return any `QueryBuilder` / `ModelQueryBuilder` ("return" style). The return style is required when the subquery targets another model or table.

| Style  | How it works                                                 | Use for                      |
| ------ | ------------------------------------------------------------ | ---------------------------- |
| Mutate | Mutates the passed builder in place; callback returns `void` | Subqueries on the same table |
| Return | Returns a new builder; the passed builder is ignored         | Cross-model or cross-table   |

```typescript
// Mutate style
await sql
  .from(User)
  .whereIn("id", (sub) => {
    sub.select("userId").table("posts").where("published", true);
  })
  .many();

// Return style
await sql
  .from(User)
  .whereIn("id", () => sql.from(Post).select("userId").where("published", true))
  .many();

// Scalar subquery selected as a column
const users = await sql
  .from(User)
  .select("name")
  .select<number>(
    () =>
      sql
        .from(Post)
        .selectRaw("count(*) as postCount")
        .whereRaw("posts.user_id = users.id"),
    "postCount",
  )
  .many();
```

## Common table expressions

`with` adds a normal CTE, `withRecursive` a recursive one, `withMaterialized` a materialized one, and `withNotMaterialized` a non-materialized one. Materialized and non-materialized CTEs are PostgreSQL and CockroachDB only; recursive CTEs are not supported on MSSQL. Declare CTEs before selecting from them with `table()`. Both mutate and return callback styles are supported.

```typescript
// Mutate style
const activeUsers = await sql
  .from(User)
  .with("active_users", (qb) => {
    qb.select("id", "name").where("isActive", true);
  })
  .table("active_users")
  .many();

// Return style
const activeUsers2 = await sql
  .from(User)
  .with("active_users", () =>
    sql.from(User).select("id", "name").where("isActive", true),
  )
  .table("active_users")
  .many();

// Recursive CTE
await sql
  .from(User)
  .withRecursive("tree", (qb) => {
    qb.select("id", "parentId").whereNull("parentId");
  })
  .table("tree")
  .many();

// Non-materialized CTE (PostgreSQL, CockroachDB)
await sql
  .from(User)
  .withNotMaterialized("active_users", (qb) => {
    qb.select("id", "name").where("isActive", true);
  })
  .table("active_users")
  .many();
```

CTEs also work on `insert`, `update`, and `delete`, with dialect restrictions that differ from the select case. See [Write Statements](/databases/sql/query-builder/write-statements) for the placement rules per dialect.

Pass a column array as the second argument to declare the CTE's column names explicitly:

```typescript
await sql
  .from(User)
  .with("active_users", ["id", "name"], (qb) => {
    qb.select("id", "name").where("isActive", true);
  })
  .table("active_users")
  .many();
```

## Set operations

`union` removes duplicate rows; `unionAll` keeps them. `intersect` keeps only rows present in both queries, and `except` keeps rows from the first query that are absent from the second. All four accept a raw SQL string, a raw SQL string with a bindings array, or a callback that builds the second query.

```typescript
await sql
  .from(User)
  .select("name")
  .union((qb) => {
    qb.table("archived_users").select("name");
  })
  .many();

await sql
  .from(User)
  .select("name")
  .unionAll("SELECT name FROM archived_users")
  .many();

await sql
  .from(User)
  .select("name")
  .unionAll("SELECT name FROM archived_users WHERE deleted_at < ?", ["2026-01-01"])
  .many();

await sql
  .from(User)
  .select("id")
  .intersect((qb) => qb.table("admins").select("id"))
  .many();

await sql.from(User).select("id").except("SELECT id FROM banned").many();
```

## Pagination

Hysteria ORM provides offset-based pagination (`paginate`) and cursor-based pagination (`paginateWithCursor`).

### Offset-based

`paginate(page, perPage)` returns a page of rows plus metadata. It works on both builders (`sql.from("users").paginate(1, 10)`).

```typescript
const page = await sql.from(User).where("isActive", true).paginate(2, 25);
console.log(page.data); // User[]
console.log(page.paginationMetadata);
```

| Property       | Type      | Description                                 |
| -------------- | --------- | ------------------------------------------- |
| `total`        | `number`  | Total number of matching records            |
| `perPage`      | `number`  | Number of records per page                  |
| `currentPage`  | `number`  | Current page number                         |
| `firstPage`    | `number`  | Always `1`                                  |
| `isEmpty`      | `boolean` | `true` if total is `0`                      |
| `lastPage`     | `number`  | Last page number (minimum `1`)              |
| `hasMorePages` | `boolean` | `true` if there are pages after the current |
| `hasPages`     | `boolean` | `true` if total exceeds `perPage`           |

### Cursor-based

`paginateWithCursor(limit, cursor?)` uses the `orderBy` clause as the source of truth: the cursor is the last row's sort value, and the next page starts after it. An `orderBy` clause is required, and `orderByRaw` is not supported for cursors. It fetches `limit + 1` rows to detect more results, so it never runs a `COUNT(*)`.

```typescript
const { data, nextCursor, hasMore } = await sql
  .from(User)
  .orderBy("id", "asc")
  .paginateWithCursor(10);

const next = await sql
  .from(User)
  .orderBy("id", "asc")
  .paginateWithCursor(10, nextCursor);
```

Add multiple `orderBy` calls to paginate on a composite key (e.g. `(tenantId, createdAt)`); the generated `WHERE` uses tuple comparison semantics.

```typescript
const { data, nextCursor } = await sql
  .from(Event)
  .orderBy("tenantId", "asc")
  .orderBy("createdAt", "asc")
  .paginateWithCursor(10);
```

| Property     | Type             | Description                                                 |
| ------------ | ---------------- | ----------------------------------------------------------- |
| `data`       | `Model[]`        | Up to `limit` rows for the current page.                    |
| `nextCursor` | `Cursor \| null` | Cursor for the next call, or `null` when the page is empty. |
| `hasMore`    | `boolean`        | `true` if there are more rows after this page.              |

`hasMore` is derived from the `limit + 1` fetch: a page that ends exactly on the last row may report `hasMore: true`, and the next call returns an empty page.

`chunk` processes large result sets in batches:

```typescript
for await (const users of sql.from(User).chunk(250)) {
  await processUserBatch(users);
}
```

`stream` returns an async generator and a Node.js readable stream. It is experimental and runs neither hooks nor serialization.

```typescript
for await (const user of await sql.from(User).stream()) {
  console.log(user.name);
}
```

| Strategy             | Best for                         | Pros                                   | Cons                                  |
| -------------------- | -------------------------------- | -------------------------------------- | ------------------------------------- |
| `paginate`           | Numbered pages, admin dashboards | Simple API, total count, page metadata | Slower on very deep offsets           |
| `paginateWithCursor` | Infinite scroll, real-time feeds | Consistent performance at any depth    | No random page access, no total pages |
| `chunk`              | Batch processing, data exports   | Memory efficient                       | Not for API responses                 |

## Locking

Row locks are available on PostgreSQL and MySQL.

```typescript
await sql.from(User).lockForUpdate().many();
await sql.from(User).lockForUpdate({ skipLocked: true }).many();
await sql.from(User).forShare({ noWait: true }).many();
```

PostgreSQL also exposes the two weaker row-lock strengths. `forNoKeyUpdate` does not block foreign keys that reference the row, and `forKeyShare` only blocks updates that change a key value. Both take `skipLocked` and `noWait`.

```typescript
await sql.from(User).forNoKeyUpdate().many();
await sql.from(User).forKeyShare({ skipLocked: true }).many();
```

## Query timeout

`timeout(ms)` caps how long a query may run and rejects with a `QUERY_TIMEOUT` `HysteriaError` when the limit is exceeded. Pass `{ cancel: true }` to also terminate the running statement on PostgreSQL and MySQL/MariaDB; MSSQL cancels its request, while SQLite and Bun only enforce the wall-clock timeout.

```typescript
try {
  await sql.from(User).timeout(2000).many();
  await sql.from(User).timeout(2000, { cancel: true }).many();
} catch (error) {
  // error.code === "QUERY_TIMEOUT"
}
```

## Comments

`comment` prepends a native comment to the select statement; `hintComment` emits an optimizer hint after `SELECT` and is callable only on MySQL and MariaDB. Both are select-only and stackable.

```typescript
await sql
  .from(User)
  .select("*")
  .comment("-- active users")
  .comment("/* audit trail */")
  .where("isActive", true)
  .many();

await sql.from(User).select("*").hintComment("/*+ NO_ICP(users) */").many();
```

## Column metadata

`columnInfo()` reads column metadata for the query's table. Call it with no argument for every column, or with a name for a single column.

```typescript
const columns = await sql.from(User).columnInfo();
const email = await sql.from(User).columnInfo("email");
// { name, dataType, isNullable, defaultValue, ... }
```

## Row helpers

```typescript
const names = await sql.from(User).pluck("name"); // string[]

await sql.from(User).where("id", 1).increment("age", 1);
await sql.from(User).where("id", 1).decrement("age", 1);

const exists = await sql.from(User).where("email", "a@example.com").exists();
```

## See also

- [Query Builder Overview](/databases/sql/query-builder/overview)
- [SQL Functions, Aggregates & Raw SQL](/databases/sql/query-builder/sql-functions)
- [JSON Columns](/databases/sql/advanced/json)
