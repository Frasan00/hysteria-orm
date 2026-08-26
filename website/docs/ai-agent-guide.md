---
title: AI Agent Guide
description: "A self-contained brief for AI coding assistants: bootstrap a Hysteria ORM project from scratch and the idiomatic, type-safe best practices."
keywords:
  [hysteria-orm, AI agent guide, best practices, type safety, defineModel, query builder]
slug: ai-agent-guide
sidebar_position: 1
---

# AI Agent Guide

A self-contained brief an AI coding assistant can read from scratch — even before a project is set up. It covers **how to bootstrap** a Hysteria ORM project and the **idiomatic, type-safe best practices** for this framework.

:::caution Scope
The advice below applies **only when working with Hysteria ORM**. It must NOT override a project's general conventions documented elsewhere (lint rules, architecture decisions, naming standards). When the project's conventions conflict with this guide, the project wins.
:::

## 1. Bootstrap from scratch

Hysteria ORM (`hysteria-orm`, v11, Node `>=22`) is a framework-agnostic ORM for SQL, MongoDB, and Redis. The `hysteria` CLI scaffolds the database layer.

:::note `init` does not create a full app
`hysteria init` only creates `database/index.ts` and `database/migrations/`. It needs an existing `package.json` first — start in an empty directory by initializing one.
:::

```bash
# 1. from an empty directory
npm init -y

# 2. install the ORM and dev tooling
npm install hysteria-orm
npm install --save-dev esbuild typescript

# 3. install a driver for your target database, e.g. PostgreSQL
npm install pg

# 4. scaffold the database layer
npx hysteria init -t postgres
```

Available `init` types: `sqlite`, `mysql`, `postgres`, `mariadb`, `cockroachdb`, `mssql`, `oracledb`, `mongodb`, `redis`.

| Database      | Driver package |
| ------------- | -------------- |
| PostgreSQL    | `pg`           |
| MySQL/MariaDB | `mysql2`       |
| SQLite        | `sqlite3`      |
| MSSQL         | `mssql`        |
| OracleDB      | `oracledb`     |
| MongoDB       | `mongodb`      |
| Redis         | `ioredis`      |

The scaffold produces a `database/index.ts`. A minimal working SQL setup looks like:

```typescript
import { SqlDataSource, defineModel, col, createSchema } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string(),
  },
});

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "root",
  password: "root",
  database: "myapp",
  models: createSchema({ users: User }),
});

await sql.connect();

export default sql;
```

You can also pass no input and configure via environment variables: `const sql = new SqlDataSource(); await sql.connect();`.

## 2. Define models programmatically (`defineModel` + `col`)

Use the **programmatic** `defineModel` with the `col` namespace. This is the only public model-definition path.

```typescript
import { defineModel, col } from "hysteria-orm";

const users = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string({ nullable: false }),
    email: col.string(),
    age: col.integer(),
    balance: col.decimal({ precision: 10, scale: 2 }),
    isActive: col.boolean(),
    metadata: col.jsonb(),
    createdAt: col.datetime({ autoCreate: true }),
    updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
  },
});
```

`col` provides typed column builders: `increment`, `bigIncrement`, `string`, `text`, `char`, `integer`, `bigInteger`, `float`, `decimal`, `boolean`, `date`, `datetime`, `timestamp`, `time`, `json`, `jsonb`, `uuid`, `ulid`, `binary`, `enum(values, opts)`, `nativeEnum(enumObj, opts)`, and `encryption.symmetric/asymmetric(opts)`.

:::caution No public `@Model()` decorator
Class/property decorators (`@Model()`, `@column`, `@belongsTo`, …) exist internally but are **not exported from `hysteria-orm`**. The only public decorator is `@atomic` (for transactions, see §9). Always use `defineModel` / `col`.
:::

## 3. Case conventions: camelCase plural tables

Name models with a **camelCase plural** table name as the first argument to `defineModel`:

- `users`, `userProfiles`, `blogPosts`, `orderItems`.

You can override mapping per-model via `options.modelCaseConvention` and `options.databaseCaseConvention` (e.g. when the DB uses `snake_case` columns). Use the camelCase plural form as the canonical reference.

## 4. Querying: never select all columns

Never rely on a full-row `SELECT *`. Always select the subset of columns you need with `.select()`. Reference columns through the **model's exported columns** (each column is a static property equal to `"table.column"`), not bare strings:

```typescript
import sql from "../database";

// Good — explicit, typed subset, columns referenced via the model
const rows = await sql
  .from(users)
  .select(users.id, users.name)
  .many();
// rows: { id: number; name: string }[]
```

:::tip Reference columns via the model
`users.id` evaluates to `"users.id"`. Prefer `select(users.id)` over `select("id")` — the model-typed reference keeps the column name in sync with the schema and stays refactor-safe.
:::

:::caution Only model queries are typed
`sql.from(users)` (passing the model) returns a **typed** `ModelQueryBuilder`. `sql.from("users")` (passing a raw string) returns an **untyped** query builder (`Record<string, any>[]`). Always query through a defined model when you want type safety.
:::

You can also reach the same typed builder via the `sql.models` proxy: `sql.models.users` is equivalent to `sql.from(users)`.

Fetch methods: `.many()` (array), `.one()` (single or null), `.find()`.

## 5. Aliases & SQL functions

Aliases use a **tuple**: `[column, "alias"]` — not a `"col as alias"` string.

```typescript
const rows = await sql
  .from(users)
  .select(users.id, [users.name, "userName"], [users.age, "userAge"])
  .many();
// rows: { id: number; userName: string; userAge: number }[]
```

SQL functions use `.selectFunc(sqlFunc, column, alias)`; the return type is inferred from the function:

```typescript
const totals = await sql
  .from(orders)
  .selectFunc("sum", orders.amount, "total")
  .many();
// totals: { total: number }[]
```

## 6. `selectRaw` with a return-type generic

For raw SQL fragments, always pass a generic describing the added columns:

```typescript
const result = await sql
  .from(users)
  .selectRaw<{ count: number }>("count(*) as count")
  .one();
// result.count is number, not any
```

:::tip Always pass the generic
Without the generic, `.selectRaw("...")` adds the columns as `any`, silently erasing type safety. Use `selectRaw<{ column: type }>(...)` so the added shape stays typed.
:::

## 7. Relations where possible

Define relations programmatically with `defineRelations` (a callback receiving helpers), then register everything with `createSchema`:

```typescript
import { defineModel, col, defineRelations, createSchema, SqlDataSource } from "hysteria-orm";

const users = defineModel("users", {
  columns: { id: col.increment(), name: col.string() },
});
const posts = defineModel("posts", {
  columns: { id: col.increment(), title: col.string(), userId: col.integer() },
});

const userRelations = defineRelations(users, ({ hasMany }) => ({
  posts: hasMany(posts, { foreignKey: "userId" }),
}));

const schema = createSchema(
  { users, posts },
  { users: userRelations },
);
const User = schema.users;
```

The four relation kinds: `hasOne`, `hasMany`, `belongsTo`, `manyToMany`. `manyToMany` takes `{ through, leftForeignKey, rightForeignKey }`.

Load relations at query time with `.load(relationName, { strategy })` (strategy: `"auto"` | `"join"` | `"batched"`):

```typescript
const usersWithPosts = await sql.from(User).select(User.id).load("posts").many();
```

:::caution `defineRelations` takes a callback — not a plain object
The real signature is `defineRelations(model, ({ hasMany, hasOne, belongsTo, manyToMany }) => ({ ... }))`. A plain-object form like `defineRelations(model, { posts: (rel) => rel.hasMany("posts", "userId") })` will **not compile** — some older docs/examples show that shape; use the callback form above.
:::

## 8. Queries are type-safe by definition

Type safety flows from the selection: `.select()` accumulates the row type, so accessing a column you didn't select is a compile error.

```typescript
const u = await sql.from(users).select(users.name, [users.age, "userAge"]).one();
u.name;     // string
u.userAge;  // number (aliased)
// u.email;  // Type error — not selected
```

Keep examples type-safe: select only what you read, alias with tuples, and pass generics to `selectRaw`. Build queries from defined models so the inference machinery applies.

## 9. Transactions & `@atomic`

Use `sql.transaction(cb)` for explicit transactions. Nested transactions are supported, and the active transaction is auto-propagated to queries via AsyncLocalStorage (`clsEnabled` defaults to `true`), so you don't thread the `trx` through every call:

```typescript
await sql.transaction(async (trx) => {
  await sql.from(users).insert({ name: "Ada" });
  await sql.from(posts).insert({ title: "Hello", userId: 1 });
});
```

For a method that must run entirely in a transaction, use the public `@atomic` decorator:

```typescript
import { atomic } from "hysteria-orm";

class UserService {
  @atomic()
  async transfer(fromId: number, toId: number, amount: number) {
    // runs inside a transaction automatically
  }
}
```

## 10. Migrations: auto-generate from models, then apply

The **standard workflow** is: change your `defineModel`/`col` definitions, let the CLI **auto-generate** the migration from the schema diff, then **apply** it. Don't hand-write migrations for schema changes that fall out of model edits.

```bash
# 1. preview the diff against your models (no files written, no DB changes)
npx hysteria generate:migrations --dry

# 2. generate the migration file from the diff
npx hysteria generate:migrations -n add_users_email

# 3. apply it
npx hysteria migrate
```

:::tip `sync` for fast iteration
During development you can apply a schema diff directly to the DB with `npx hysteria sync` (no migration file written). Preview with `--dry` first. For anything that needs to ship (other environments, version control), generate and commit a migration file instead.
:::

:::caution Schema-diff DB support
`generate:migrations` and `sync` work **only for PostgreSQL, MySQL, MariaDB, and CockroachDB**. On SQLite/MSSQL/Oracle, write migrations by hand with `create:migration` and the `Schema` builder.
:::

For the rare hand-written case, `create:migration <name>` scaffolds a file using the `Schema` builder, and `migrate`/`rollback`/`refresh` run them. See the Migrations and CLI docs for the full `Schema` builder API.

## 11. CLI / scaffolding reference

| Command                          | Purpose                                                        |
| -------------------------------- | ------------------------------------------------------------- |
| `hysteria init -t <type>`        | Scaffold `database/` (needs an existing `package.json`)       |
| `hysteria create:migration <n>`  | Create a migration file (`-a` alter, `-c` create, `-t` table) |
| `hysteria migrate [until]`       | Run pending migrations                                        |
| `hysteria rollback [until]`      | Rollback migrations                                           |
| `hysteria refresh`               | Rollback then re-run (`-f` to drop all tables)                |
| `hysteria generate:migrations`   | Auto-generate migration from model/schema diff (PG/MySQL/Maria/Cockroach) |
| `hysteria sync`                  | Apply schema diff directly (same DB restrictions)             |
| `hysteria create:seeder <name>`  | Create a seeder file                                          |
| `hysteria seed`                  | Run seeders                                                   |
| `hysteria db:pull`               | Generate model files from an existing DB schema               |
| `hysteria sql [sql]`             | Run a SQL file or inline query                                |

## Where to look next

- [Philosophy](/getting-started/philosophy) — design principles
- [Installation](/getting-started/installation) — install & drivers
- [Setup](/getting-started/setup) — data source configuration
- [Define Model](/databases/sql/models/define-model) — full `defineModel` / `col` API
- [Query Builder](/databases/sql/query-builder/basics) — query builder reference
- [SQL Functions](/databases/sql/query-builder/sql-functions) — `.selectFunc` and JSON select family
- [Relations](/databases/sql/relations/overview) — relation kinds & load strategies
- [Transactions](/databases/sql/advanced/transactions) — transactions deep-dive
- [Migrations](/databases/sql/cli/migrations/basics) — `Schema` builder & migration lifecycle
- [CLI Overview](/databases/sql/cli/overview) — full CLI reference