---
title: JSON Columns
description: "JSON column operations and queries in Hysteria ORM for PostgreSQL, MySQL, SQLite databases."
keywords: [hysteria-orm, JSON, JSONB, SQL JSON queries, PostgreSQL]
sidebar_position: 2
---

# JSON Columns

Store and query JSON data directly in your SQL tables. JSON columns are useful for flexible, semi-structured data that doesn't fit a rigid schema.

## Feature Support Matrix

| Feature                                | PostgreSQL | MySQL/MariaDB | SQLite | MSSQL |
| -------------------------------------- | :--------: | :-----------: | :----: | :---: |
| Basic JSON equality (`whereJson`)      |     ✓      |       ✓       |   ✓    |   ✓   |
| Nested property match                  |     ✓      |       ✓       |   ~    |   ✓   |
| Array element match                    |     ✓      |       ✓       |   ~    |   ✓   |
| AND/OR JSON conditions                 |     ✓      |       ✓       |   ~    |   ✓   |
| JSON containment (`whereJsonContains`) |     ✓      |       ✓       |   ✗    |   ✓   |
| JSON IN/NOT IN                         |     ✓      |       ✓       |   ✓    |   ✓   |
| Select JSON column                     |     ✓      |       ✓       |   ✓    |   ✓   |
| Extract JSON values (`selectJson`)     |     ✓      |       ✓       |   ✓    |   ✓   |
| Extract as text (`selectJsonText`)     |     ✓      |       ✓       |   ✓    |   ✓   |
| JSON array length                      |     ✓      |       ✓       |   ✗    |   ✓   |
| JSON object keys                       |     ✓      |       ✓       |   ✗    |   ✗   |

~ = Limited/partial support, see [SQLite JSON Limitations](./sqlite-json-limitations.md)

---

## Basic JSON Filtering

Query for full JSON object equality or by nested properties.

```typescript
// Full object equality
await sql
  .from(User)
  .whereJson("json", { foo: "bar", arr: [1, 2, 3] })
  .one();

// Nested property (works best in PostgreSQL/MySQL)
await sql
  .from(User)
  .whereJson("json", { profile: { info: { age: 42 } } })
  .one();
```

## Logical Operations (AND/OR)

Combine multiple JSON conditions using `andWhereJson` and `orWhereJson`.

```typescript
// AND combination
await sql
  .from(User)
  .whereJson("json", { logic: "A" })
  .andWhereJson("json", { status: "active" })
  .one();

// OR combination
await sql
  .from(User)
  .whereJson("json", { logic: "A" })
  .orWhereJson("json", { logic: "B" })
  .many();
```

> **Note:** Complex AND/OR combinations are only fully supported in PostgreSQL/MySQL. SQLite has limited support. See [SQLite JSON Limitations](./sqlite-json-limitations.md).

## Array and Object Filtering

Query by array elements or nested object properties in JSON columns.

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

## Data Variations

Insert and retrieve various JSON structures, including primitives and null.

```typescript
const variants = [
  { foo: "bar", arr: [1, 2, 3], nested: { a: 1 } },
  { simple: "string value" },
  { number: 12345 },
  { bool: true },
  null,
];
for (const json of variants) {
  await sql.from(User).insert({ ...UserFactory.getCommonUserData(), json });
}
```

## Bulk Operations

Insert many users with different JSON values and query using `whereJson` or `whereJsonIn`.

```typescript
await sql.from(User).insertMany([
  { ...UserFactory.getCommonUserData(), json: { bulk: 1 } },
  { ...UserFactory.getCommonUserData(), json: { bulk: 2 } },
]);

await sql.from(User).whereJson("json", { bulk: 1 }).one();
await sql
  .from(User)
  .whereJsonIn("json", [{ bulk: 1 }, { bulk: 2 }])
  .many();
```

## Advanced JSON Filters

Use containment and negation for advanced filtering (PostgreSQL/MySQL only).

```typescript
// Containment (not supported in SQLite)
await sql
  .from(User)
  .whereJsonContains("json", { arr: [1, 2, 3] })
  .one();
await sql
  .from(User)
  .whereJsonNotContains("json", { arr: [1, 2, 3] })
  .one();

// Negation
await sql.from(User).whereNotJson("json", { foo: "bar" }).one();
```

## Selecting JSON Columns

Select only the JSON column or combine with other columns.

```typescript
// Select only JSON
await sql.from(User).select("json").where("email", "=", user.email).one();

// Select JSON and another column
await sql
  .from(User)
  .select("json", "email")
  .where("email", "=", user.email)
  .one();
```

---

## Extracting JSON Values

The ORM provides powerful methods to extract specific values from JSON columns directly in your queries. All extracted values are available as direct properties on the returned model.

### `selectJson()` - Extract JSON Values

Extract a JSON value at a specific path and return it as JSON. The path format is standardized across all databases.

```typescript
const user = await sql
  .from(User)
  .selectJson("data", "$.user.name", "userName")
  .selectJson("data", "$.settings.theme", "userTheme")
  .one();

console.log(user?.userName); // "John Doe"
console.log(user?.userTheme); // "dark"
```

**Path Format Options:**

- With `$` prefix: `"$.user.name"`
- Without `$` prefix: `"user.name"`
- Array notation: `["user", "name"]`
- Array indices: `"items.0.name"` or `["items", 0, "name"]`

```typescript
// All these are equivalent
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

### `selectJsonText()` - Extract as Text

Extract a JSON value and return it as plain text (unquoted string).

```typescript
const user = await sql
  .from(User)
  .selectJsonText("data", "$.user.email", "email")
  .selectJsonText("data", "user.bio", "biography")
  .one();

console.log(user?.email); // "john@example.com" (string)
console.log(user?.biography); // "Software Developer" (string)
```

**Use cases:**

- When you need string values without JSON formatting
- Extracting text from deeply nested objects
- Getting array elements as strings

```typescript
// Extract array elements as text
const result = await sql
  .from(User)
  .selectJsonText("data", "tags.0", "firstTag")
  .selectJsonText("data", ["tags", 1], "secondTag")
  .one();
```

### `selectJsonArrayLength()` - Get Array Length

Get the length of a JSON array.

> **Note:** Not supported in SQLite

```typescript
const user = await sql
  .from(User)
  .selectJsonArrayLength("data", "$.items", "itemCount")
  .selectJsonArrayLength("data", "user.roles", "roleCount")
  .one();

console.log(user?.itemCount); // 5
console.log(user?.roleCount); // 2
```

**Special paths:**

- Root array: Use `"$"` or `""`
- Nested arrays: Use dot notation

```typescript
// Root array
await sql.from(User).selectJsonArrayLength("data", "$", "totalCount").one();

// Deeply nested
await sql
  .from(User)
  .selectJsonArrayLength("data", "level1.level2.array", "deepArrayCount")
  .one();
```

### `selectJsonKeys()` - Get Object Keys

Get all keys from a JSON object.

> **Note:** Not supported in SQLite or MSSQL

```typescript
const user = await sql
  .from(User)
  .selectJsonKeys("data", "$.settings", "settingKeys")
  .selectJsonKeys("data", "$", "rootKeys")
  .one();

console.log(user?.settingKeys); // ["theme", "fontSize", "autoSave"]
console.log(user?.rootKeys); // ["user", "settings", "metadata"]
```

**PostgreSQL vs MySQL:**

- **PostgreSQL:** Returns a native array
- **MySQL:** Returns a JSON array

### `selectJsonRaw()` - Raw SQL Expressions

Use database-specific JSON expressions for advanced use cases.

```typescript
// PostgreSQL
const result = await sql
  .from(User)
  .selectJsonRaw("data->>'email'", "userEmail")
  .one();

// MySQL
const result = await sql
  .from(User)
  .selectJsonRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '$.email'))", "userEmail")
  .one();
```

### Combining JSON Methods

Mix multiple JSON extraction methods in a single query:

```typescript
const user = await sql
  .from(User)
  .select("email", "name") // Regular columns
  .selectJson("data", "user.profile", "profile")
  .selectJsonText("data", "user.bio", "biography")
  .selectJsonArrayLength("data", "user.roles", "roleCount")
  .selectJsonKeys("data", "settings", "settingKeys")
  .where("email", "user@example.com")
  .one();

// Access all values
console.log(user?.email); // Regular column
console.log(user?.profile); // JSON object
console.log(user?.biography); // String
console.log(user?.roleCount); // Number
console.log(user?.settingKeys); // Array
```

### Using with Raw QueryBuilder

JSON extraction methods also work with raw `sql.from()`:

```typescript
const result = await sql
  .from("users")
  .selectJson("data", "user.name", "userName")
  .selectJsonText("data", "user.email", "userEmail")
  .where("id", 1)
  .one();
```

---

## Cross-Database Notes

### JSON Filtering

- **PostgreSQL/MySQL/MariaDB/MSSQL:** Full support for advanced JSON queries, containment, and deep property matching.
- **SQLite:** Only supports basic equality and simple queries. Advanced features (containment, deep property, array matching) are limited or unsupported. See [SQLite JSON Limitations](./sqlite-json-limitations.md) for details.

### JSON Extraction Methods

- **PostgreSQL/CockroachDB:** Full support for all JSON extraction methods. Uses native JSON operators (`->`, `->>`)
- **MySQL/MariaDB:** Full support with bracket notation for array indices (`$.items[0]`)
- **MSSQL:** Full support except `selectJsonKeys()`. Uses bracket notation for arrays
- **SQLite:** Supports basic extraction (`selectJson`, `selectJsonText`) but not array length or object keys

### Path Format Standardization

The ORM automatically converts your path format to the appropriate database-specific syntax:

- **Input:** `"items.0.name"` or `["items", 0, "name"]`
- **PostgreSQL:** `->'items'->0->>'name'`
- **MySQL/MSSQL:** `$.items[0].name`
- **SQLite:** `$.items.0.name`

This means you write your queries once and they work across all supported databases.

---

## Type Safety

When using `ModelQueryBuilder`, TypeScript will infer the types of your annotations:

```typescript
const user = await sql
  .from(User)
  .selectJson("data", "user.name", "userName")
  .selectJsonText("data", "user.email", "userEmail")
  .selectJsonArrayLength("data", "items", "itemCount")
  .one();

// TypeScript knows these types:
user?.userName; // any
user?.userEmail; // string
user?.itemCount; // number
```

---

See also:

- [CTE](./cte.md)
- [Transactions](./transactions.md)
- [SQLite JSON Limitations](./sqlite-json-limitations.md)
