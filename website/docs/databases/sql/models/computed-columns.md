---
title: Computed Columns
description: "Define database-side computed (virtual) columns with col.computed() and @column.computed() in Hysteria ORM."
keywords:
  [
    hysteria-orm,
    computed columns,
    virtual columns,
    col.computed,
    column.computed,
    generated columns,
  ]
sidebar_position: 7
---

# Computed Columns

Computed (virtual) columns are model properties whose value is **evaluated by the database at query time** from a raw SQL expression, instead of being stored as a physical column or computed in TypeScript. Because the expression is pushed down into the generated SQL, the computation runs inside the database engine — efficient for filtering, sorting, and aggregation directly on the server.

They are useful for derived fields such as `fullName` from `first_name` + `last_name`, `total` from `price * quantity`, or any expression you want the DB to compute without materializing a column.

## Overview

A computed column:

- **Has no physical column** — it carries no `type`, so it is excluded from auto-generated migrations.
- **Is never written** on `insert` / `update` — values supplied for it are silently dropped.
- **Only appears in results when explicitly selected** — `.select(User.fullName)` or `[User.fullName, "alias"]` tuples. A plain `select *` / `.one()` / `.many()` omits it.
- **Resolves to the raw expression** when referenced in `WHERE` / `ORDER BY` / `GROUP BY` / `HAVING`, so the database evaluates it there too.
- **Is inferred as `T | undefined`** on model instances, since it is absent from results unless explicitly selected.

## Defining a Computed Column

There are two equivalent ways to define a computed column: programmatically with `col.computed()` (recommended), or with the `@column.computed()` decorator.

### `col.computed()` (with `defineModel`)

```typescript
import { defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    firstName: col.string({ nullable: false }),
    lastName: col.string({ nullable: false }),
    fullName: col.computed<string>("concat(first_name, ' ', last_name)"),
  },
});
```

### `@column.computed()` (decorator)

```typescript
import { Model, column } from "hysteria-orm";

class User extends Model {
  @column.computed("concat(first_name, ' ', last_name)")
  fullName!: string | undefined;
}
```

Both forms register identical column metadata. The expression is stored as raw SQL and is **not** case-converted or ported across dialects — write it in your database's own syntax.

## Querying

### Selecting the value

```typescript
// Explicitly selected — the result has fullName, computed by the DB
const user = await sql.from(User).select(User.fullName).one();
// user.fullName === "John Doe"

// Not selected — fullName is absent from the result
const plain = await sql.from(User).one();
// plain.fullName === undefined
```

### Custom alias

Pass a `[column, alias]` tuple to rename the result key:

```typescript
const row = await sql
  .from(User)
  .select([User.fullName, "displayName"])
  .one();
// row.displayName === "Jane Smith"
// row.fullName === undefined
```

### Filtering, sorting, and grouping

References in `WHERE` / `ORDER BY` / `GROUP BY` / `HAVING` resolve to the raw expression, so the database evaluates it in place:

```typescript
// WHERE clause — DB evaluates the expression
const alice = await sql
  .from(User)
  .select(User.fullName)
  .where(User.fullName, "Alice Able")
  .one();

// ORDER BY — DB sorts on the computed value
const rows = await sql
  .from(User)
  .select(User.firstName, User.lastName, User.fullName)
  .orderBy(User.fullName, "asc")
  .many();
```

## Behavior on Writes

Computed columns are never persisted. They are **stripped at every write entry point** — both in the SQL preview (`toSql()` / `unWrap()` / `toQuery()`) and in the executed query — so a computed column can never appear in:

- `INSERT` column lists / values
- `UPDATE` `SET` clauses
- `ON CONFLICT DO UPDATE SET` (Postgres/SQLite)
- `ON DUPLICATE KEY UPDATE` (MySQL/MariaDB)
- `MERGE` target clauses (MSSQL)

Any value supplied for a computed column is silently dropped before the AST is built, so `toSql()` and the actual executed query are always consistent:

```typescript
await sql.from(User).insert({
  firstName: "Eve",
  lastName: "Adams",
  fullName: "should be ignored", // silently dropped — not written
});

const row = await sql.from(User).one();
// row.firstName === "Eve"
// row.lastName === "Adams"
// row.fullName === undefined (not selected)
```

This also applies to `upsert` / `upsertMany` — a computed column passed in the data object is removed from both the `columnsToUpdate` list and the insert payload before the `ON CONFLICT` / `ON DUPLICATE KEY UPDATE` clause is generated:

```typescript
// fullName is stripped from both the INSERT and the ON CONFLICT DO UPDATE SET
await sql.from(User).upsertMany(
  ["id"],
  [{ id: 1, firstName: "Eve", lastName: "Adams", fullName: "ignored" as any }],
);
```

Validators on computed columns are also skipped, since the value is never written.

## Migrations

Computed columns carry no `type`, so the schema diff never emits them. You only need to migrate the **physical** columns the expression references. For the `User` model above, a migration would only create `id`, `first_name`, and `last_name`:

```typescript
await sql
  .schema()
  .createTable("users", (table) => {
    table.increment("id").primaryKey();
    table.string("first_name").notNullable();
    table.string("last_name").notNullable();
  })
  .execute();
```

## Dialect-Specific Expressions

The expression is raw SQL passed straight to the database — no case conversion or cross-dialect porting is applied. If you support multiple databases, write a dialect-specific expression:

```typescript
function concatExpr(dbType: string): string {
  switch (dbType) {
    case "mysql":
    case "mariadb":
      return "concat(first_name, ' ', last_name)";
    case "mssql":
      return "first_name + ' ' + last_name";
    case "postgres":
    case "cockroachdb":
    case "sqlite":
    default:
      return "first_name || ' ' || last_name";
  }
}

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    firstName: col.string({ nullable: false }),
    lastName: col.string({ nullable: false }),
    fullName: col.computed<string>(concatExpr(env.DB_TYPE ?? "sqlite")),
  },
});
```

:::warning
Column names inside the expression refer to the **database** column names (after case conversion), not the model property names. `firstName` in the model becomes `first_name` in the expression.
:::

## Options

`col.computed()` / `@column.computed()` accept an optional options object. Because the column is virtual, the usual write-related options (`type`, `primaryKey`, `prepare`, `default`, `autoUpdate`) are not available.

| Option         | Type                          | Description                                                                          |
| -------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| `databaseName` | `string`                      | Custom alias used in the SELECT clause (defaults to the case-converted column name). |
| `serialize`    | `(value: any) => any`         | Callback applied to the value returned from the DB before it is placed on the model. |
| `nullable`     | `boolean`                     | If `false`, marks the column as non-nullable (metadata only — no DB constraint).    |
| `validate`     | `Validator \| Validator[]`    | Validators. Skipped in practice, since computed columns are never written.          |

```typescript
const Product = defineModel("products", {
  columns: {
    id: col.increment(),
    price: col.decimal({ precision: 10, scale: 2, nullable: false }),
    quantity: col.integer({ nullable: false }),
    // Custom alias + serialize to a Number
    total: col.computed<number>("price * quantity", {
      databaseName: "line_total",
      serialize: (v) => (v == null ? undefined : Number(v)),
    }),
  },
});

const p = await sql.from(Product).select(Product.total).one();
// p.total === 42.5 (already a Number)
```

## TypeScript Types

- `col.computed<T>(...)` returns a `ComputedColumnDef<T>`.
- On inferred model instances, a computed column is typed as `T | undefined` (absent when not selected).
- `ColComputedOptions` is exported for building reusable option helpers.

```typescript
import type { ComputedColumnDef, ColComputedOptions } from "hysteria-orm";

const def: ComputedColumnDef<string> = col.computed<string>("...");
const opts: ColComputedOptions = { databaseName: "full_name" };
```

## When to Use Computed Columns

| Scenario                                                              | Recommendation                                          |
| --------------------------------------------------------------------- | ------------------------------------------------------- |
| The expression must run in the DB (filtering/sorting on the value).   | **Computed column** — expression is pushed into SQL.    |
| You only need a derived value on read, in TypeScript.                 | A getter property or `afterFetch` hook.                 |
| You need the value persisted and indexed by the DB.                   | A real DB column kept in sync via hooks/`prepare`.     |
| You need a read-only virtual table over a complex query.              | A [database view](./views.md) via `defineView`.        |

:::tip
Computed columns are best when the computation belongs in SQL — for example, when you want to `WHERE` / `ORDER BY` on the derived value without duplicating the expression in every query.
:::
