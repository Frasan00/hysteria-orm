---
title: Models
description: Define SQL models with defineModel, columns, relations, table constraints, and model options.
keywords:
  [
    hysteria-orm,
    defineModel,
    col,
    SQL models,
    model definition,
    columns,
    relations,
    table constraints,
  ]
---

# Models

Models represent database tables. The `defineModel` function creates fully-typed `Model` subclasses programmatically, without decorators. The returned class works with `SqlDataSource`, `ModelQueryBuilder`, `SchemaDiff` (automatic migrations), and the rest of the query infrastructure.

## Quick start

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
sql
  .from(User)
  .select(User.id, [User.email, "userEmail"])
  .where(User.id, ">", 5)
  .orderBy(User.email, "asc");
```

## Column descriptors (`col`)

All column types are available via the `col` namespace. Each helper returns a `ColumnDef` with full TypeScript inference.

| Method                            | Base Type                            | Description                                                                                           |
| --------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `col<T>()`                        | _any_ (user-defined via generic)     | Generic column. Accepts options like `primaryKey`, `databaseName`, and a custom `type`.               |
| `col.primary()`                   | `string \| number`                   | Generic primary key column.                                                                           |
| `col.increment()`                 | `number`                             | Auto-incrementing integer primary key (always non-nullable).                                          |
| `col.bigIncrement()`              | `number`                             | Auto-incrementing bigint primary key (always non-nullable).                                           |
| `col.integer()`                   | `number`                             | Integer column.                                                                                       |
| `col.bigInteger()`                | `number`                             | Big integer column. Handles Postgres string-to-Number conversion.                                     |
| `col.float()`                     | `number`                             | Float column.                                                                                         |
| `col.decimal()`                   | `number`                             | Decimal column with optional `precision` and `scale`.                                                 |
| `col.string()`                    | `string`                             | VARCHAR column with optional `length`.                                                                |
| `col.text()`                      | `string`                             | Long text column.                                                                                     |
| `col.boolean()`                   | `boolean`                            | Boolean column, handles DB-specific formats (for example MySQL tinyint).                              |
| `col.json()`                      | `unknown` (customizable via generic) | JSON/JSONB column.                                                                                    |
| `col.jsonb()`                     | `unknown`                            | JSONB column (PostgreSQL optimized).                                                                  |
| `col.date()`                      | `Date`                               | DATE column (YYYY-MM-DD).                                                                             |
| `col.date.string()`               | `string`                             | DATE column that stays typed as `string`.                                                             |
| `col.datetime()`                  | `Date`                               | DATETIME column with auto-creation and auto-update.                                                   |
| `col.datetime.string()`           | `string`                             | DATETIME column that stays typed as `string`.                                                         |
| `col.timestamp()`                 | `Date`                               | Unix timestamp column, with auto-creation and auto-update.                                            |
| `col.timestamp.string()`          | `string`                             | Unix timestamp column that stays typed as `string`.                                                   |
| `col.time()`                      | `Date`                               | TIME column (HH:mm:ss), with auto-creation and auto-update.                                           |
| `col.time.string()`               | `string`                             | TIME column that stays typed as `string`.                                                             |
| `col.uuid()`                      | `string`                             | Auto-generates a UUID if not provided.                                                                |
| `col.ulid()`                      | `string`                             | Auto-generates a ULID if not provided.                                                                |
| `col.binary()`                    | `Buffer \| Uint8Array \| string`     | Binary/blob column.                                                                                   |
| `col.enum(values)`                | `values[number]`                     | Enum column constrained to the provided values array.                                                 |
| `col.nativeEnum(enumObj)`         | enum values                          | Native TypeScript enum column.                                                                        |
| `col.char()`                      | `string`                             | CHAR column (fixed-length string).                                                                    |
| `col.varbinary()`                 | `Buffer \| Uint8Array \| string`     | VARBINARY column.                                                                                     |
| `col.tinyint()`                   | `number`                             | TINYINT column.                                                                                       |
| `col.smallint()`                  | `number`                             | SMALLINT column.                                                                                      |
| `col.mediumint()`                 | `number`                             | MEDIUMINT column.                                                                                     |
| `col.computed<T>(expr, opts)`     | `T \| undefined`                     | Database-side computed (virtual) column. See [Views & Computed Columns](/databases/sql/models/views). |
| `col.encryption.symmetric(opts)`  | `string`                             | Encrypts/decrypts a value using a symmetric key.                                                      |
| `col.encryption.asymmetric(opts)` | `string`                             | Encrypts/decrypts a value using asymmetric keys.                                                      |

### Nullable-aware type inference

- **Primary key columns** (`col.increment()`, `col.bigIncrement()`, `col.primary()`, `col.uuid({ primaryKey: true })`) are **non-nullable**.
- **Non-PK columns** are **nullable by default**. The inferred type includes `| null | undefined`. Use `{ nullable: false }` to make them required.

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

### Date/time column types

Choose the date/time helper that matches your database column:

| Method            | Database Column Type     | Format              | Use Case                                | Migration Example               |
| ----------------- | ------------------------ | ------------------- | --------------------------------------- | ------------------------------- |
| `col.date()`      | `DATE`                   | YYYY-MM-DD          | Birth dates, event dates (no time)      | `table.date('birth_date')`      |
| `col.datetime()`  | `DATETIME`, `DATETIME2`  | YYYY-MM-DD HH:mm:ss | Created/updated timestamps              | `table.timestamp('created_at')` |
| `col.timestamp()` | `TIMESTAMP` (as integer) | Unix timestamp      | High-performance timestamps as integers | `table.integer('last_login')`   |
| `col.time()`      | `TIME`                   | HH:mm:ss            | Start/end times, durations (no date)    | `table.time('start_time')`      |

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

:::note Migration notes

- `table.timestamp()` in a migration creates a `DATETIME`/`DATETIME2` column, not a Unix integer. Use `col.datetime()` for it. For a real Unix integer, define the column as `table.integer()` or `table.bigint()` and use `col.timestamp()` in the model.
- Date/time helpers default to `Date`. Use `col.date.string()`, `col.datetime.string()`, `col.timestamp.string()`, or `col.time.string()` for string values.
- In `.string()` mode, supplied strings are written as-is and driver values are normalized back to strings.
- `autoCreate` and `autoUpdate` accept `true` or a callback. The callback return type must match the helper mode: `Date` for default helpers, `string` for `.string()` variants.
- When auto-generated migrations use `autoUpdate: true`, MySQL/MariaDB emit `ON UPDATE CURRENT_TIMESTAMP`; on other databases, migrations generate an update trigger named `trg_{table}_{column}_auto_update`.
- Date/time helpers handle `serialize` and `prepare` internally, so those options are not available there.
- All date/time column types support the `timezone` (`'UTC'` or `'LOCAL'`) and `withTimezone` options.
  :::

### Column options

Different `col` helpers expose different options. The common options are:

| Option                     | Type                                      | Default                        | Description                                                                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `primaryKey`               | boolean                                   | false                          | Marks this column as the primary key. Only one primary key is allowed per model.                                         |
| `primaryKeyConstraintName` | string                                    | undefined                      | Explicit name for the primary key constraint in migrations.                                                              |
| `serialize`                | function                                  | undefined                      | Read transform applied to a value returned from the database. Not available on date/time helpers.                        |
| `prepare`                  | function                                  | undefined                      | Write transform applied before insert/update. Not available on date/time helpers.                                        |
| `autoCreate`               | boolean \| `() => Date` \| `() => string` | false                          | Date/time helpers only. `true` uses the built-in current-value behavior; a callback supplies it.                         |
| `autoUpdate`               | boolean \| `() => Date` \| `() => string` | false                          | Date/time helpers accept `true` or a callback. On other helpers, the boolean form forces `prepare` on updates.           |
| `databaseName`             | string                                    | property name (case-converted) | Custom column name in the database.                                                                                      |
| `nullable`                 | boolean                                   | true (false for PK columns)    | If false, the column cannot be null.                                                                                     |
| `default`                  | string \| number \| null \| boolean       | undefined                      | Migration-only metadata. Sets the DEFAULT clause in CREATE TABLE / ALTER TABLE; it does not apply a value during insert. |
| `validate`                 | `Validator \| Validator[]`                | undefined                      | Validators run on insert/update. See [Validation](/databases/sql/models/validation).                                     |
| `length`                   | number                                    | undefined                      | Length for string, char, and varbinary columns.                                                                          |
| `precision` / `scale`      | number                                    | undefined                      | Precision and scale for decimal/numeric (and precision for float types).                                                 |
| `unsigned`                 | boolean                                   | undefined                      | MySQL/MariaDB only. Declares a numeric column as UNSIGNED (migration-only).                                              |
| `zerofill`                 | boolean                                   | undefined                      | MySQL/MariaDB only. Declares ZEROFILL on a numeric column (migration-only).                                              |
| `type`                     | string \| string[]                        | helper default                 | Overrides the column type, including custom types such as `vector` or `geometry`.                                        |
| `openApi`                  | object                                    | undefined                      | Custom OpenAPI property schema; otherwise inferred from the column type.                                                 |

```typescript
const User = defineModel("users", {
  columns: {
    id: col.integer({
      primaryKey: true,
      databaseName: "user_id",
    }),
    name: col.string({
      length: 120,
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

:::note Column option behavior

- Composite primary keys are not supported; defining more than one primary key throws.
- Use `prepare`/`serialize` only on helpers that expose them. Date/time helpers and their `.string()` variants reject custom `prepare`/`serialize`.
- `databaseName` is useful when the DB column name differs from the property name or case convention.
  :::

## API reference

### `defineModel(table, definition)`

Creates a fully-typed `Model` subclass programmatically.

**Parameters:**

| Parameter    | Type              | Description                                                             |
| ------------ | ----------------- | ----------------------------------------------------------------------- |
| `table`      | `string`          | The database table name                                                 |
| `definition` | `ModelDefinition` | Object containing columns, indexes, uniques, checks, hooks, and options |

**Returns:** `DefinedModel<T, C, {}>`, a `Model` subclass with typed columns and static column references.

**Definition object properties:**

| Property  | Type                        | Required | Description                              |
| --------- | --------------------------- | -------- | ---------------------------------------- |
| `columns` | `Record<string, ColumnDef>` | Yes      | Column definitions using `col.*` helpers |
| `indexes` | `IndexDefinition[]`         | No       | Index definitions                        |
| `uniques` | `UniqueDefinition[]`        | No       | Unique constraint definitions            |
| `checks`  | `CheckDefinition[]`         | No       | Check constraint definitions             |
| `hooks`   | `HooksDefinition`           | No       | Lifecycle hooks (`beforeFetch` only)     |
| `options` | `DefineModelOptions`        | No       | Model behavior options                   |

## Defining relations (`defineRelations` + `createSchema`)

Relations are **not** defined inside `defineModel`. Use `defineRelations` + `createSchema` in a dedicated schema file. This avoids circular import issues.

| Helper       | Description                 | Foreign Key Location    |
| ------------ | --------------------------- | ----------------------- |
| `hasOne`     | One-to-one relationship     | On the related model    |
| `hasMany`    | One-to-many relationship    | On the related model    |
| `belongsTo`  | Inverse of hasOne/hasMany   | On the current model    |
| `manyToMany` | Many-to-many via join table | On the join/pivot table |

The relation callbacks receive the relation helpers as their first argument:

```typescript
import { createSchema, defineRelations, defineModel, col } from "hysteria-orm";

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

export const schema = createSchema(
  { users: User, posts: Post, addresses: Address, user_addresses: UserAddress },
  { users: UserRelations, posts: PostRelations, addresses: AddressRelations },
);

export const UserModel = schema.users;
export const PostModel = schema.posts;
export const AddressModel = schema.addresses;
```

See [Relations Overview](/databases/sql/relations/overview) for load strategies and relation queries.

## Indexes, uniques & checks

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

## Lifecycle hooks

As of 12.0.0, `beforeFetch` is the **only** model hook. Write-time hooks (`afterFetch`, `beforeInsert`, `beforeInsertMany`, `beforeUpdate`, `beforeDelete`) and the `ignoreHooks` option were removed: the ORM delegates defaults to the database and keeps the query path free of per-row JavaScript.

`beforeFetch` runs once per query before the SQL is built. It is async-capable and receives the model's query builder, so it can mutate conditions, joins, and ordering. A common use is soft-delete filtering:

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
  },
});
```

:::note
Hooks apply only to the model being queried, not to joined models.
:::

For datasource-level query interception across every model, see [Query Observers](/databases/sql/advanced/observers).

## Validation

Add validators to a column with the `validate` option. They run automatically on insert and update.

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

See [Validation](/databases/sql/models/validation) for built-in validators, custom validators, and Zod schema generation.

## Model options

Customize model behavior through the `options` key:

| Option                   | Type                | Default           | Description                           |
| ------------------------ | ------------------- | ----------------- | ------------------------------------- |
| `modelCaseConvention`    | `CaseConvention`    | Auto-detected     | Case convention for model properties. |
| `databaseCaseConvention` | `CaseConvention`    | Auto-detected     | Case convention for database columns. |
| `softDeleteColumn`       | `string`            | `"deletedAt"`     | Column used by soft deletes.          |
| `softDeleteValue`        | `boolean \| string` | Current timestamp | Value written when soft deleting.     |

```typescript
const User = defineModel("users", {
  columns: {
    id: col.increment(),
    firstName: col.string(),
    lastName: col.string(),
    deletedAt: col.datetime(),
    isDeleted: col.boolean(),
  },
  options: {
    modelCaseConvention: "camelCase", // firstName, lastName
    databaseCaseConvention: "snake_case", // first_name, last_name
    softDeleteColumn: "isDeleted",
    softDeleteValue: true,
  },
});
```

See [Case Conventions](/databases/sql/models/case-conventions) for the full mapping rules.

## Model metadata

Models expose public statics for schema inspection. These are commonly used by tooling, plugins, and custom serializers.

| Static                       | Returns                   | Description                               |
| ---------------------------- | ------------------------- | ----------------------------------------- |
| `table`                      | `string`                  | The database table name.                  |
| `primaryKey`                 | `string \| undefined`     | The primary key column name.              |
| `softDeleteColumn`           | `string`                  | Column used by soft deletes.              |
| `softDeleteValue`            | `boolean \| string`       | Value written when soft deleting.         |
| `getColumns()`               | `ColumnType[]`            | All column definitions.                   |
| `getColumnsByName()`         | `Map<string, ColumnType>` | Model property name → column definition.  |
| `getColumnsByDatabaseName()` | `Map<string, ColumnType>` | Database column name → column definition. |
| `getRelations()`             | `LazyRelationType[]`      | Registered relations.                     |
| `getIndexes()`               | `IndexType[]`             | Registered indexes.                       |
| `getUniques()`               | `UniqueType[]`            | Registered unique constraints.            |
| `getChecks()`                | `CheckType[]`             | Registered check constraints.             |

```typescript
User.table; // "users"
User.primaryKey; // "id"
User.getColumns().map((col) => col.databaseName);
User.getColumnsByName().get("email");
User.getColumnsByDatabaseName().get("email_address");
```

## Type-safe column references

Models created with `defineModel` get static properties for each column that resolve to fully-qualified column names:

```typescript
const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string(),
  },
});

console.log(User.id); // "users.id"
console.log(User.name); // "users.name"
console.log(User.email); // "users.email"

const users = await sql
  .from(User)
  .select(User.id, User.name)
  .where(User.email, "like", "%@example.com")
  .many();
```

## See also

- [Validation](/databases/sql/models/validation)
- [Views & Computed Columns](/databases/sql/models/views)
- [Case Conventions](/databases/sql/models/case-conventions)
- [Model Mixins](/databases/sql/models/mixins)
- [Models as DTOs](/databases/sql/models/instance-methods)
- [Relations Overview](/databases/sql/relations/overview)
- [CRUD Operations](/databases/sql/standard-methods/basics)
- [Query Builder Overview](/databases/sql/query-builder/overview)
