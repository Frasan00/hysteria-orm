---
title: Views & Computed Columns
description: Read-only view models with defineView and database-side computed columns with col.computed.
keywords:
  [
    hysteria-orm,
    database views,
    defineView,
    computed columns,
    virtual columns,
    col.computed,
    read-only models,
  ]
---

# Views & Computed Columns

Views and computed columns both expose derived data without materializing a dedicated physical column. Use `defineView` for a read-only model over a SQL statement, and `col.computed()` when a single value should be evaluated by the database on every query.

## Database views (`defineView`)

`defineView` defines a read-only model backed by a SQL statement. It returns a class you query with `sql.from(View)`, just like a model. It does **not** create a database view: the statement is stored for migration and schema tooling, while the ORM uses it as the source for reads. Mutation operations (`insert`, `update`, `delete`) are hidden from view types.

### Basic view definition

`defineView` takes a table name and a definition object with `columns` (using `col`) and a `statement` callback that receives a query builder.

```typescript
import { defineView, col } from "hysteria-orm";

const UserCount = defineView("user_count_view", {
  columns: {
    id: col.integer({ primaryKey: true }),
    total: col.integer(),
  },
  statement: (qb) => {
    qb.selectRaw("COUNT(*) as total").from("users");
  },
});

const counts = await sql.from(UserCount).many();
```

:::tip
Prefer `selectRaw` in view statements. The statement is raw SQL and is not validated by the ORM.
:::

### View with complex queries

Views can contain joins, aggregations, and subqueries:

```typescript
import { defineView, col } from "hysteria-orm";

const UserStats = defineView("user_stats_view", {
  columns: {
    userId: col.integer({ primaryKey: true }),
    userName: col.string(),
    postCount: col.integer(),
    avgRating: col.float(),
  },
  statement: (qb) => {
    qb.selectRaw("users.id as userId")
      .selectRaw("users.name as userName")
      .selectRaw("COUNT(posts.id) as postCount")
      .selectRaw("AVG(posts.rating) as avgRating")
      .from("users")
      .leftJoin("posts", "users.id", "posts.user_id")
      .groupBy("users.id", "users.name")
      .having("post_count", ">", 0);
  },
});

const stats = await sql.from(UserStats).where("postCount", ">", 5).many();
```

### View hooks

Views support only the `beforeFetch` hook, which runs once per query and mutates the query builder:

```typescript
const ActiveUserSummary = defineView("active_user_summary", {
  columns: {
    id: col.integer({ primaryKey: true }),
    name: col.string(),
    email: col.string(),
  },
  statement: (qb) => {
    qb.select("id", "name", "email").from("users");
  },
  hooks: {
    beforeFetch(qb) {
      qb.where("is_active", true);
    },
  },
});
```

See [Query Observers](/databases/sql/advanced/observers) for datasource-level interception.

## Computed columns

Computed (virtual) columns are model properties whose value is **evaluated by the database at query time** from a raw SQL expression, instead of being stored as a physical column or computed in TypeScript. Because the expression is pushed into the generated SQL, filtering, sorting, and aggregation run inside the database engine.

Typical uses include `fullName` from `first_name` + `last_name` and `total` from `price * quantity`.

### Behavior

A computed column:

- **Has no physical column**: it carries no `type`, so it is excluded from auto-generated migrations.
- **Is never written** on `insert` / `update`; values supplied for it are silently dropped.
- **Only appears in results when explicitly selected**: `.select(User.fullName)` or `[User.fullName, "alias"]`. A plain `.one()` / `.many()` omits it.
- **Resolves to the raw expression** when referenced in `WHERE` / `ORDER BY` / `GROUP BY` / `HAVING`.
- **Is typed as `T | undefined`** on instances, since it is absent unless selected.

### Defining a computed column

Define a computed column with `col.computed()` inside `defineModel`:

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

The expression is raw SQL and is **not** case-converted or ported across dialects. Write it in your database's syntax.

### Querying

```typescript
// Explicitly selected — fullName is computed by the DB
const user = await sql.from(User).select(User.fullName).one();

// Not selected — fullName is absent from the result
const plain = await sql.from(User).one();

// Custom alias
const row = await sql.from(User).select([User.fullName, "displayName"]).one();

// WHERE / ORDER BY resolve to the raw expression
const alice = await sql
  .from(User)
  .select(User.fullName)
  .where(User.fullName, "Alice Able")
  .one();

const rows = await sql
  .from(User)
  .select(User.firstName, User.lastName, User.fullName)
  .orderBy(User.fullName, "asc")
  .many();
```

### Writes

Computed columns are stripped at every write entry point, both in SQL preview (`toSql()` / `unWrap()` / `toQuery()`) and in the executed query, so they never appear in:

- `INSERT` column lists/values
- `UPDATE` `SET` clauses
- `ON CONFLICT DO UPDATE SET` (PostgreSQL/SQLite)
- `ON DUPLICATE KEY UPDATE` (MySQL/MariaDB)
- `MERGE` target clauses (MSSQL)

```typescript
await sql.from(User).insert({
  firstName: "Eve",
  lastName: "Adams",
  fullName: "should be ignored", // silently dropped
});

await sql.from(User).upsertMany(
  ["id"],
  [
    {
      id: 1,
      firstName: "Eve",
      lastName: "Adams",
      fullName: "ignored" as any,
    },
  ],
);
```

Validators on computed columns are also skipped, since the value is never written.

### Migrations

Computed columns carry no `type`, so the schema diff never emits them. Migrate only the physical columns the expression references:

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

### Dialect-specific expressions

The expression is passed straight to the database, with no case conversion or cross-dialect porting. If you support multiple databases, branch on the dialect:

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
    fullName: col.computed<string>(concatExpr("postgres")),
  },
});
```

:::warning
Column names inside the expression refer to the **database** column names after case conversion, not the model property names. `firstName` becomes `first_name`.
:::

### Options

Because a computed column is virtual, write-related options (`type`, `primaryKey`, `prepare`, `default`, `autoUpdate`) are not available.

| Option         | Type                       | Description                                                                          |
| -------------- | -------------------------- | ------------------------------------------------------------------------------------ |
| `databaseName` | `string`                   | Custom alias used in the SELECT clause (defaults to the case-converted column name). |
| `serialize`    | `(value: any) => any`      | Callback applied to the returned value before it is placed on the model.             |
| `nullable`     | `boolean`                  | If `false`, marks the column as non-nullable (metadata only).                        |
| `validate`     | `Validator \| Validator[]` | Validators, skipped in practice because the column is never written.                 |

```typescript
const Product = defineModel("products", {
  columns: {
    id: col.increment(),
    price: col.decimal({ precision: 10, scale: 2, nullable: false }),
    quantity: col.integer({ nullable: false }),
    total: col.computed<number>("price * quantity", {
      databaseName: "line_total",
      serialize: (v) => (v == null ? undefined : Number(v)),
    }),
  },
});
```

### TypeScript types

- `col.computed<T>(...)` returns a `ComputedColumnDef<T>`.
- On inferred model instances, a computed column is typed as `T | undefined`.
- `ColComputedOptions` is exported for building reusable option helpers.

```typescript
import type { ComputedColumnDef, ColComputedOptions } from "hysteria-orm";

const def: ComputedColumnDef<string> = col.computed<string>("...");
const opts: ColComputedOptions = { databaseName: "full_name" };
```

### When to use which

| Scenario                                                            | Recommendation                                       |
| ------------------------------------------------------------------- | ---------------------------------------------------- |
| The expression must run in the DB (filtering/sorting on the value). | Computed column: the expression is pushed into SQL.  |
| You only need a derived value on read, in TypeScript.               | A getter or application code after `many()`/`one()`. |
| You need the value persisted and indexed by the DB.                 | A real DB column kept in sync with `prepare`.        |
| You need a read-only virtual table over a complex query.            | A view via `defineView`.                             |

## See also

- [Models](/databases/sql/models/define-model)
- [Validation](/databases/sql/models/validation)
- [Query Builder Overview](/databases/sql/query-builder/overview)
