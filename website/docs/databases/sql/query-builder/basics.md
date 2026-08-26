---
title: Query Builder Basics
description: "Query builder basics for SQL databases: where, select, orderBy, limit with Hysteria ORM."
keywords: [hysteria-orm, query builder, SQL query, where clause, filtering]
sidebar_position: 1
---

# Query Builder Basics

In all examples below, `sql` is a `SqlDataSource` instance — the entry point for building queries.

Hysteria ORM provides two query builders for different use cases:

| Builder                                       | Type Safety | Use Case                                  |
| --------------------------------------------- | ----------- | ----------------------------------------- |
| [ModelQueryBuilder](./model-query-builder.md) | Partial     | Model-aware queries with hooks, relations |
| [QueryBuilder](./query-builder.md)            | None        | Raw SQL, migrations, max performance      |

## Quick Comparison

```typescript
// ModelQueryBuilder - type-safe, uses model conventions
const users = await sql.from(User).where("isActive", true).load("posts").many();

// QueryBuilder - raw SQL, no model features, type safe only for selected columns
const users = await sql.from("users").where("is_active", true).many();
```

## Awaiting a Query Builder

Both `QueryBuilder` and `ModelQueryBuilder` implement the `PromiseLike` interface, so you can `await` them directly. **Awaiting a query builder is equivalent to calling `.many()`** — it executes the query and returns an array of results.

```typescript
// These are equivalent:
const users = await sql.from(User).where("isActive", true); // runs many() without options
const users = await sql.from(User).where("isActive", true).many(); // allows to pass options to many()
```

This also works with the raw `QueryBuilder`:

```typescript
const rows = await sql.from("users").where("status", "active");
// Same as: sql.from('users').where('status', 'active').many()
```

For single results, use `.one()` or `.oneOrFail()` explicitly:

```typescript
const user = await sql.from(User).where("id", 1).one();
```

## Debugging Queries

Both builders support debugging with `toQuery()` and `unWrap()`:

```typescript
const query = sql.from(User).where("status", "active");
console.log(query.toQuery()); // See generated SQL
const { sql: rawSql, bindings } = query.toSql();
console.log(rawSql); // Raw SQL with placeholders
console.log(bindings); // Array of bindings for placeholders
```

Write operations like `insert()`, `update()`, `delete()` return a `WriteOperation` that is only executed when awaited. You can inspect the SQL without executing:

```typescript
// Get the SQL without executing
const insertOp = sql.from("users").insert({ name: "John" });
console.log(insertOp.toQuery()); // See the INSERT SQL

// Execute by awaiting
const result = await insertOp;
```

---

Next: [Model Query Builder](./model-query-builder.md)
