---
title: Programmatic Models (defineModel)
description: "Complete API reference for defineModel - programmatically define SQL models with columns, relations, indexes, hooks, and options in Hysteria ORM."
keywords:
  [hysteria-orm, defineModel, programmatic models, col namespace, model definition, SQL models]
sidebar_position: 2
---

# Programmatic Models (`defineModel`)

The `defineModel` function creates fully-typed Model subclasses programmatically without decorators. The returned class is a real `typeof Model` subclass that works with all existing infrastructure: `SqlDataSource`, `ModelManager`, `ModelQueryBuilder`, `SchemaDiff` (automatic migrations), hooks, and more.

## Quick Start

```typescript
import { defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string({ nullable: false }),
    isActive: col.boolean(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
  },
  indexes: [["email"]],
  uniques: [["email"]],
  hooks: {
    beforeFetch(qb) {
      qb.whereNull("users.deleted_at");
    },
  },
});

// Type-safe column references directly on the model
// User.id → "users.id", User.email → "users.email", etc.
sql.from(User)
  .select(User.id, [User.email, "userEmail"])
  .where(User.id, ">", 5)
  .orderBy(User.email, "asc");
```

## Column Descriptors (`col`)

All column types are available via the `col` namespace. Each returns a `ColumnDef` with full TypeScript inference.

| Method | Base Type | Description |
|--------|-----------|-------------|
| `col<T>()` | _any_ (user-defined via generic) | Generic column. Accepts options like `primaryKey`, `databaseName`, etc. |
| `col.primary()` | `string \| number` | Generic primary key column. |
| `col.increment()` | `number` | Auto-incrementing integer primary key (always non-nullable). |
| `col.bigIncrement()` | `number` | Auto-incrementing bigint primary key (always non-nullable). |
| `col.integer()` | `number` | Integer column. |
| `col.bigInteger()` | `number` | Big integer column. Handles Postgres string-to-Number conversion. |
| `col.float()` | `number` | Float column. |
| `col.decimal()` | `number` | Decimal column with optional `precision` and `scale`. |
| `col.string()` | `string` | VARCHAR column with optional `length`. |
| `col.text()` | `string` | LONGTEXT column for longer text content. |
| `col.boolean()` | `boolean` | Boolean column, handles DB-specific formats. |
| `col.json()` | `unknown` | JSON/JSONB column. |
| `col.jsonb()` | `unknown` | JSONB column (PostgreSQL optimized). |
| `col.date()` | `Date` | DATE column (YYYY-MM-DD). |
| `col.date.string()` | `string` | DATE column that stays typed as `string`. |
| `col.datetime()` | `Date` | DATETIME column with auto-creation and auto-update. |
| `col.datetime.string()` | `string` | DATETIME column that stays typed as `string`. |
| `col.timestamp()` | `Date` | Unix timestamp column, with auto-creation and auto-update. |
| `col.timestamp.string()` | `string` | Unix timestamp column that stays typed as `string`. |
| `col.time()` | `Date` | TIME column (HH:mm:ss), with auto-creation and auto-update. |
| `col.time.string()` | `string` | TIME column that stays typed as `string`. |
| `col.uuid()` | `string` | Auto-generates a UUID if not provided. |
| `col.ulid()` | `string` | Auto-generates a ULID if not provided. |
| `col.binary()` | `Buffer \| Uint8Array \| string` | Binary/blob column. |
| `col.enum(values)` | `values[number]` | Enum column constrained to the provided values array. |
| `col.nativeEnum(enumObj)` | `enum values` | Native TypeScript enum column. |
| `col.char()` | `string` | CHAR column (fixed-length string). |
| `col.varbinary()` | `Buffer \| Uint8Array \| string` | VARBINARY column. |
| `col.tinyint()` | `number` | TINYINT column. |
| `col.smallint()` | `number` | SMALLINT column. |
| `col.mediumint()` | `number` | MEDIUMINT column. |
| `col.encryption.symmetric(opts)` | `string` | Encrypts/decrypts value using a symmetric key. |
| `col.encryption.asymmetric(opts)` | `string` | Encrypts/decrypts value using asymmetric keys. |

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

| Method | Database Column Type | Format | Use Case | Migration Example |
|--------|---------------------|--------|----------|-------------------|
| `col.date()` | `DATE` | YYYY-MM-DD | Birth dates, event dates (no time) | `table.date('birth_date')` |
| `col.datetime()` | `DATETIME`, `DATETIME2` | YYYY-MM-DD HH:mm:ss | Created/updated timestamps | `table.timestamp('created_at')` |
| `col.timestamp()` | `TIMESTAMP` (as integer) | Unix timestamp | High-performance timestamps as integers | `table.integer('last_login')` |
| `col.time()` | `TIME` | HH:mm:ss | Start/end times, durations (no date) | `table.time('start_time')` |

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

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `primaryKey` | boolean | false | Marks this column as the primary key. Only one primary key is allowed per model. |
| `serialize` | function | undefined | Custom read transform on helpers that expose it. Date/time helpers handle this internally. |
| `prepare` | function | undefined | Custom write transform on helpers that expose it. Date/time helpers handle this internally. |
| `autoCreate` | boolean \| (() => Date) \| (() => string) | false | Date/time helpers only. Use `true` for built-in current time behavior or a typed callback. |
| `autoUpdate` | boolean \| (() => Date) \| (() => string) | false | Date/time helpers accept `true` or a typed callback. On other helpers, forces `prepare` on updates. |
| `databaseName` | string | property name (case-converted) | Custom name for the column in the database. |
| `nullable` | boolean | true (false for PK columns) | If false, the column cannot be null. |
| `default` | string \| number \| null \| boolean | undefined | Migration-only metadata. Sets the DEFAULT clause in CREATE TABLE / ALTER TABLE. |
| `validate` | `Validator \| Validator[]` | undefined | Validators run on insert/update. |

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

## API Reference

### `defineModel(table, definition)`

Creates a fully-typed Model subclass programmatically.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `table` | `string` | The database table name |
| `definition` | `ModelDefinition` | Object containing columns, indexes, uniques, checks, hooks, and options |

**Returns:** `DefinedModel<T, C, {}>` — A Model subclass with typed columns and static column references.

**Definition Object Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `columns` | `Record<string, ColumnDef>` | Yes | Column definitions using `col.*` helpers |
| `indexes` | `IndexDefinition[]` | No | Array of index definitions |
| `uniques` | `UniqueDefinition[]` | No | Array of unique constraint definitions |
| `checks` | `CheckDefinition[]` | No | Array of check constraint definitions |
| `hooks` | `HooksDefinition` | No | Lifecycle hooks (beforeFetch, afterFetch, etc.) |
| `options` | `DefineModelOptions` | No | Model behavior options |

## Defining Relations (`defineRelations` + `createSchema`)

Relations are **not** defined inside `defineModel`. Use `defineRelations` + `createSchema` in a dedicated schema file instead. This approach works for all project sizes and eliminates circular import issues entirely.

| Helper | Description | Foreign Key Location |
|--------|-------------|---------------------|
| `hasOne` | One-to-one relationship | On the related model |
| `hasMany` | One-to-many relationship | On the related model |
| `belongsTo` | Inverse of hasOne/hasMany | On the current model |
| `manyToMany` | Many-to-many via join table | On the join/pivot table |

```typescript
import { createSchema, defineRelations, defineModel, col } from "hysteria-orm";

// Define models first (without relations)
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

// Define relations in a separate schema file
const UserRelations = defineRelations(User, ({ hasMany, manyToMany }) => ({
  posts: hasMany(Post, { foreignKey: "userId" }),
  addresses: manyToMany(Address, {
    through: UserAddress,
    leftForeignKey: "userId",
    rightForeignKey: "addressId",
  }),
}));

const PostRelations = defineRelations(Post, ({ belongsTo }) => ({
  user: belongsTo(User, { foreignKey: "userId" }),
}));

const AddressRelations = defineRelations(Address, ({ manyToMany }) => ({
  users: manyToMany(User, {
    through: UserAddress,
    leftForeignKey: "addressId",
    rightForeignKey: "userId",
  }),
}));

// Create the schema
export const schema = createSchema(
  { users: User, posts: Post, addresses: Address, user_addresses: UserAddress },
  { users: UserRelations, posts: PostRelations, addresses: AddressRelations },
);

// Export typed models
export const UserModel = schema.users;
export const PostModel = schema.posts;
export const AddressModel = schema.addresses;
```

## Indexes, Uniques & Checks

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

:::tip Constraint Names
Always provide explicit constraint names for production models. Auto-generated names are deterministic but less readable. Explicit names make migration history and database debugging easier.
:::

## Hooks

Hooks allow you to run logic before or after certain model actions. Define them in the `hooks` key of `defineModel`.

:::note
Hooks do not apply to joined models in queries from other models.
:::

```typescript
// Post model hooks won't run here
const users = await sql
  .from(User)
  .join("posts", "posts.userId", "users.id")
  .many();
```

### Available Hooks

| Hook | Signature | Description |
|------|-----------|-------------|
| `beforeFetch` | `(qb: ModelQueryBuilder) => void \| Promise<void>` | Modify query before fetching |
| `afterFetch` | `(data: T[]) => T[] \| Promise<T[]>` | Transform results after fetching |
| `beforeInsert` | `(data: Partial<T>) => void \| Promise<void>` | Modify data before insert |
| `beforeInsertMany` | `(data: Partial<T>[]) => void \| Promise<void>` | Modify data before bulk insert |
| `beforeUpdate` | `(qb: ModelQueryBuilder) => void \| Promise<void>` | Modify query before update |
| `beforeDelete` | `(qb: ModelQueryBuilder) => void \| Promise<void>` | Modify query before delete |

Where `T` is inferred from your `columns` definition, giving you typed data inside hook callbacks.

### Example: Soft Delete Filtering

```typescript
import { defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    isAdmin: col.boolean(),
    deletedAt: col.datetime(),
  },
  hooks: {
    beforeFetch(qb) {
      qb.whereNull("users.deleted_at");
    },
    beforeInsert(data) {
      data.isAdmin = false;
    },
    afterFetch(data) {
      return data.filter((user) => user.deletedAt === null);
    },
    beforeUpdate(qb) {
      // e.g., add conditions before any update
    },
    beforeDelete(qb) {
      // e.g., add conditions before any delete
    },
  },
});
```

### Ignoring Hooks

You can bypass hooks when needed using the `ignoreHooks` option:

```typescript
// Fetch soft-deleted records by ignoring beforeFetch hook
const allUsers = await sql.from(User).many({ ignoreHooks: ["beforeFetch"] });
```

## Validation

Validators can be added to column definitions via the `validate` option. They run automatically on insert and update operations.

```typescript
import { defineModel, col, required, email } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string({ validate: required }),
    email: col.string({ validate: [required, email] }),
  },
});
```

:::info
See the full [Validation](./validation.md) documentation for available validators and custom validator creation. For automatic Zod schema generation, see [Zod Integration](./zod-integration.md).
:::

## Options

Customize model behavior via the `options` key in `defineModel`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `modelCaseConvention` | `CaseConvention` | Auto-detected | Case convention for model properties |
| `databaseCaseConvention` | `CaseConvention` | Auto-detected | Case convention for database columns |
| `softDeleteColumn` | `string` | `"deletedAt"` | Column name used for soft deletes |
| `softDeleteValue` | `boolean \| string` | Current timestamp | Value to set when soft deleting |

### Case Conventions

```typescript
const User = defineModel("users", {
  columns: {
    id: col.increment(),
    firstName: col.string(), // model property: firstName
    lastName: col.string(),  // model property: lastName
  },
  options: {
    modelCaseConvention: "camelCase",      // Model properties: camelCase
    databaseCaseConvention: "snake_case",  // DB columns: snake_case
  },
});
// Maps: firstName → first_name, lastName → last_name
```

### Soft Delete Configuration

```typescript
const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    deletedAt: col.datetime(),
    isDeleted: col.boolean(),
  },
  options: {
    softDeleteColumn: "isDeleted",  // Use isDeleted column instead of deletedAt
    softDeleteValue: true,          // Set to true instead of timestamp
  },
});
```

:::info
See [Case Conventions](./case-conventions.md) for detailed information on case conversion between model properties and database columns.
:::

---

## Type-Safe Column References

Models created with `defineModel` automatically get static properties for each column that provide fully-qualified column names:

```typescript
const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string(),
  },
});

// Static column references
console.log(User.id);    // "users.id"
console.log(User.name);  // "users.name"
console.log(User.email); // "users.email"

// Use in queries with full type safety
const users = await sql
  .from(User)
  .select(User.id, User.name)
  .where(User.email, "like", "%@example.com")
  .many();
```

---

Next: [Model Hooks & Lifecycle](./hooks.md)
