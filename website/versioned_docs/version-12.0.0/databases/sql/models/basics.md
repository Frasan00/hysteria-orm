---
title: Defining SQL Models
description: "Define SQL models in Hysteria ORM using defineModel with columns, indexes, and hooks."
keywords:
  [hysteria-orm, SQL models, model definition, defineModel, table mapping]
sidebar_position: 1
---

# Defining SQL Models

Models represent tables in your database. Define them using the `defineModel` function with the `col` and `rel` namespaces. For the full API reference including nullable-aware types, date/time `.string()` helpers, and typed `serialize`/`prepare` on supported columns, see [Programmatic Models (defineModel)](./define-model.md).

## Example: User Model

```typescript
import { defineModel, col } from "hysteria-orm";

const Post = defineModel("posts", {
  columns: {
    id: col.increment(),
    title: col.string(),
    body: col.text(),
    userId: col.integer(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
  },
});

const Address = defineModel("addresses", {
  columns: {
    id: col.increment(),
    street: col.string(),
    city: col.string(),
  },
});

const UserAddress = defineModel("user_addresses", {
  columns: {
    id: col.increment(),
    userId: col.integer(),
    addressId: col.integer(),
  },
});

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string({ nullable: false }),
    password: col.string(),
    status: col.enum(["active", "inactive"] as const),
    isActive: col.boolean(),
    balance: col.decimal({ precision: 10, scale: 2 }),
    metadata: col.json(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
  },
});
```

Relations are defined in a separate schema file — see [Relations](#relations) below.

---

## Column Types

All column types are available via the `col` namespace. Each returns a `ColumnDef` with full TypeScript inference.

| Method                            | Base Type                            | Description                                                                |
| --------------------------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| `col()`                           | _any_ (user-defined via generic)     | Generic column. Accepts options like `primaryKey`, `databaseName`, etc.          |
| `col.primary()`                   | `string \| number`                   | Generic primary key column.                                                |
| `col.increment()`                 | `number`                             | Auto-incrementing integer primary key (always non-nullable).               |
| `col.bigIncrement()`              | `number`                             | Auto-incrementing bigint primary key (always non-nullable).                |
| `col.integer()`                   | `number`                             | Integer column.                                                            |
| `col.bigInteger()`                | `number`                             | Big integer column. Handles Postgres string-to-Number conversion.          |
| `col.float()`                     | `number`                             | Float column.                                                              |
| `col.decimal()`                   | `number`                             | Decimal column with optional `precision` and `scale`.                      |
| `col.string()`                    | `string`                             | VARCHAR column with optional `length`.                                     |
| `col.text()`                      | `string`                             | LONGTEXT column for longer text content.                                   |
| `col.boolean()`                   | `boolean`                            | Boolean column, handles DB-specific formats (e.g., MySQL tinyint).         |
| `col.json()`                      | `unknown` (customizable via generic) | JSON/JSONB column.                                                         |
| `col.date()`                      | `Date`                               | DATE column (YYYY-MM-DD).                                                  |
| `col.date.string()`               | `string`                             | DATE column that stays typed as `string`.                                  |
| `col.datetime()`                  | `Date`                               | DATETIME column (YYYY-MM-DD HH:mm:ss), with auto-creation and auto-update. |
| `col.datetime.string()`           | `string`                             | DATETIME column that stays typed as `string`.                              |
| `col.timestamp()`                 | `Date`                               | Unix timestamp column, with auto-creation and auto-update.                 |
| `col.timestamp.string()`          | `string`                             | Unix timestamp column that stays typed as `string`.                        |
| `col.time()`                      | `Date`                               | TIME column (HH:mm:ss), with auto-creation and auto-update.                |
| `col.time.string()`               | `string`                             | TIME column that stays typed as `string`.                                  |
| `col.uuid()`                      | `string`                             | Auto-generates a UUID if not provided.                                     |
| `col.ulid()`                      | `string`                             | Auto-generates a ULID if not provided.                                     |
| `col.binary()`                    | `Buffer \| Uint8Array \| string`     | Binary/blob column.                                                        |
| `col.enum(values)`                | `values[number]`                     | Enum column constrained to the provided values array.                      |
| `col.encryption.symmetric(opts)`  | `string`                             | Encrypts/decrypts value using a symmetric key.                             |
| `col.encryption.asymmetric(opts)` | `string`                             | Encrypts/decrypts value using asymmetric keys.                             |

### Nullable-Aware Type Inference

- **Primary key columns** (`col.increment()`, `col.bigIncrement()`, `col.primary()`, `col.uuid({ primaryKey: true })`) are **non-nullable**.
- **Non-PK columns** are **nullable by default** — the type includes `| null | undefined`. Use `{ nullable: false }` to make them required.

```typescript
const Product = defineModel("products", {
  columns: {
    id: col.increment(), // number (non-nullable)
    name: col.string({ nullable: false }), // string (required)
    description: col.string(), // string | null | undefined
    price: col.decimal({ precision: 10, scale: 2, nullable: false }), // number (required)
    status: col.enum(["draft", "published"] as const), // "draft" | "published" | null | undefined
  },
});
```

### Date/Time Column Types

Choose the appropriate date/time column type based on your database column:

| Method            | Database Column Type     | Format                            | Use Case                                | Migration Example               |
| ----------------- | ------------------------ | --------------------------------- | --------------------------------------- | ------------------------------- |
| `col.date()`      | `DATE`                   | YYYY-MM-DD                        | Birth dates, event dates (no time)      | `table.date('birth_date')`      |
| `col.datetime()`  | `DATETIME`, `DATETIME2`  | YYYY-MM-DD HH:mm:ss               | Created/updated timestamps              | `table.timestamp('created_at')` |
| `col.timestamp()` | `TIMESTAMP` (as integer) | Unix timestamp (e.g., 1766152251) | High-performance timestamps as integers | `table.integer('last_login')`   |
| `col.time()`      | `TIME`                   | HH:mm:ss                          | Start/end times, durations (no date)    | `table.time('start_time')`      |

**Important Notes:**

- When using `table.timestamp()` in migrations, it creates `DATETIME`/`DATETIME2` columns (not Unix timestamp integers). Use `col.datetime()` for these columns.
- For actual Unix timestamp integers, define the column as `table.integer()` or `table.bigint()` and use `col.timestamp()` in your model.
- Date/time helpers default to `Date`. Use `col.date.string()`, `col.datetime.string()`, `col.timestamp.string()`, or `col.time.string()` when you want string values instead.
- In `.string()` mode, user-supplied strings are written as-is and driver values are normalized back to strings.
- `autoCreate` and `autoUpdate` accept either `true` or a callback. Callback return type must match the helper mode: `Date` for the default helpers, `string` for the `.string()` variants.
- When auto-generated migrations use `autoUpdate: true`, MySQL/MariaDB use the native `ON UPDATE CURRENT_TIMESTAMP`; on other databases, migrations automatically generate an update trigger (trigger name: `trg_{table}_{column}_auto_update`).
- Date/time helpers handle `serialize` / `prepare` internally, so those options are not available there.
- All date/time column types support the `timezone` option (`'UTC'` or `'LOCAL'`) and `withTimezone`.

```typescript
const Event = defineModel("events", {
  columns: {
    id: col.increment(),
    birthDate: col.date(), // Date | null | undefined
    createdAt: col.datetime({ autoCreate: true }), // Date | null | undefined
    importedAt: col.datetime.string({
      autoCreate: () => "2030-01-01 00:00:00",
    }), // string | null | undefined
    lastModified: col.timestamp({ autoCreate: true, autoUpdate: true }), // Date | null | undefined
    businessHoursStart: col.time.string(), // string | null | undefined
  },
});
```

### Column Options

Different `col` helpers expose different options:

| Option         | Type                                | Default                        | Description                                                                                  |
| -------------- | ----------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| `primaryKey`   | boolean                             | false                          | Marks this column as the primary key. Only one primary key is allowed per model.             |
| `serialize`    | function                            | undefined                      | Custom read transform on helpers that expose it. Date/time helpers handle this internally.   |
| `prepare`      | function                            | undefined                      | Custom write transform on helpers that expose it. Date/time helpers handle this internally.  |
| `autoCreate`   | boolean \| (() => Date) \| (() => string) | false                    | Date/time helpers only. Use `true` for the built-in current time behavior or a typed callback. |
| `autoUpdate`   | boolean \| (() => Date) \| (() => string) | false                    | Date/time helpers accept `true` or a typed callback. On other helpers, the boolean form forces `prepare` on updates. |
| `databaseName` | string                              | property name (case-converted) | Custom name for the column in the database.                                                  |
| `nullable`     | boolean                             | true (false for PK columns)    | If false, the column cannot be null.                                                         |
| `default`      | string \| number \| null \| boolean | undefined                      | The default value for the column in the database.                                            |

```typescript
const User = defineModel("users", {
  columns: {
    id: col.integer({
      primaryKey: true,
      databaseName: "user_id",
    }),
    name: col.string({
      prepare: (value) => value.trim(),
      serialize: (value) => value.toUpperCase(),
    }),
    createdAt: col.datetime({ autoCreate: true, autoUpdate: true }),
    importedAt: col.datetime.string({
      autoCreate: () => "2030-01-01 00:00:00",
    }),
    status: col.string({ default: "active" }),
  },
});
```

**Notes:**

- `primaryKey`: Composite primary keys are not supported. Defining more than one will throw an error.
- `prepare`/`serialize`: Use them for custom transformations on helpers that expose those callbacks. Date/time helpers and their `.string()` variants do not accept custom `prepare` / `serialize`.
- `autoCreate`/`autoUpdate`: On date/time helpers, pass `true` to use the built-in current value behavior or pass a callback that returns `Date` / `string`, matching the selected mode.
- `databaseName`: Use if your DB column name differs from your property name or case convention.

---

## Relations

Relations are **not** defined inside `defineModel`. Use `defineRelations` + `createSchema` in a dedicated schema file instead. This approach works for all project sizes and eliminates circular import issues entirely.

See [Defining Relations](./define-model.md#defining-relations-definerelations--createschema) for the full API and step-by-step example.

| Helper       | Description                 | Foreign Key Location    |
| ------------ | --------------------------- | ----------------------- |
| `hasOne`     | One-to-one relationship     | On the related model    |
| `hasMany`    | One-to-many relationship    | On the related model    |
| `belongsTo`  | Inverse of hasOne/hasMany   | On the current model    |
| `manyToMany` | Many-to-many via join table | On the join/pivot table |

```typescript
import { createSchema, defineRelations } from "hysteria-orm";
import { User } from "./user";
import { Post } from "./post";

const UserRelations = defineRelations(User, ({ hasMany }) => ({
  posts: hasMany(Post, { foreignKey: "userId" }),
}));

const PostRelations = defineRelations(Post, ({ belongsTo }) => ({
  user: belongsTo(User, { foreignKey: "userId" }),
}));

export const schema = createSchema(
  { users: User, posts: Post },
  { users: UserRelations, posts: PostRelations },
);

export const UserModel = schema.users;
export const PostModel = schema.posts;
```

---

## Table Constraints

Pass `indexes`, `uniques`, and `checks` arrays to `defineModel`. Column references are type-checked against your `columns` definition.

```typescript
const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string({ nullable: false }),
    age: col.integer(),
    status: col.string(),
  },
  indexes: [
    ["email"], // simple array form
    { columns: ["name", "email"], name: "idx_name_email" }, // object form with custom name
  ],
  uniques: [["email"], { columns: ["email"], name: "uq_users_email" }],
  checks: [
    "age >= 18", // string form
    {
      expression: "status IN ('active', 'inactive', 'banned')",
      name: "chk_status",
    }, // object form
  ],
});
```

:::tip Constraint names
Always provide explicit constraint names for production models. Auto-generated names are deterministic but less readable. Explicit names make migration history and database debugging easier.
:::

---

## Model Options

Customize model behavior via the `options` key in `defineModel`:

| Option                   | Description                           | Default       |
| ------------------------ | ------------------------------------- | ------------- |
| `softDeleteColumn`       | Column name used for soft deletes.    | `"deletedAt"` |
| `modelCaseConvention`    | Case convention for model properties. | Auto-detected |
| `databaseCaseConvention` | Case convention for database columns. | Auto-detected |

See [Case Conventions](./case-conventions.md) for detailed information on case conversion.

---
