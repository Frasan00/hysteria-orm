---
title: Reading & Writing Data
description: "Read and write SQL data in Hysteria ORM: find, insert, upsert, update, delete, soft delete, and lazy builder write operations."
keywords: [hysteria-orm, find, insert, upsert, update, delete, softDelete]
---

# Reading & writing data

All reads and writes go through `sql.from(Model)`, so only model columns are accepted in `select`, `where`, and `returning`. Reads resolve through `find*` methods; writes resolve through `insert*`, `upsert*`, `save`, `updateRecord`, `deleteRecord`, and `softDelete*`.

## Setup

```typescript
import { SqlDataSource, defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string({ nullable: false }),
    status: col.string().default("active"),
    deletedAt: col.datetime(),
  },
});

const sql = new SqlDataSource({ type: "sqlite", database: "app.db" });
await sql.connect();
```

## Reading

### `find`

Returns every record matching the criteria. Options: `select`, `where`, `orderBy`, `groupBy`, `limit`, `offset`, and `relations` (eager loads; see [Relations](/databases/sql/relations/overview)).

```typescript
const users = await sql.from(User).find({ where: { status: "active" } });

const names = await sql.from(User).find({
  select: ["name", "email"],
  orderBy: { name: "asc" },
  limit: 20,
}); // { name: string; email: string }[]
```

### `findOne`

Returns a single record, or `null`:

```typescript
const user = await sql
  .from(User)
  .findOne({ where: { email: "john@example.com" } });
```

### `findOneOrFail`

Returns a single record, or throws if none matches:

```typescript
const user = await sql
  .from(User)
  .findOneOrFail({ where: { email: "john@example.com" } });
```

### `findOneByPrimaryKey`

Looks a record up by primary key without building a `where` clause:

```typescript
const user = await sql.from(User).findOneByPrimaryKey(1);
```

## Writing

Writes return `void` by default. Pass a `returning` option to get columns back.

### `insert`

```typescript
await sql.from(User).insert({ name: "John", email: "john@example.com" }); // void

const user = await sql
  .from(User)
  .insert(
    { name: "John", email: "john@example.com" },
    { returning: ["name", "email"] },
  ); // { name: string; email: string }
```

### `insertMany`

```typescript
await sql.from(User).insertMany([
  { name: "John", email: "john@example.com" },
  { name: "Jane", email: "jane@example.com" },
]);

const users = await sql.from(User).insertMany(
  [
    { name: "John", email: "john@example.com" },
    { name: "Jane", email: "jane@example.com" },
  ],
  { returning: ["*"] },
); // User[]
```

:::note Cross-database `returning` support
The `returning` option works on every supported database. PostgreSQL, CockroachDB, SQLite, and MariaDB use the native `RETURNING` clause and MSSQL uses `OUTPUT`. On MySQL, Hysteria ORM runs a follow-up `SELECT` to fetch the requested columns after the write.
:::

### `upsert`

Inserts, or updates the matching record on conflict. Updates on conflict by default; pass `updateOnConflict: false` to leave an existing record untouched.

```typescript
await sql.from(User).upsert(
  { email: "john@example.com" }, // search criteria
  { name: "John", email: "john@example.com", status: "active" }, // data
);

const user = await sql
  .from(User)
  .upsert(
    { email: "john@example.com" },
    { name: "John", email: "john@example.com", status: "active" },
    { returning: ["*"] },
  );
```

### `upsertMany`

```typescript
const users = await sql.from(User).upsertMany(
  ["email"], // conflict columns
  [
    { name: "John", email: "john@example.com" },
    { name: "Jane", email: "jane@example.com" },
  ],
  { returning: ["*"] },
);
```

### `onConflict`

`insert` and `insertMany` take a fluent conflict modifier too, with the same shape Knex uses. Point `onConflict` at the unique column or columns, then pick an action.

```typescript
// Update every inserted column except the conflict target
await sql
  .from(User)
  .insert({ email: "john@example.com", name: "John" })
  .onConflict("email")
  .merge();

// Update only the listed columns
await sql
  .from(User)
  .insert({ email: "john@example.com", name: "John" })
  .onConflict("email")
  .merge(["name"]);

// Leave an existing row alone
await sql
  .from(User)
  .insert({ email: "john@example.com", name: "John" })
  .onConflict("email")
  .ignore();
```

The conflict target accepts one column, an array of columns, a `table.column` key, a raw predicate, or a named constraint. The table qualifier on a column key is stripped before it reaches SQL, while a raw predicate is passed through untouched. On `insertMany`, a bare `merge()` derives its column list from the first row. It works the same on the raw builder:

```typescript
await sql
  .from("users")
  .insert({ email: "john@example.com", name: "John" })
  .onConflict("email")
  .merge();
```

The two halves are required together:

| Call | Result |
| --- | --- |
| `.merge()` or `.ignore()` with no `onConflict` | throws `MERGE_REQUIRES_ON_CONFLICT` |
| `.onConflict(...)` with no action, when the operation runs | throws `ON_CONFLICT_REQUIRES_MERGE_OR_IGNORE` |
| `.onConflict([])` | throws `ON_CONFLICT_COLUMNS_REQUIRED` |
| `.merge()` with no column left to update | throws `MERGE_REQUIRES_COLUMNS` |

The last one fires when the only column you inserted is the conflict target, since `merge()` updates every inserted column except that one, which leaves the `SET` list empty. Use `ignore()` there, or list the columns to update yourself.

Call `onConflict()` with no target when you only need `DO NOTHING` and do not want to name the unique constraint:

```typescript
// Leave any conflicting row alone
await sql
  .from(User)
  .insert({ email: "john@example.com", name: "John" })
  .onConflict()
  .ignore();
```

PostgreSQL, CockroachDB, and SQLite render `ON CONFLICT DO NOTHING`; MySQL and MariaDB turn the statement into `INSERT IGNORE`; MSSQL has no equivalent and throws `NOT_SUPPORTED_IN_MSSQL`. A target-less `merge()` still throws `MERGE_REQUIRES_ON_CONFLICT`, since updating on conflict needs to know which row conflicts.

[Write Statements](/databases/sql/query-builder/write-statements) covers the raw and named-constraint targets, `merge({ where })`, and which dialect accepts which.

`upsert` and `upsertMany` cover the same ground with a fixed shape: the conflict target and the update columns are decided up front rather than at the call site.

### `insertFrom`

Copies the rows a SELECT produces into the table. See [Write Statements](/databases/sql/query-builder/write-statements) for the positional and column-list forms.

```typescript
await sql
  .from(User)
  .insertFrom(["name", "email"], (qb) =>
    qb.select("name", "email").table("users_import"),
  );
```

### Raw values

Any value in `insert`, `insertMany`, or `update` can be a raw SQL expression instead of a literal, so the database computes it:

```typescript
await sql
  .from(User)
  .insert({ email: "john@example.com", name: sql.rawStatement("trim(' John ')") });

await sql
  .from(User)
  .where("id", 1)
  .update({ name: sql.rawStatement("upper(name)") });
```

The expression is rendered verbatim, so never build one from user input. JSON columns also accept the mutation helpers `sql.jsonSet`, `sql.jsonInsert`, and `sql.jsonRemove`, which are typed to JSON columns only.

### `updateRecord`

Updates one record by primary key.

```typescript
await sql.from(User).updateRecord(user.id, { name: "Johnny" }); // void

const updated = await sql
  .from(User)
  .updateRecord(user.id, { name: "Johnny" }, { returning: ["name", "email"] });
```

### `deleteRecord`

Deletes one record by primary key.

```typescript
await sql.from(User).deleteRecord(user.id);
```

### `save`

Inserts when the primary key is absent, or updates the existing record when it is present.

```typescript
await sql.from(User).save({ name: "John", email: "john@example.com" }); // insert
await sql.from(User).save({ id: 1, name: "Johnny" }); // update

const user = await sql
  .from(User)
  .save({ name: "John", email: "john@example.com" }, { returning: ["*"] });
```

### `softDeleteRecord`

Sets a timestamp column instead of deleting the row. Defaults to the model's `softDeleteColumn` / `softDeleteValue`.

```typescript
await sql.from(User).softDeleteRecord(user.id);

await sql.from(User).softDeleteRecord(user.id, {
  column: "deletedAt",
  value: new Date(),
});

const deleted = await sql.from(User).softDeleteRecord(user.id, undefined, {
  returning: ["*"],
});
```

### `firstOrInsert`

Returns the first matching record, creating it when none exists. Always returns the full record.

```typescript
const user = await sql.from(User).firstOrInsert(
  { email: "john@example.com" }, // search criteria
  { name: "John", email: "john@example.com", status: "active" }, // insert data
);
```

### `refresh`

Reloads a record by primary key from the database:

```typescript
const user = await sql.from(User).refresh(1); // User | null
```

### `truncate`

Empties the table and fires no hooks. PostgreSQL and CockroachDB accept `restartIdentity`, `continueIdentity`, and `cascade`; every other dialect throws when one is set. See [Write Statements](/databases/sql/query-builder/write-statements) for the option table.

```typescript
await sql.from(User).truncate();
```

## Builder write operations

Where-based writes return a `WriteOperation`, a lazy promise-like object. Building the query does not hit the database; it runs only when you await it.

```typescript
// Update every matching row
await sql.from(User).where("status", "inactive").update({ status: "archived" });

// Update and return columns
const updated = await sql
  .from(User)
  .where("id", 1)
  .update({ name: "John" }, { returning: ["id", "name"] });

// Delete every matching row
const affected = await sql.from(User).where("status", "inactive").delete();

// Delete and return columns
const removed = await sql
  .from(User)
  .where("id", 1)
  .delete({ returning: ["id", "name"] });

// Soft delete every matching row
await sql.from(User).where("status", "inactive").softDelete();
```

Because writes are lazy, you can inspect the SQL before executing:

```typescript
const op = sql.from(User).where("status", "inactive").delete();

op.toQuery(); // SQL with values bound to the statement
op.toSql(); // { sql, bindings }
await op; // executes and returns the number of affected rows
```

## Filtering

`where` accepts plain (`"name"`) and table-prefixed (`"users.name"`) keys, plus comparison operators:

```typescript
const users = await sql.from(User).find({
  where: {
    status: "active", // equality
    id: { op: "$gte", value: 10 },
    $or: [
      { name: { op: "$like", value: "John%" } },
      { email: { op: "$like", value: "%@example.com" } },
    ],
  },
});
```

| Operator       | Description               | Example Value                             |
| -------------- | ------------------------- | ----------------------------------------- |
| `$eq`          | Equal to                  | `{ op: "$eq", value: "active" }`          |
| `$ne`          | Not equal to              | `{ op: "$ne", value: "deleted" }`         |
| `$gt`          | Greater than              | `{ op: "$gt", value: 18 }`                |
| `$gte`         | Greater than or equal     | `{ op: "$gte", value: 0 }`                |
| `$lt`          | Less than                 | `{ op: "$lt", value: 100 }`               |
| `$lte`         | Less than or equal        | `{ op: "$lte", value: 999 }`              |
| `$between`     | Between two values        | `{ op: "$between", value: [10, 20] }`     |
| `$not between` | Not between two values    | `{ op: "$not between", value: [10, 20] }` |
| `$is null`     | Is NULL                   | `{ op: "$is null" }`                      |
| `$is not null` | Is not NULL               | `{ op: "$is not null" }`                  |
| `$like`        | LIKE pattern              | `{ op: "$like", value: "%test%" }`        |
| `$not like`    | NOT LIKE pattern          | `{ op: "$not like", value: "%spam%" }`    |
| `$ilike`       | Case-insensitive LIKE     | `{ op: "$ilike", value: "%John%" }`       |
| `$not ilike`   | Case-insensitive NOT LIKE | `{ op: "$not ilike", value: "%test%" }`   |
| `$in`          | In array                  | `{ op: "$in", value: [1, 2, 3] }`         |
| `$nin`         | Not in array              | `{ op: "$nin", value: [4, 5, 6] }`        |
| `$regexp`      | Regular expression match  | `{ op: "$regexp", value: /pattern/ }`     |
| `$not regexp`  | Not matching regex        | `{ op: "$not regexp", value: /pattern/ }` |

Combine conditions with `$and` and `$or`, including nested combinations. See [Query Builder](/databases/sql/query-builder/queries) for the full filtering API.

## See also

- [Relations](/databases/sql/relations/overview)
- [Query Builder](/databases/sql/query-builder/queries)
- [Transactions](/databases/sql/advanced/transactions)
- [Models as DTOs](/databases/sql/models/instance-methods)
