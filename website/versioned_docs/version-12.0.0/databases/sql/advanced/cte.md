---
title: Common Table Expressions (CTE)
description: "Common Table Expressions and recursive queries in Hysteria ORM."
keywords: [hysteria-orm, CTE, common table expressions, recursive queries]
sidebar_position: 1
---

# Common Table Expressions (CTE)

CTEs allow you to build reusable query fragments and simplify complex queries by breaking them into named subqueries.

## Example Usage

```typescript
const users = await sql
  .from(User)
  .with("users_cte", (qb) => qb.select("name"))
  .many();
```

## Types of CTEs

### Normal CTE

```typescript
const users = await sql
  .from(User)
  .with("users_cte", (qb) => qb.select("name"))
  .with("users_cte2", (qb) => qb.select("age"))
  .many();
```

### Recursive CTE

```typescript
const users = await sql
  .from(User)
  .withRecursive("users_cte", (qb) => qb.select("name"))
  .withRecursive("users_cte2", (qb) => qb.select("age"))
  .many();
```

### Materialized CTE (PostgreSQL/CockroachDB only)

```typescript
const users = await sql
  .from(User)
  .withMaterialized("users_cte", (qb) => qb.select("name"))
  .many();
```

CTEs can be used for:

- Recursive queries
- Simplifying multi-step data transformations
- Improving query readability

---

See also:

- [JSON Columns](./json.md)
- [SQLite JSON Limitations](./sqlite-json-limitations.md)
- [Transactions](./transactions.md)

Next: [MongoDB Introduction](../../nosql/mongodb/introduction.md)
