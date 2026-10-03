---
title: Case Conventions
description: How Hysteria ORM maps model property names to database column names and preserves query aliases.
keywords:
  [
    hysteria-orm,
    case conventions,
    camelCase,
    snake_case,
    naming strategy,
    aliases,
  ]
---

# Case Conventions

Hysteria ORM converts between TypeScript model property names and database column names. This page explains the mapping rules and what happens to query aliases.

## Key principle

**Only model columns defined via `col` in `defineModel` are affected by case conventions.** Custom aliases from `select()`, `selectRaw()`, and aggregate functions are **preserved exactly as written**.

## How it works

### Model column mapping

A column definition stores the TypeScript property name (`columnName`) and the database name (`databaseName`, derived with `databaseCaseConvention`):

```typescript
const User = defineModel("users", {
  columns: {
    firstName: col.string(), // columnName: "firstName", databaseName: "first_name"
  },
});
```

When data is retrieved, the ORM looks up `databaseName` in the result and maps it back to `columnName`. Keys that do not match a model column are preserved as-is.

### Custom aliases are preserved

Aliases are not case-converted:

```typescript
// The alias "TotalUsers" is preserved exactly
const result = await sql.from(User).selectRaw("count(*) as TotalUsers").one();

console.log(result.TotalUsers); // Works
console.log(result.totalUsers); // undefined — the case was not converted
```

### Qualified columns

When selecting with a table prefix, only the column name is matched:

```typescript
const user = await sql
  .from(User)
  .select("users.first_name", "users.email_address")
  .one();

console.log(user.firstName); // Mapped from users.first_name
console.log(user.emailAddress); // Mapped from users.email_address
```

## Examples

### Model columns

```typescript
const User = defineModel("users", {
  columns: {
    firstName: col.string(), // databaseName: "first_name"
    emailAddress: col.string(), // databaseName: "email_address"
  },
});

const user = await sql.from(User).select("first_name", "email_address").one();

console.log(user.firstName); // Mapped
console.log(user.emailAddress); // Mapped
```

### Mixed model columns and aliases

```typescript
const result = await sql
  .from(User)
  .select(
    "first_name", // Model column -> result.firstName
    "count(*) as UserCount", // Alias -> preserved
    "max(age) as MaxAge", // Alias -> preserved
  )
  .one();

console.log(result.firstName); // Mapped
console.log(result.UserCount); // Preserved
console.log(result.MaxAge); // Preserved
```

### Aggregate functions

```typescript
const stats = await sql
  .from(User)
  .selectRaw(
    `
    count(*) as TotalUsers,
    avg(age) as AverageAge,
    max(created_at) as LatestSignup
  `,
  )
  .one();

console.log(stats.TotalUsers); // Preserved
console.log(stats.AverageAge); // Preserved
console.log(stats.LatestSignup); // Preserved
```

### JOINs with aliases

```typescript
const posts = await sql
  .from(Post)
  .select(
    "posts.*",
    "users.name as AuthorName", // Preserved
    "users.email as AuthorEmail", // Preserved
  )
  .leftJoin("users", "users.id", "posts.user_id")
  .many();

console.log(posts[0].AuthorName); // Preserved
console.log(posts[0].AuthorEmail); // Preserved
```

## Configuring conventions

Set either convention on the model:

```typescript
const User = defineModel("users", {
  columns: {
    firstName: col.string(),
    lastName: col.string(),
  },
  options: {
    modelCaseConvention: "camelCase", // Model properties: camelCase
    databaseCaseConvention: "snake_case", // DB columns: snake_case
  },
});
// Maps: firstName -> first_name, lastName -> last_name
```

See [Models](/databases/sql/models/define-model) for the full options reference.

## Direction of conversion

- **Query building (model → database)**: `databaseCaseConvention` converts property names to SQL column names.
- **Serialization (database → model)**: only model columns use the stored `databaseName`; aliases are preserved as-is.

`databaseCaseConvention` therefore does not affect alias serialization.

## Best practices

**Yes**: use descriptive, intentional aliases:

```typescript
.select("count(*) as ActiveUserCount")
.select("price * quantity as TotalPrice")
.select("name as display_name")
```

**No**: do not rely on implicit conversion for aliases:

```typescript
// Avoid — hoping for userCount
.select("count(*) as usercount")

// Better — be explicit
.select("count(*) as userCount")
```

**Yes**: when selecting model columns by string, use the database column name:

```typescript
sql.from(User).select("first_name"); // Matches databaseName
sql.from(User).select("firstName"); // Does not match
```

## See also

- [Models](/databases/sql/models/define-model)
- [Model Mixins](/databases/sql/models/mixins)
