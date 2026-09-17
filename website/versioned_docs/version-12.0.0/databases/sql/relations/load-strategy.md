---
title: Relation Load Strategy
description: "Control how Hysteria ORM loads relations: auto, join, or batched strategy for optimal performance."
keywords:
  [
    hysteria-orm,
    relations,
    load strategy,
    join,
    batched,
    auto,
    eager loading,
    performance,
  ]
sidebar_position: 6
---

# Relation Load Strategy

Hysteria ORM gives you control over how relations are fetched via the `strategy` option on `.load()`.

```typescript
// explicit strategy
await sql.from(User).load("posts", { strategy: "join" }).many();

// strategy + query builder
await sql
  .from(User)
  .load("posts", (qb) => qb.where("published", true), { strategy: "batched" })
  .many();
```

There are three strategies: **`auto`** (default), **`join`**, and **`batched`**.

---

## `auto` — Recommended

```typescript
// auto is the default, no need to specify it explicitly
await sql.from(User).load("posts").many();

// or explicitly
await sql.from(User).load("posts", { strategy: "auto" }).many();
```

**Auto** inspects the query context at runtime and selects the most appropriate strategy. It is the recommended choice for almost every use case.

### Selection rules

| Condition | Strategy chosen |
|-----------|----------------|
| `hasMany` or `manyToMany` with `limit` or `offset` on the relation | `batched` |
| Single parent (`parentCount === 1`, e.g. after `.one()`) | `join` |
| `manyToMany` with ≤ 10 parents | `join` |
| Any relation with ≤ 9 parents | `join` |
| Everything else (large parent sets) | `batched` |

Rules are evaluated in the order shown above — the first match wins.

---

## `join` — Single-query loading

```typescript
await sql.from(User).load("posts", { strategy: "join" }).many();
```

Fetches the parent and all related records in a single SQL query using `LEFT JOIN`.

- `hasOne` / `hasMany`: joins on the foreign key.
- `belongsTo`: joins on the primary key of the related model.
- `manyToMany`: double join through the junction table.

**Pros**
- One round-trip to the database.
- Fastest for small parent sets or single records.

**Cons**
- Can cause large result sets (Cartesian product) with many-to-many or large datasets.
- Does **not** support nested `.load()` calls — if the relation QB contains nested loads, it automatically falls back to `batched`.
- `limit` / `offset` on a `hasMany` relation cannot be expressed correctly in a JOIN — `auto` will never choose `join` for those cases.

---

## `batched` — Multiple-query loading

```typescript
await sql.from(User).load("posts", { strategy: "batched" }).many();
```

Fetches related records in a separate query using `WHERE foreignKey IN (...)`, one query per relation type.

- `hasMany` / `manyToMany` with `limit`/`offset`: uses a CTE with `ROW_NUMBER()` to apply per-parent pagination correctly.

**Pros**
- Safe for large datasets — no Cartesian product risk.
- Supports nested `.load()` calls.
- `limit` / `offset` on `hasMany` and `manyToMany` work correctly per parent.

**Cons**
- Two or more queries per `.load()` call (one for the parent, one per relation).

---

## API reference

```typescript
type RelationLoadStrategy = "auto" | "join" | "batched";

interface LoadOptions {
  /** @default 'auto' */
  strategy?: RelationLoadStrategy;
  /** Separator for JOIN column aliases. @default '__' */
  joinSeparator?: string;
}
```

All `.load()` overloads accept an optional `LoadOptions` object:

```typescript
// relation only
.load("posts")

// relation + query builder
.load("posts", (qb) => qb.where("published", true))

// relation + options
.load("posts", { strategy: "batched" })

// relation + query builder + options
.load("posts", (qb) => qb.orderBy("id", "desc"), { strategy: "join" })
```

---

## When to override `auto`

In practice, `auto` covers the vast majority of cases correctly. The two situations where an explicit override makes sense are:

1. **Force `join` for a known-small dataset** — you know the parent set will always be small (e.g. a fixed enum table) and want to guarantee a single query.
2. **Force `batched` for safety** — you expect highly variable parent counts and want predictable, consistent query plans regardless of the current result set size.

:::tip
When in doubt, leave the strategy as `auto`. It will make the right call based on the actual data and query shape at runtime.
:::
