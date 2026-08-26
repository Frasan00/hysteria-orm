---
title: SQLite JSON Limitations
description: "SQLite JSON limitations and workarounds in Hysteria ORM."
keywords: [hysteria-orm, SQLite, JSON limitations, database differences]
sidebar_position: 3
---

# SQLite JSON Query Limitations

## Overview

While SQLite provides basic JSON support through the `json()` function, it has several limitations when using the Hysteria ORM's JSON query methods compared to other databases like PostgreSQL or MySQL.

## Known Limitations

### 1. Partial JSON Matching

The following Hysteria ORM methods have limited or no support in SQLite:

- `whereJson()` with nested objects
- `whereJson()` with array elements
- Complex combinations of `andWhereJson()` and `orWhereJson()`

### 2. JSON Containment Operations

These methods are not supported in SQLite:

- `whereJsonContains()`
- `andWhereJsonContains()`
- `orWhereJsonContains()`
- `whereJsonNotContains()`
- `andWhereJsonNotContains()`
- `orWhereJsonNotContains()`

### 3. Complex JSON Queries

Limited support for:

- Complex combinations of `andWhereJson()` and `orWhereJson()`
- Multiple `orWhereJson()` conditions
- Nested object property filtering with `whereJson()`

## Working Features

### Supported Operations

The following Hysteria ORM JSON methods work correctly in SQLite:

- Basic `whereJson()` with simple objects
- Simple `orWhereJson()` combinations
- `whereNotJson()`
- `whereJsonIn()` and `whereJsonNotIn()`
- Basic JSON data insertion and retrieval
- Partial JSON object updates
- Bulk JSON operations with simple equality checks
- JSON column selection and null handling

## Example of Working vs Non-Working API Usage

### Working API Usage

```typescript
// Basic JSON equality
sql.from(User).whereJson("json", { key: "value" });

// Simple OR combination
sql
  .from(User)
  .whereJson("json", { type: "A" })
  .orWhereJson("json", { type: "B" });

// JSON IN operation
sql.from(User).whereJsonIn("json", [{ type: "A" }, { type: "B" }]);
```

### Non-Working API Usage

```typescript
// Nested property filtering (not supported)
sql.from(User).whereJson("json", {
  user: { profile: { name: "John" } },
});

// Array element filtering (not supported)
sql.from(User).whereJson("json", {
  tags: ["frontend", "typescript"],
});

// JSON containment (not supported)
sql.from(User).whereJsonContains("json", { key: "value" });
```

## Recommendations

1. For applications requiring complex JSON querying, consider using PostgreSQL or MySQL
2. Keep JSON queries in SQLite simple and focused on exact matches
3. Consider denormalizing critical JSON data into separate columns if complex querying is needed
4. Use application-level filtering for complex JSON operations when using SQLite

## Alternative Approaches

When working with SQLite and JSON data in Hysteria ORM:

1. Use simple equality checks with `whereJson()` instead of containment operations
2. Implement complex JSON filtering in the application layer
3. Use `whereJsonIn()` for multiple value checks instead of complex OR conditions
4. Consider using raw queries for specific JSON operations when necessary

---

See also:

- [JSON Columns](./json.md)
- [CTE](./cte.md)
- [Transactions](./transactions.md)
