---
title: Write Statements
description: "The shape of SQL write statements in Hysteria ORM: CTEs on writes, insertFrom, truncate options, and the clauses a write rejects."
keywords:
  [
    hysteria-orm,
    insertFrom,
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
| joins                                                                         | `JOIN_NOT_SUPPORTED_ON_WRITE`                              |
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
