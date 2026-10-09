---
title: Write Statements
description: "The shape of SQL write statements in Hysteria ORM: CTEs on writes, insertFrom, batch inserts, multi-table writes, conflict targets, truncate options, and the clauses a write rejects."
keywords:
  [
    hysteria-orm,
    insertFrom,
    batchInsert,
    updateFrom,
    deleteUsing,
    onConflict,
    truncate,
    cte,
    with,
    write,
    upsert,
  ]
---

# Write statements

`insert`, `insertMany`, `insertFrom`, `update`, `delete`, `softDelete`, and `truncate` all return a `WriteOperation`. Building one does not touch the database; it runs when you await it, so you can inspect the SQL beforehand.

```typescript
const op = sql.from("users").where("status", "inactive").delete();

op.toSql(); // { sql, bindings } - driver placeholders
op.toQuery(); // interpolated SQL, for debugging only
const affected = await op;
```

Column options, conflict handling, and per-dialect `returning` behavior are covered in [Reading & writing data](/databases/sql/standard-methods/basics). This page covers the statement shapes.

## CTEs on writes

`with()` works on writes the same way it works on selects. On PostgreSQL, CockroachDB, MSSQL, and SQLite the CTE renders ahead of the statement:

```typescript
await sql
  .from("users")
  .with("targets", (qb) =>
    qb.select("id").table("users").where("status", "inactive"),
  )
  .whereIn("id", (qb) => qb.select("id").fromRaw("targets"))
  .delete();
```

MySQL and MariaDB accept a CTE only in front of a `SELECT`, and they differ from each other:

| Dialect                             | `with ... insert ... values`    | `with ... insert ... select`      | `with ... update` / `delete`      |
| ----------------------------------- | ------------------------------- | --------------------------------- | --------------------------------- |
| PostgreSQL, CockroachDB, MSSQL, SQLite | led by the CTE               | led by the CTE                    | led by the CTE                    |
| MySQL                               | throws `CTE_NOT_SUPPORTED_ON_INSERT` | CTE inline after the column list | led by the CTE                 |
| MariaDB                             | throws `CTE_NOT_SUPPORTED_ON_INSERT` | CTE inline after the column list | throws `CTE_NOT_SUPPORTED_ON_WRITE` |

`truncate` takes no CTE on any dialect and throws `CTE_NOT_SUPPORTED_ON_TRUNCATE`.

A CTE carries its bindings, so they land before the values of the statement they drive:

```typescript
const { sql: rendered, bindings } = sql
  .from("users")
  .with("targets", (qb) => qb.select("id").table("users").where("id", 7))
  .insert({ name: "John" })
  .toSql();

// rendered: with "targets" as (select "id" from "users" where "id" = $1) insert into "users" ("name") values ($2)
// bindings: [7, "John"]
```

## Inserting from a select

`insertFrom` copies the rows a SELECT produces into the table. Pass the source builder, or a callback that builds one:

```typescript
await sql
  .from("archived_users")
  .insertFrom((qb) =>
    qb.select("name", "email").table("users").where("status", "inactive"),
  );

await sql
  .from("archived_users")
  .insertFrom(["name", "email"], (qb) =>
    qb.select("name", "email").table("users").where("status", "inactive"),
  );
```

With a target column list the SELECT columns map by name. Without one they map positionally, so the source has to list every destination column in table order.

`insertFrom` returns the same conflict-aware operation as `insert`, so `onConflict(...).merge()` and `.ignore()` chain onto it:

```typescript
await sql
  .from("archived_users")
  .insertFrom(["name", "email"], (qb) =>
    qb.select("name", "email").table("users"),
  )
  .onConflict("email")
  .ignore();
```

:::warning
Rows come from the database, so no validation, hooks, or `autoCreate` columns run on the inserted records.
:::

## Batch inserts

`batchInsert` splits a large row list into chunks and sends one `insertMany` per chunk, which keeps a statement under the driver's parameter ceiling:

```typescript
const inserted = await sql.from("users").batchInsert(rows, { chunkSize: 250 });
const ids = await sql
  .from("users")
  .batchInsert(rows, { chunkSize: 250, returning: ["id"] });
```

Without `returning` the call resolves to the number of rows inserted. The default chunk size is 500. A `chunkSize` that is not a positive integer throws `INVALID_BATCH_SIZE`. The chunks are separate statements, so wrap the call in `sql.transaction(...)` when the batch has to be all-or-nothing.

## Multi-table writes

MySQL and MariaDB accept joins on `update` and `delete`. Chain the joins before the write call:

```typescript
await sql
  .from("users")
  .innerJoin("orders", "orders.userId", "users.id")
  .where("orders.total", ">", 10)
  .update({ name: "John" });

await sql
  .from("users")
  .innerJoin("orders", "orders.userId", "users.id")
  .where("orders.total", ">", 10)
  .delete();
```

Both statements touch the rows the join matches. `orderBy` and `limit` still work alongside, so a multi-table delete can be bounded. Every other dialect throws `JOIN_NOT_SUPPORTED_ON_WRITE`.

## Updating and deleting against another table

PostgreSQL and CockroachDB read from a second table on `update` and `delete`. MSSQL supports the `update` form only.

```typescript
await sql
  .from("users")
  .updateFrom("orders")
  .where("orders.userId", "users.id")
  .update({ name: "John" });

await sql
  .from("users")
  .deleteUsing("orders")
  .where("orders.userId", "users.id")
  .where("orders.total", ">", 10)
  .delete();
```

Both take a callback and an alias instead of a table name, which renders a derived table:

```typescript
await sql
  .from("users")
  .deleteUsing((qb) => qb.select("userId").table("orders").where("total", ">", 10), "o")
  .where("o.userId", "users.id")
  .delete();
// delete from "users" using (select "userId" from "orders" where "total" > $1) as o where "o"."userId" = "users"."id"
```

The alias is required for the callback form and an empty one throws `MISSING_ALIAS_FOR_SUBQUERY`. MySQL, MariaDB, and SQLite throw `UPDATE_FROM_NOT_SUPPORTED` on `updateFrom`; they and MSSQL throw `DELETE_USING_NOT_SUPPORTED` on `deleteUsing`.

## Conflict targets

`onConflict` takes a column, a column list, a raw predicate, or a named constraint. The raw form is passed through untouched, which is what a partial index or an expression index needs:

```typescript
await sql
  .from("users")
  .insert({ email: "john@doe.com", name: "John" })
  .onConflict(sql.rawStatement("(lower(email)) where deleted_at is null"))
  .merge(["name"]);
// ... on conflict (lower(email)) where deleted_at is null do update set "name" = excluded."name"
```

```typescript
await sql
  .from("users")
  .insert({ email: "john@doe.com", name: "John" })
  .onConflict({ constraint: "users_email_key" })
  .merge(["name"]);
// ... on conflict on constraint "users_email_key" do update set "name" = excluded."name"
```

The raw form works on PostgreSQL, CockroachDB, and SQLite. The named constraint is PostgreSQL and CockroachDB only, because that is the pair that spells `ON CONSTRAINT`. MySQL, MariaDB, and MSSQL throw `NOT_SUPPORTED_IN_*` for either form, and SQLite throws it for the named constraint.

`merge` also takes a `where` callback, which guards the update so the row is left alone when the predicate fails. This is what keeps a counter or a timestamp from being overwritten by a stale value:

```typescript
await sql
  .from("users")
  .insert({ email: "john@doe.com", name: "John" })
  .onConflict("email")
  .merge({ where: (qb) => qb.where("name", "<>", "John") });
// ... on conflict ("email") do update set "name" = excluded."name" where "name" <> $3
```

PostgreSQL, CockroachDB, and SQLite support it. MySQL's `ON DUPLICATE KEY UPDATE` has nowhere to put a predicate, and MSSQL routes through `MERGE`, so both throw `MERGE_WHERE_NOT_SUPPORTED`.

A bare `merge()` updates every inserted column except the conflict target. If that leaves nothing, as it does when the conflict target is the only column you inserted, the clause would render empty, so the call throws `MERGE_REQUIRES_COLUMNS`. `ignore()` is the way to leave the existing row alone.

## Updating a single column

`update` takes a column and a value as an alternative to the object form. The rendered statement is the same:

```typescript
await sql.from("users").where("id", 1).update("name", "John");
```

The value may be a `RawNode`, so a column can be set from another column:

```typescript
await sql
  .from("users")
  .where("id", 1)
  .update("name", new RawNode('"users"."email"'));
```

## Truncating a table

`truncate` empties a table and fires no hooks. PostgreSQL and CockroachDB accept the options below; every other dialect throws `TRUNCATE_OPTION_NOT_SUPPORTED` when one is set.

| Option                        | Clause              |
| ----------------------------- | ------------------- |
| `{ restartIdentity: true }`   | `RESTART IDENTITY`  |
| `{ continueIdentity: true }`  | `CONTINUE IDENTITY` |
| `{ cascade: true }`           | `CASCADE`           |

CockroachDB carries `CASCADE` but not the two identity options. SQLite has no `TRUNCATE` and runs an unqualified `DELETE FROM` instead. PostgreSQL and MySQL also refuse to truncate a table that another table references: PostgreSQL accepts `CASCADE`, MySQL needs the foreign keys dropped first.

```typescript
await sql.from("sessions").truncate();
await sql.from("sessions").truncate({ cascade: true });
```

## Empty inserts

`insert({})` renders a statement that creates a row of defaults:

| Dialect                  | SQL                                    |
| ------------------------ | -------------------------------------- |
| PostgreSQL, SQLite, MSSQL | `insert into "users" default values`  |
| MySQL, MariaDB            | ``insert into `users` () values ()``  |

## Clauses a write rejects

A write carries only the clauses it can express. Anything else throws when the builder method is called, so the failure points at the call site rather than at the database.

| Clause                                                                        | Result                                                    |
| ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| `select`, `distinct`, `distinctOn`, `groupBy`, `having`, set operations, locks, comments, hints | `SELECT_ONLY_CLAUSE_ON_WRITE`       |
| joins                                                                        | kept on MySQL and MariaDB; `JOIN_NOT_SUPPORTED_ON_WRITE` elsewhere |
| `offset`                                                                      | `ORDER_BY_LIMIT_NOT_SUPPORTED_ON_WRITE`                    |
| `orderBy` / `limit`                                                           | kept on MySQL and MariaDB; `ORDER_BY_LIMIT_NOT_SUPPORTED_ON_WRITE` elsewhere |
| `update({})`                                                                  | `UPDATE_REQUIRES_COLUMNS`                                  |

```typescript
// MySQL and MariaDB render delete from users limit ?; every other dialect throws
sql.from("users").limit(5).delete();
```

## See also

- [Reading & writing data](/databases/sql/standard-methods/basics)
- [Building Queries](/databases/sql/query-builder/queries)
- [Query Builder Overview](/databases/sql/query-builder/overview)
