---
title: Case Conventions
description: "Configure naming conventions for models and database columns in HysteriaORM - camelCase, snake_case conversion."
keywords:
  [hysteria-orm, case conventions, camelCase, snake_case, naming strategy]
sidebar_position: 3
---

# Case Conventions

Hysteria ORM handles case conversion between your TypeScript model properties and database column names. This document explains how case conventions work and what to expect when querying with aliases.

## Overview

When you define a model with `defineModel`, the ORM automatically maps between:

- **Model property names** (TypeScript) - e.g., `firstName`, `createdAt`
- **Database column names** (SQL) - e.g., `first_name`, `created_at`

## Key Principle

**Only model columns defined via `col` in `defineModel` are affected by case conventions.**

Custom aliases from `select()`, `selectRaw()`, and aggregate functions are **preserved exactly as you specify them**.

## How It Works

### 1. Model Column Mapping

When you define a model column, the column definition stores both the property name and the database name:

```typescript
const User = defineModel("users", {
  columns: {
    firstName: col.string(), // columnName: "firstName", databaseName: "first_name"
  },
});
```

- **columnName**: The TypeScript property name (`firstName`)
- **databaseName**: Converted using `databaseCaseConvention` (`first_name` for snake_case)

When data is retrieved from the database:

- The ORM looks up `databaseName` in the result
- If found, it maps to the model's `columnName`
- If not found (non-model column), the key is preserved as-is

### 2. Custom Aliases (Preserved As-Is)

When you use aliases in queries, they are **not** case-converted:

```typescript
// The alias "TotalUsers" is preserved exactly
const result = await sql.from(User).selectRaw("count(*) as TotalUsers").one();

console.log(result.TotalUsers); // ✅ Works
console.log(result.totalUsers); // ❌ Undefined - case was not converted
```

### 3. Qualified Columns

When selecting columns with table prefixes, only the column name matters:

```typescript
// "users.first_name" -> maps to model's firstName property
const user = await sql
  .from(User)
  .select("users.first_name", "users.email_address")
  .one();

console.log(user.firstName); // ✅ Mapped from users.first_name
console.log(user.emailAddress); // ✅ Mapped from users.email_address
```

## Examples

### Model Columns with Case Conversion

```typescript
const User = defineModel("users", {
  columns: {
    firstName: col.string(), // databaseName: "first_name"
    emailAddress: col.string(), // databaseName: "email_address"
  },
});

// Query using database column names
const user = await sql.from(User).select("first_name", "email_address").one();

console.log(user.firstName); // ✅ Works - mapped from "first_name"
console.log(user.emailAddress); // ✅ Works - mapped from "email_address"
```

### Mixed: Model Columns + Aliases

```typescript
// Model columns are mapped, aliases are preserved
const result = await sql
  .from(User)
  .select(
    "first_name", // Model column -> user.firstName
    "count(*) as UserCount", // Alias -> result.UserCount (preserved)
    "max(age) as MaxAge", // Alias -> result.MaxAge (preserved)
  )
  .one();

console.log(result.firstName); // ✅ Model column (mapped)
console.log(result.UserCount); // ✅ Alias (preserved as-is)
console.log(result.MaxAge); // ✅ Alias (preserved as-is)
```

### Aggregate Functions

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

console.log(stats.TotalUsers); // ✅ Preserved
console.log(stats.AverageAge); // ✅ Preserved
console.log(stats.LatestSignup); // ✅ Preserved
```

### JOINs with Aliases

```typescript
const posts = await sql
  .from(Post)
  .select(
    "posts.*",
    "users.name as AuthorName", // Preserved as AuthorName
    "users.email as AuthorEmail", // Preserved as AuthorEmail
  )
  .leftJoin("users", "users.id", "posts.user_id")
  .many();

console.log(posts[0].AuthorName); // ✅ Alias preserved
console.log(posts[0].AuthorEmail); // ✅ Alias preserved
```

## Why This Design?

### 1. **Explicit is Better Than Implicit**

When you write an alias like `as TotalUsers`, you expect it to be `TotalUsers`, not `totalUsers`. The ORM respects your intent.

### 2. **Flexibility for Different Naming Styles**

You can use any casing for aliases without worrying about convention conflicts:

```typescript
// All of these work as written:
.select("count(*) as total")     // result.total
.select("count(*) as Total")     // result.Total
.select("count(*) as TOTAL")     // result.TOTAL
```

### 3. **API Response Control**

When building APIs, you control the exact shape of responses:

```typescript
// API clients receive exactly what you specify
const user = await sql.from(User).select("id", "name as display_name").one();

// Response: { id: 1, display_name: "John" }
// NOT: { id: 1, displayName: "John" }
```

## Best Practices

### DO: Use Descriptive Aliases

```typescript
// ✅ Clear and intentional
.select("count(*) as ActiveUserCount")
.select("price * quantity as TotalPrice")

// ✅ API-friendly naming
.select("name as display_name")
.select("created_at as signupDate")
```

### DON'T: Rely on Implicit Case Conversion

```typescript
// ❌ Avoid - relies on convention
.select("count(*) as usercount")  // Hoping for userCount

// ✅ Better - be explicit
.select("count(*) as userCount")  // Gets userCount
```

### DO: Match Database Names for Model Columns

When selecting model columns, use the actual database column name:

```typescript
const User = defineModel("users", {
  columns: {
    firstName: col.string(), // databaseName: "first_name"
  },
});

// ✅ Use database name
sql.from(User).select("first_name");

// ❌ Don't use model property name
sql.from(User).select("firstName"); // Won't match
```

## Migration Guide

If you were relying on implicit case conversion for aliases, update your queries:

```typescript
// Before (relied on implicit conversion)
.select("count(*) as totalusers")  // Became result.totalUsers

// After (use desired casing explicitly)
.select("count(*) as totalUsers")  // Becomes result.totalUsers
```

## Related Static Properties

While `databaseCaseConvention` still exists for query building (Model → Database direction), it does **not** affect serialization (Database → Model direction) for aliases.

- **Query Building** (Model → Database): `databaseCaseConvention` converts property names to SQL column names
- **Serialization** (Database → Model): Only model columns use stored `databaseName`; aliases are preserved as-is

---

Next: [Instance Methods](./instance-methods.md)
