---
title: Query Builder Overview
description: "How the Hysteria ORM query builders work: typed model queries, raw table queries, the shared chainable API, cloning, and clearing clauses."
keywords:
  [
    hysteria-orm,
    query builder,
    ModelQueryBuilder,
    QueryBuilder,
    chaining,
    toQuery,
    clone,
  ]
---

# Query builder overview

Every SQL query in Hysteria ORM starts from a `SqlDataSource` and one of two entry points. Both return a builder that shares the same chainable surface, so filtering, joins, grouping, pagination, CTEs, unions, locking, and comments work the same way for either entry point. Build the query first, then execute it with `many()`, `one()`, or `oneOrFail()`.

## Two entry points

Call `sql.from()` with a model or with a table name:

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

const sql = new SqlDataSource({ type: "sqlite", database: "app.db" });
await sql.connect();

// ModelQueryBuilder - type-safe against the model, hooks, relations, serialization
const users = await sql.from(User).where("isActive", true).many();

// QueryBuilder - raw table, driver rows returned as-is
const rows = await sql.from("users").where("is_active", true).many();
```

`sql.from(Model)` returns a `ModelQueryBuilder`. `sql.from("table")` returns a `QueryBuilder`. The table form accepts an optional options object with `alias`, `databaseCaseConvention`, `softDeleteColumn`, and `softDeleteValue`.

## Model vs raw

| Aspect        | `sql.from(Model)`                             | `sql.from("table")`                  |
| ------------- | --------------------------------------------- | ------------------------------------ |
| Builder       | `ModelQueryBuilder`                           | `QueryBuilder`                       |
| Result type   | `ModelWithoutRelations<T>[]`                  | `Record<string, any>[]`              |
| Type safety   | Model columns and their types                 | Column names only; values are `any`  |
| Hooks         | `beforeFetch` and other model hooks           | None                                 |
| Relations     | `load()`, `clearRelations()`, related filters | None                                 |
| Serialization | Model serialization and computed columns      | Raw driver rows                      |
| Best for      | Application logic                             | Migrations, scripts, max performance |

Model column names are converted to the model's database case convention, both for plain names (`isActive`) and for `table.column` references (`users.isActive`). Raw queries use database column names verbatim.

## Awaiting a builder

Both builders implement `then`, `catch`, and `finally`, so you can `await` a builder directly. Awaiting is equivalent to calling `.many()` with no options:

```typescript
// Equivalent to .many()
const users = await sql.from(User).where("isActive", true);

// Use .one() or .oneOrFail() for a single row
const user = await sql.from(User).where("id", 1).one();
const required = await sql.from(User).where("id", 1).oneOrFail();
```

Use `exists()` when you only need to know whether a matching row is present:

```typescript
const hasActiveUsers = await sql.from(User).where("isActive", true).exists();
```

Write operations (`insert`, `update`, `delete`, `truncate`) return a `WriteOperation` that runs only when awaited. You can inspect the SQL before executing:

```typescript
const insertOp = sql.from("users").insert({ name: "John" });
console.log(insertOp.toQuery());

const result = await insertOp;
```

## Inspecting a query

Both builders expose the generated SQL without executing it:

```typescript
const query = sql.from(User).where("status", "active");

query.toQuery(); // SQL string with bindings interpolated - debugging only
const { sql: formatted, bindings } = query.toSql(); // driver placeholders + bindings
const { sql: raw, bindings: rawBindings } = query.unWrap(); // AST-parsed query
```

`toQuery()` interpolates bindings for readability and is not meant for execution. `toSql()` keeps driver placeholders. `unWrap()` returns the unformatted parse result used by the runner. None of the three apply model hooks or include `load()` operations.

## Chaining, cloning, and clearing

Builder methods mutate the builder in place and return `this`, so a chain describes a single query. Use `clone()` to branch before adding clauses that differ per branch, and `clear()` to obtain a fresh builder that keeps the table and alias but drops all clauses:

```typescript
const base = sql.from(User).where("isActive", true);

const recent = base.clone().orderBy("createdAt", "desc").many();
const oldest = base.clone().orderBy("createdAt", "asc").many();

const fresh = base.clear(); // same table, no where clause
```

### Clearing clauses

Every clause has a matching `clear*` method. Each drops only that clause and returns the builder.

| Method             | Removes                    |
| ------------------ | -------------------------- |
| `clearSelect`      | SELECT columns and aliases |
| `clearFrom`        | FROM target                |
| `clearWhere`       | WHERE conditions           |
| `clearHaving`      | HAVING conditions          |
| `clearGroupBy`     | GROUP BY                   |
| `clearOrderBy`     | ORDER BY                   |
| `clearLimit`       | LIMIT                      |
| `clearOffset`      | OFFSET                     |
| `clearDistinct`    | DISTINCT                   |
| `clearDistinctOn`  | DISTINCT ON                |
| `clearJoin`        | JOIN clauses               |
| `clearComment`     | native SQL comments        |
| `clearHintComment` | optimizer hint comments    |
| `clearLockQuery`   | row locks                  |
| `clearUnionQuery`  | UNION / UNION ALL          |
| `clearWithQuery`   | CTEs                       |
| `clear`            | all of the above           |

```typescript
const users = await sql.from(User).select("name").clearSelect().many();
```

## Conditional building

Use `when()` and `strictWhen()` to add clauses conditionally. `when()` runs the callback only when the value is truthy. `strictWhen()` runs it whenever the value is neither `null` nor `undefined`, so `false`, `0`, and `""` still apply the clause.

```typescript
const filters = { status: "active", search: "", minAge: 0 };

const users = await sql
  .from(User)
  .when(filters.status, (q) => q.where("status", filters.status))
  .strictWhen(filters.search, (q) =>
    q.where("name", "like", `%${filters.search}%`),
  )
  .strictWhen(filters.minAge, (q) => q.where("age", ">=", filters.minAge))
  .many();
```

## See also

- [Building Queries](/databases/sql/query-builder/queries)
- [SQL Functions, Aggregates & Raw SQL](/databases/sql/query-builder/sql-functions)
- [Programmatic Models](/databases/sql/models/define-model)
- [Relations Overview](/databases/sql/relations/overview)
