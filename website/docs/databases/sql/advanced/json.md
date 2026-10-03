---
title: JSON Columns
description: Store and query semi-structured JSON data across PostgreSQL, MySQL, SQLite, and MSSQL in Hysteria ORM.
keywords:
  [hysteria-orm, json, jsonb, json queries, whereJson, selectJson, SQLite]
---

# JSON columns

Store and query JSON data directly in SQL tables. JSON columns suit flexible, semi-structured data that does not fit a rigid schema. Filtering uses the JSON where-helpers; extraction uses the `selectJson*` family. Both work on `sql.from(Model)` and raw `sql.from("table")` queries.

## Feature support matrix

| Feature                                | PostgreSQL | MySQL/MariaDB | SQLite  | MSSQL |
| -------------------------------------- | :--------: | :-----------: | :-----: | :---: |
| Basic JSON equality (`whereJson`)      |    Yes     |      Yes      |   Yes   |  Yes  |
| Nested property match                  |    Yes     |      Yes      | Partial |  Yes  |
| Array element match                    |    Yes     |      Yes      | Partial |  Yes  |
| AND/OR JSON conditions                 |    Yes     |      Yes      | Partial |  Yes  |
| JSON containment (`whereJsonContains`) |    Yes     |      Yes      |   No    |  Yes  |
| Extract JSON values (`selectJson`)     |    Yes     |      Yes      |   Yes   |  Yes  |
| Extract as text (`selectJsonText`)     |    Yes     |      Yes      |   Yes   |  Yes  |
| JSON array length                      |    Yes     |      Yes      |   No    |  Yes  |
| JSON object keys                       |    Yes     |      Yes      |   No    |  No   |

Partial support is described in [SQLite limitations](#sqlite-limitations).

## Filtering

### Basic filtering

`whereJson` matches an exact JSON value or a nested property. It is an `AND` clause; `orWhereJson` ORs the condition.

```typescript
// Full object equality
await sql
  .from(User)
  .whereJson("json", { foo: "bar", arr: [1, 2, 3] })
  .one();

// Nested property (best in PostgreSQL/MySQL)
await sql
  .from(User)
  .whereJson("json", { profile: { info: { age: 42 } } })
  .one();
```

Combine conditions with `andWhereJson` and `orWhereJson`:

```typescript
await sql
  .from(User)
  .whereJson("json", { logic: "A" })
  .andWhereJson("json", { status: "active" })
  .one();

await sql
  .from(User)
  .whereJson("json", { logic: "A" })
  .orWhereJson("json", { logic: "B" })
  .many();
```

:::note
Complex AND/OR combinations are fully supported in PostgreSQL and MySQL. SQLite has partial support; see [SQLite limitations](#sqlite-limitations).
:::

### Array and object filtering

```typescript
// Array element match (best in PostgreSQL/MySQL)
await sql
  .from(User)
  .whereJson("json", { tags: ["frontend", "typescript"] })
  .one();

// Nested object property
await sql
  .from(User)
  .whereJson("json", { user: { profile: { settings: { theme: "dark" } } } })
  .one();
```

### Containment and negation

Use `whereJsonContains` when the column must contain the given value, and `whereJsonNotContains` for the inverse. Each has `and...` and `or...` variants.

```typescript
await sql
  .from(User)
  .whereJsonContains("json", { arr: [1, 2, 3] })
  .one();

await sql
  .from(User)
  .whereJsonNotContains("json", { arr: [1, 2, 3] })
  .one();

// whereNotJson / andWhereNotJson / orWhereNotJson are aliases for the not-contains family
await sql.from(User).whereNotJson("json", { foo: "bar" }).one();
```

Containment is not supported in SQLite. On MSSQL it is a string-level `CHARINDEX` match rather than a structural JSON comparison.

### Raw JSON filters

`whereJsonRaw` accepts a database-specific expression and optional parameters. Use it for SQLite cases that the portable helpers cannot express.

```typescript
await sql
  .from(User)
  .whereJsonRaw("json_extract(json, '$.foo') = ?", ["bar"])
  .one();
```

### Bulk operations

```typescript
await sql.from(User).insertMany([
  { ...UserFactory.getCommonUserData(), json: { bulk: 1 } },
  { ...UserFactory.getCommonUserData(), json: { bulk: 2 } },
]);

await sql.from(User).whereJson("json", { bulk: 1 }).one();
```

## Selecting JSON columns

```typescript
await sql.from(User).select("json").where("email", "=", user.email).one();

await sql
  .from(User)
  .select("json", "email")
  .where("email", "=", user.email)
  .one();
```

## Extracting JSON values

Extraction methods add the extracted value as a direct property on the returned model. Paths accept `"user.name"`, `"$.user.name"`, or an array of segments, and are normalized to each dialect. All methods have typed `ModelQueryBuilder` overloads.

### `selectJson`

Extract a value at a path and return it as JSON.

```typescript
const user = await sql
  .from(User)
  .selectJson("data", "$.user.name", "userName")
  .selectJson("data", "$.settings.theme", "userTheme")
  .one();

console.log(user?.userName); // "John Doe"
console.log(user?.userTheme); // "dark"
```

```typescript
// Equivalent path formats
await sql.from(User).selectJson("data", "$.profile.age", "age").one();
await sql.from(User).selectJson("data", "profile.age", "age").one();
await sql.from(User).selectJson("data", ["profile", "age"], "age").one();

// Array access
await sql
  .from(User)
  .selectJson("data", "items.0.name", "firstItem")
  .selectJson("data", ["items", 1, "price"], "secondItemPrice")
  .one();
```

### `selectJsonText`

Extract a value as plain, unquoted text.

```typescript
const user = await sql
  .from(User)
  .selectJsonText("data", "$.user.email", "email")
  .selectJsonText("data", "user.bio", "biography")
  .one();

console.log(user?.email); // "john@example.com"
console.log(user?.biography); // "Software Developer"
```

### `selectJsonArrayLength`

Return the length of a JSON array. Not supported in SQLite. Use `"$"` or `""` for the root array.

```typescript
const user = await sql
  .from(User)
  .selectJsonArrayLength("data", "$.items", "itemCount")
  .selectJsonArrayLength("data", "$", "totalCount")
  .one();
```

### `selectJsonKeys`

Return the keys of a JSON object. Not supported in SQLite or MSSQL. PostgreSQL returns a native array; MySQL returns a JSON array.

```typescript
const user = await sql
  .from(User)
  .selectJsonKeys("data", "$.settings", "settingKeys")
  .selectJsonKeys("data", "$", "rootKeys")
  .one();
```

### `selectJsonRaw`

Emit a database-specific JSON expression.

```typescript
// PostgreSQL
await sql.from(User).selectJsonRaw("data->>'email'", "userEmail").one();

// MySQL
await sql
  .from(User)
  .selectJsonRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '$.email'))", "userEmail")
  .one();
```

### Combining methods

```typescript
const user = await sql
  .from(User)
  .select("email", "name")
  .selectJson("data", "user.profile", "profile")
  .selectJsonText("data", "user.bio", "biography")
  .selectJsonArrayLength("data", "user.roles", "roleCount")
  .selectJsonKeys("data", "settings", "settingKeys")
  .where("email", "user@example.com")
  .one();
```

## SQLite limitations

SQLite provides only basic JSON support through its `json()` functions, so several JSON features are partial or unavailable.

### Supported

- `whereJson` with simple objects and exact matches.
- Simple `orWhereJson` combinations.
- `whereNotJson`.
- Basic JSON insertion, retrieval, selection, updates, and null handling.

### Not supported

- `whereJsonContains` and the `whereJsonNotContains` family.
- `whereJson` with nested objects or array elements.
- Complex combinations of `andWhereJson` and `orWhereJson`.
- `selectJsonArrayLength` and `selectJsonKeys`.

```typescript
// Works in SQLite
await sql.from(User).whereJson("json", { type: "A" }).one();
await sql
  .from(User)
  .whereJson("json", { type: "A" })
  .orWhereJson("json", { type: "B" })
  .many();

// Does not work in SQLite
await sql
  .from(User)
  .whereJson("json", { user: { profile: { name: "John" } } })
  .one();
await sql.from(User).whereJsonContains("json", { key: "value" }).one();
```

For unsupported operations, use `whereJsonRaw` with SQLite's `json_extract`, denormalize frequently queried fields into dedicated columns, or filter in the application layer. For complex JSON workloads, prefer PostgreSQL or MySQL.

## Cross-database notes

- Filtering: PostgreSQL, MySQL/MariaDB, and MSSQL support nesting, arrays, and containment. SQLite is limited to equality and simple conditions.
- Extraction: PostgreSQL/CockroachDB use native operators (`->`, `->>`); MySQL/MariaDB and MSSQL use bracket notation; SQLite supports `selectJson` and `selectJsonText` only.
- Paths: `"items.0.name"` and `["items", 0, "name"]` are normalized to `->'items'->0->>'name'` (PostgreSQL), `$.items[0].name` (MySQL/MSSQL), or `$.items.0.name` (SQLite).

## See also

- [Building Queries](/databases/sql/query-builder/queries)
- [SQL Functions, Aggregates & Raw SQL](/databases/sql/query-builder/sql-functions)
- [Transactions](/databases/sql/advanced/transactions)
