---
title: CRUD Operations
description: "Standard CRUD methods for SQL models: find, insert, update, delete with type-safe queries in Hysteria ORM."
keywords: [hysteria-orm, CRUD, find, insert, update, delete, standard methods]
sidebar_position: 4
---

# CRUD Operations

Hysteria ORM provides fully type-safe CRUD methods through `sql.from(Model)`. Only model columns are allowed in `select`, `where`, and `returning` options.

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
    role: col.string().nullable(),
    isActive: col.boolean().default(true),
    isPremium: col.boolean().default(false),
    isVerified: col.boolean().default(false),
    salary: col.integer().nullable(),
    balance: col.integer().nullable(),
    deletedAt: col.datetime().nullable(),
  },
});

const sql = new SqlDataSource({ type: "sqlite", database: "app.db" });
await sql.connect();
```

## CRUD Methods

### `find`

Fetch multiple records matching criteria. Where keys accept both plain (`"name"`) and table-prefixed (`"users.name"`) forms.

```typescript
const users = await sql.from(User).find({ where: { status: "active" } });

const usersWithNameAndEmail = await sql.from(User).find({
  select: ["name", "email"],
}); // { name: string; email: string }[]
```

### `findOne`

Fetch a single record matching criteria.

```typescript
const user = await sql
  .from(User)
  .findOne({ where: { email: "john@example.com" } });

const userWithNameAndEmail = await sql.from(User).findOne({
  select: ["name", "email"],
}); // { name: string; email: string } | null
```

### `findOneOrFail`

Fetch a single record or throw if not found.

```typescript
const user = await sql
  .from(User)
  .findOneOrFail({ where: { email: "john@example.com" } });
```

### `insert`

Insert a new record. Returns `void` by default. Use the `returning` option to specify which columns to return.
Returning works with all databases, for `mysql` and other databases that do not support the `RETURNING` clause, Hysteria ORM performs a follow-up `SELECT` to fetch the requested columns after the insert operation.

```typescript
// Fire-and-forget (returns void)
await sql.from(User).insert({ name: "John", email: "john@example.com" });

// Return specific columns (type-safe)
const user = await sql
  .from(User)
  .insert(
    { name: "John", email: "john@example.com" },
    { returning: ["name", "email"] },
  ); // { name: string; email: string }

// Return full model
const fullUser = await sql
  .from(User)
  .insert({ name: "John", email: "john@example.com" }, { returning: ["*"] }); // User (full model)
```

### `insertMany`

Insert multiple records. Same `returning` behavior as `insert`.

```typescript
// Fire-and-forget (returns void)
await sql.from(User).insertMany([
  { name: "John", email: "john@example.com" },
  { name: "Jane", email: "jane@example.com" },
]);

// Return full models
const users = await sql.from(User).insertMany(
  [
    { name: "John", email: "john@example.com" },
    { name: "Jane", email: "jane@example.com" },
  ],
  { returning: ["*"] },
);
```

:::info Cross-Database `returning` Support
The `returning` option works across all supported databases. PostgreSQL and CockroachDB use the native `RETURNING` clause. For MySQL, MariaDB, SQLite, and Oracle, Hysteria ORM automatically performs a follow-up `SELECT` query to fetch the requested columns after the write operation.
:::

### `updateRecord`

Update a record by primary key. Returns `void` by default. Use the `returning` option to specify which columns to return.

```typescript
// Fire-and-forget (returns void)
await sql.from(User).updateRecord(user.id, { name: "Johnny" });

// Return full model
const updated = await sql.from(User).updateRecord(
  user.id,
  { name: "Johnny" },
  {
    returning: ["*"],
  },
); // User (full model)

// Return specific columns (type-safe)
const partial = await sql.from(User).updateRecord(
  user.id,
  { name: "Johnny" },
  {
    returning: ["name", "email"],
  },
); // { name: string; email: string }
```

### `save`

Insert or update model data. If the primary key is present, performs an update; otherwise performs an insert. Returns `void` by default.

```typescript
// Fire-and-forget (returns void)
await sql.from(User).save({ name: "John", email: "john@example.com" });

// Update existing record (PK present)
await sql.from(User).save({ id: 1, name: "Johnny" });

// Return full model
const user = await sql
  .from(User)
  .save({ name: "John", email: "john@example.com" }, { returning: ["*"] }); // User (full model)
```

### `softDelete`

Soft delete a record by primary key (sets a timestamp column instead of actually deleting). Returns `void` by default.

```typescript
// Fire-and-forget (returns void)
await sql.from(User).softDelete(user.id);

// With custom column/value
await sql.from(User).softDelete(user.id, {
  column: "deletedAt",
  value: new Date(),
});

// Return the soft-deleted record
const deleted = await sql.from(User).softDelete(user.id, undefined, {
  returning: ["*"],
}); // User (full model)
```

### `deleteRecord`

Delete a record by primary key.

```typescript
await sql.from(User).deleteRecord(user.id);
```

### `firstOrInsert`

Find a record or create it if it doesn't exist.
Always returns the whole record.

```typescript
// First argument: search criteria
// Second argument: data to insert if not found
const user = await sql
  .from(User)
  .firstOrInsert(
    { email: "john@example.com" },
    { name: "John", email: "john@example.com", status: "active" },
  );
```

### `upsert`

Insert or update a record based on search criteria. Returns `void` by default. Use `returning` to get data back.

By default, if a matching record is found, it will be **updated** with the provided data (`updateOnConflict: true`). Set `updateOnConflict: false` to skip the update and leave the existing record unchanged.

```typescript
// Fire-and-forget (returns void, updates on conflict by default)
await sql.from(User).upsert(
  { email: "john@example.com" }, // search criteria
  { name: "John", email: "john@example.com", age: 30 }, // data
);

// Return full model
const user = await sql
  .from(User)
  .upsert(
    { email: "john@example.com" },
    { name: "John", email: "john@example.com", age: 30 },
    { returning: ["*"] },
  ); // User (full model)

// Return specific columns (type-safe)
const partial = await sql
  .from(User)
  .upsert(
    { email: "john@example.com" },
    { name: "John", email: "john@example.com", age: 30 },
    { returning: ["name", "email"] },
  ); // { name: string; email: string }

// Skip update if record exists (insert-only)
await sql
  .from(User)
  .upsert(
    { email: "john@example.com" },
    { name: "John", email: "john@example.com", age: 30 },
    { updateOnConflict: false },
  );

// QueryBuilder upsert
const [post] = await sql.from("posts").upsert(
  { id: uuid, title: "Title", content: "Content" }, // data
  { id: uuid }, // conflict keys
  { returning: ["id", "title"] }, // options
);
```

### `upsertMany`

Insert or update multiple records. Returns `void` by default. Use `returning` to get data back. Updates existing records on conflict by default; set `updateOnConflict: false` to ignore conflicts.

```typescript
// Fire-and-forget (returns void, updates on conflict by default)
await sql.from(User).upsertMany(
  ["email"], // conflict columns
  [
    { email: "john@example.com", name: "John" },
    { email: "jane@example.com", name: "Jane" },
  ],
);

// Return full models
const users = await sql.from(User).upsertMany(
  ["email"],
  [
    { email: "john@example.com", name: "John" },
    { email: "jane@example.com", name: "Jane" },
  ],
  { returning: ["*"] },
);

// Return specific columns (type-safe)
const partials = await sql.from(User).upsertMany(
  ["email"],
  [
    { email: "john@example.com", name: "John" },
    { email: "jane@example.com", name: "Jane" },
  ],
  { returning: ["name"] },
); // { name: string }[]

// QueryBuilder upsertMany
await sql.from("posts").upsertMany(
  ["id"], // conflict columns
  ["title", "content"], // columns to update on conflict
  [
    { id: uuid1, title: "First", content: "Content 1" },
    { id: uuid2, title: "Second", content: "Content 2" },
  ],
);
```

## Where Clause Operations

The `where` clause in `find`, `findOne`, and `findOneOrFail` supports a rich set of operators for filtering data. Where keys accept both plain (`"name"`) and table-prefixed (`"users.name"`) forms.

### Simple Equality

The simplest form is direct field-value matching:

```typescript
// Simple equality
const users = await sql.from(User).find({
  where: { email: "john@example.com" },
});

// Multiple fields (AND logic)
const users = await sql.from(User).find({
  where: { status: "active", role: "admin" },
});
```

### Comparison Operators

Use the `op` property to specify comparison operations:

```typescript
// Equal ($eq) - same as simple equality
const users = await sql.from(User).find({
  where: { age: { op: "$eq", value: 25 } },
});

// Not equal ($ne)
const users = await sql.from(User).find({
  where: { status: { op: "$ne", value: "inactive" } },
});

// Greater than ($gt)
const users = await sql.from(User).find({
  where: { age: { op: "$gt", value: 18 } },
});

// Greater than or equal ($gte)
const users = await sql.from(User).find({
  where: { salary: { op: "$gte", value: 50000 } },
});

// Less than ($lt)
const users = await sql.from(User).find({
  where: { age: { op: "$lt", value: 65 } },
});

// Less than or equal ($lte)
const users = await sql.from(User).find({
  where: { balance: { op: "$lte", value: 1000 } },
});
```

### Range Operators

```typescript
// Between
const users = await sql.from(User).find({
  where: { age: { op: "$between", value: [18, 30] } },
});

// Not between
const users = await sql.from(User).find({
  where: { age: { op: "$not between", value: [18, 30] } },
});
```

### Null Checks

```typescript
// Is null
const users = await sql.from(User).find({
  where: { deletedAt: { op: "$is null" } },
});

// Is not null
const users = await sql.from(User).find({
  where: { email: { op: "$is not null" } },
});
```

### Pattern Matching

```typescript
// LIKE
const users = await sql.from(User).find({
  where: { name: { op: "$like", value: "John%" } },
});

// NOT LIKE
const users = await sql.from(User).find({
  where: { email: { op: "$not like", value: "%spam%" } },
});

// ILIKE (case-insensitive, PostgreSQL)
const users = await sql.from(User).find({
  where: { name: { op: "$ilike", value: "%john%" } },
});

// NOT ILIKE
const users = await sql.from(User).find({
  where: { name: { op: "$not ilike", value: "%test%" } },
});
```

### Array Operators

```typescript
// IN - match any value in array
const users = await sql.from(User).find({
  where: { status: { op: "$in", value: ["active", "pending"] } },
});

// NOT IN - exclude values in array
const users = await sql.from(User).find({
  where: { role: { op: "$nin", value: ["banned", "suspended"] } },
});
```

### Regular Expression

```typescript
// REGEXP
const users = await sql.from(User).find({
  where: { email: { op: "$regexp", value: /^[a-z]+@example\.com$/ } },
});

// NOT REGEXP
const users = await sql.from(User).find({
  where: { name: { op: "$not regexp", value: /^test/i } },
});
```

### Logical Operators

#### `$and` - Combine conditions with AND

```typescript
const users = await sql.from(User).find({
  where: {
    $and: [{ status: "active" }, { age: { op: "$gte", value: 18 } }],
  },
});
```

#### `$or` - Combine conditions with OR

```typescript
const users = await sql.from(User).find({
  where: {
    $or: [{ role: "admin" }, { role: "moderator" }],
  },
});
```

### Complex Nested Conditions

You can nest `$and` and `$or` operators to create sophisticated queries:

```typescript
// Find users who are:
// (active AND age >= 18) OR (premium AND verified)
const users = await sql.from(User).find({
  where: {
    $or: [
      {
        $and: [{ status: "active" }, { age: { op: "$gte", value: 18 } }],
      },
      {
        $and: [{ isPremium: true }, { isVerified: true }],
      },
    ],
  },
});

// Combine top-level fields with $or
const users = await sql.from(User).find({
  where: {
    status: "active", // AND
    $or: [
      { name: { op: "$like", value: "John%" } },
      { name: { op: "$like", value: "Jane%" } },
    ],
  },
});

// Deeply nested conditions
const users = await sql.from(User).find({
  where: {
    $or: [
      {
        $and: [
          { status: "active" },
          { age: { op: "$between", value: [20, 30] } },
        ],
      },
      {
        $and: [
          { status: "inactive" },
          {
            $or: [
              { age: { op: "$gt", value: 50 } },
              { name: { op: "$like", value: "VIP%" } },
            ],
          },
        ],
      },
    ],
  },
});
```

### Operators Reference

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

## Best Practices

- Use `sql.from(Model)` for all CRUD operations — it provides full type safety.
- Use `findOneOrFail` for required lookups.
- Use `firstOrInsert` and `upsert` for idempotent operations.
- Prefer `$and` and `$or` for complex conditions to make your queries more readable.
- Use `$in` instead of multiple `$or` conditions when checking against a list of values.
- Where keys accept both `"name"` and `"users.name"` forms — use table-prefixed keys when joining tables.

---

Next: [Query Builder](../query-builder/basics.md)
