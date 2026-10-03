---
title: SQL Functions, Aggregates & Raw SQL
description: "Select helpers, SQL functions with inferred return types, aggregate helpers, raw expressions, and portable sqlFunc tokens in Hysteria ORM."
keywords:
  [
    hysteria-orm,
    SQL functions,
    selectFunc,
    selectRaw,
    aggregates,
    sqlFunc,
    SqlFuncNode,
  ]
---

# SQL functions, aggregates & raw SQL

This page is the canonical reference for shaping the `SELECT` clause: choosing columns, applying SQL functions with inferred return types, and using raw expressions or portable `sqlFunc` tokens. Filtering, joins, grouping, and the rest of the clause API live in [Building Queries](/databases/sql/query-builder/queries).

## Selecting columns

`select` picks model columns and tracks them for type inference. It supports plain names, `table.column` references, `*`, `table.*`, and `[column, alias]` tuples.

```typescript
// Plain columns
const users = await sql.from(User).select("id", "name", "email").many();

// Qualified columns are useful with joins
const posts = await sql
  .from(Post)
  .select("posts.title", "posts.content")
  .leftJoin("users", "users.id", "posts.userId")
  .many();

// Aliases via tuples
const aliased = await sql
  .from(User)
  .select(["name", "userName"], ["age", "userAge"])
  .many();
aliased[0].userName; // string, inferred from "name"
aliased[0].userAge; // number, inferred from "age"
```

To select columns that are not part of the model (computed expressions, unrelated tables, raw SQL), use `selectRaw` instead:

```typescript
await sql.from(User).selectRaw<{ metadata: string }>("metadata").many();
```

:::tip Type-safe column references
`defineModel` exposes each column as a static reference that resolves to a qualified `"table.column"` string. It works anywhere a column is accepted.

```typescript
const users = await sql
  .from(User)
  .select(User.id, User.name)
  .where(User.isActive, true)
  .orderBy(User.id, "desc")
  .many();
```

See [Type-Safe Column References](/databases/sql/models/define-model#type-safe-column-references) for the full guide.
:::

:::warning Wildcards reduce type inference
`select("*")` returns the full model type, but combining `*` with aliased tuples drops the alias types from the result. Prefer selecting explicit columns for maximum safety.

```typescript
// Alias "aliasedName" is not reflected in the type
await sql.from(User).select("*", ["name", "aliasedName"]).one();

// Full type inference for every selection
await sql.from(User).select("id", "name", ["name", "aliasedName"]).one();
```

When selecting with joins, columns from joined tables are filtered out unless explicitly aliased:

```typescript
const posts = await sql
  .from(Post)
  .select("posts.*", ["users.name", "authorName"])
  .leftJoin("users", "users.id", "posts.userId")
  .many();
```

:::

### Select type inference

| Selection                  | Return type                              |
| -------------------------- | ---------------------------------------- |
| No `select()`              | `ModelWithoutRelations<T>` (all columns) |
| `select("*")`              | `ModelWithoutRelations<T>` (all columns) |
| `select("col1", "col2")`   | `{ col1: Type1; col2: Type2 }`           |
| `select(["col", "alias"])` | `{ alias: ColType }`                     |
| `select("table.col")`      | `{ col: ColType }`                       |
| `selectRaw<T>(...)`        | Merges `T` with the current selection    |

Multiple `select()` calls accumulate at runtime, but TypeScript reflects the type of the last call. Include every column in a single call when you need all of them typed.

## `selectFunc`

`selectFunc(sqlFunction, column, alias)` applies a SQL function to a column and infers the result type from the function name. Use `"*"` as the column for `count`.

```typescript
selectFunc(sqlFunction, column, alias);
```

```typescript
const stats = await sql
  .from(User)
  .selectFunc("count", "*", "totalUsers") // totalUsers: number
  .selectFunc("avg", "age", "avgAge") // avgAge: number
  .selectFunc("upper", "name", "upperName") // upperName: string
  .one();
```

### Inferred return types

| Functions                                                                              | Return type |
| -------------------------------------------------------------------------------------- | ----------- |
| `count`, `sum`, `avg`, `min`, `max`, `length`, `abs`, `round`, `ceil`, `floor`, `sqrt` | `number`    |
| `upper`, `lower`, `trim`                                                               | `string`    |
| Any other function name (for example `coalesce`)                                       | `any`       |

### Aggregates in a select

```typescript
const salesByUser = await sql
  .from(Post)
  .select("userId")
  .selectFunc("count", "*", "postCount")
  .selectFunc("max", "id", "latestPostId")
  .groupBy("userId")
  .orderBy("postCount", "desc")
  .many();
```

For a single aggregate value, the `getCount`, `getMax`, `getMin`, `getAvg`, and `getSum` helpers are shorter and return a number directly. See [Aggregates](/databases/sql/query-builder/queries#aggregates) in Building Queries.

```typescript
const count = await sql.from(User).where("status", "active").getCount();
```

## `selectRaw`

Use `selectRaw` for expressions that `selectFunc` cannot express, such as `ROUND(col, 2)`, `COALESCE`, `CASE`, date math, and database-specific functions. Pass a type parameter for a typed result.

```typescript
const result = await sql
  .from(Product)
  .selectRaw<{
    discountedPrice: number;
    accountAge: number;
  }>(
    "price * (1 - discount_rate) as discountedPrice, DATEDIFF(NOW(), created_at) as accountAge",
  )
  .many();

result[0].discountedPrice; // number
```

### CAST expressions

The type after `AS` inside `CAST()` is recognized as a SQL type, not an alias.

```typescript
await sql.from(User).selectRaw("CAST(age AS VARCHAR) as ageString").one();
```

:::tip Prefer parameterized `selectRaw`
`selectRaw` interpolates the statement verbatim. Never build it from untrusted input; use `?` bindings where the API allows them.
:::

## Selecting JSON values

These methods extract values from JSON columns. Use `selectJson` for JSON output, `selectJsonText` for text, `selectJsonArrayLength` for array length, and `selectJsonKeys` for object keys. `selectJsonRaw` takes database-specific SQL and bypasses path standardization. Paths accept `"user.name"`, `"$.user.name"`, or an array of segments. JSON filtering is covered in [JSON Columns](/databases/sql/advanced/json).

```typescript
const user = await sql
  .from(User)
  .selectJson("data", "$.user.name", "userName")
  .one();

await sql.from(User).selectJsonText("data", "$.user.email", "email").one();
await sql.from(User).selectJsonArrayLength("data", "$.tags", "tagCount").one();
await sql.from(User).selectJsonKeys("data", "$", "topLevelKeys").one();

await sql.from(User).selectJsonRaw("data->>'nickname'", "nickname").one();
```

Pass explicit `<ValueType, Alias>` parameters on a raw query when the column is not typed JSON:

```typescript
const typed = await sql
  .from("users")
  .selectJson<string, "userName">("data", "$.user.name", "userName")
  .one();
typed?.userName; // string
```

## Portable expressions with `sqlFunc`

`sqlFunc` is a global namespace of portable expressions. Pass a token instead of a per-dialect string and the interpreter renders the correct syntax.

```typescript
import { sqlFunc } from "hysteria-orm";

sqlFunc.uuid(); // UUID generator
sqlFunc.now(); // current timestamp
sqlFunc.currentTimestamp(); // current timestamp
```

| Token                        | PostgreSQL / CockroachDB | MySQL / MariaDB     | SQLite                       | MSSQL               |
| ---------------------------- | ------------------------ | ------------------- | ---------------------------- | ------------------- |
| `sqlFunc.uuid()`             | `gen_random_uuid()`      | `(uuid())`          | `lower(hex(randomblob(16)))` | `NEWID()`           |
| `sqlFunc.now()`              | `now()`                  | `now()`             | `current_timestamp`          | `current_timestamp` |
| `sqlFunc.currentTimestamp()` | `current_timestamp`      | `current_timestamp` | `current_timestamp`          | `current_timestamp` |

### Column defaults in migrations

Use a token in the migration Schema DSL so the database generates the value:

```typescript
import { Schema, sqlFunc } from "hysteria-orm";

const schema = new Schema("postgres");

await schema.createTable("users", (table) => {
  table.uuid("id").primaryKey().default(sqlFunc.uuid());
  table.datetime("created_at").default(sqlFunc.currentTimestamp());
});
```

:::warning MySQL uuid defaults
MySQL rejects a volatile-expression default on `ALTER TABLE ... ADD COLUMN` and a single multi-clause `ALTER` that both adds the column and modifies its default. Hysteria ORM emits `default (uuid())` on `CREATE TABLE` only and strips it from the `ALTER ADD` path. Rows written through the ORM still get a uuid on every dialect because `col.uuid()` generates it in JavaScript; rows inserted outside the ORM rely on the database default and will be `NULL` for uuid columns added by `ALTER`.
:::

### Expression values and predicate values

A token can replace a bound value in `update()`, `where()`, or `having()`:

```typescript
await sql.from(User).update({ lastLoginAt: sqlFunc.now() });

await sql.from(User).where("created_at", "<", sqlFunc.now()).many();
await sql.from(User).where("id", "!=", sqlFunc.uuid()).many();
```

Tokens render inline, so they do not consume a placeholder and neighboring bindings keep their positions.

### Custom tokens

Register a dialect-specific renderer with `registerSqlFuncRenderer`, or a fallback for every dialect with `"*"`. Return `undefined` to defer to the next renderer and finally to the built-in tokens. Unregistered names render as `fn(args)`.

```typescript
import { registerSqlFuncRenderer, SqlFuncNode } from "hysteria-orm";

registerSqlFuncRenderer("postgres", (node) =>
  node.fn === "$tenant" ? "current_setting('app.tenant')" : undefined,
);

await sql
  .from(Order)
  .where("tenant_id", "=", new SqlFuncNode("$tenant"))
  .many();

// Unknown functions render as a regular call
new SqlFuncNode("coalesce", ["nickname", "name"]); // coalesce('nickname', 'name')
```

## Database compatibility

:::warning Dialect-specific function limitations

| Function | Limitation                                                        |
| -------- | ----------------------------------------------------------------- |
| `ceil`   | SQLite has no native `CEIL`; MSSQL uses `CEILING()` automatically |
| `floor`  | SQLite has no native `FLOOR`                                      |
| `sqrt`   | CockroachDB requires a `FLOAT` column, not `INT`                  |
| `length` | MSSQL uses `LEN()`, which does not count trailing spaces          |

:::

## See also

- [Query Builder Overview](/databases/sql/query-builder/overview)
- [Building Queries](/databases/sql/query-builder/queries)
- [JSON Columns](/databases/sql/advanced/json)
- [Type-Safe Column References](/databases/sql/models/define-model#type-safe-column-references)
