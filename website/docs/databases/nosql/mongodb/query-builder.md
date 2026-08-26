---
title: MongoDB Query Builder
description: "MongoDB query builder: filtering, aggregation, sorting with Hysteria ORM."
keywords: [hysteria-orm, MongoDB query, aggregation, filtering]
sidebar_position: 4
---

# MongoDB Query Builder

The query builder provides a fluent API for building complex MongoDB queries. Access it via `mongo.from(Collection).query()`.

## Basic Usage

```typescript
const users = await mongo
  .from(User)
  .query()
  .where("email", "test@example.com")
  .many();
```

## Filtering

```typescript
const users = await mongo.from(User).query().where("age", "$gte", 18).many();
```

## Sorting

```typescript
const users = await mongo.from(User).query().sort({ name: -1 }).many();
```

## Limiting and Offsetting

```typescript
const users = await mongo.from(User).query().limit(10).offset(5).many();
```

## Combining Filters

```typescript
const users = await mongo
  .from(User)
  .query()
  .where("age", "$gte", 18)
  .sort({ name: 1 })
  .limit(10)
  .many();
```

## whereIn / whereNotIn

```typescript
const users = await mongo
  .from(User)
  .query()
  .whereIn("name", ["Alice", "Bob"])
  .many();
```

## whereNull / whereNotNull

```typescript
const users = await mongo.from(User).query().whereNull("email").many();
```

## Raw Queries

```typescript
const users = await mongo
  .from(User)
  .query()
  .rawWhere({ email: { $exists: false } })
  .many();
```

## Best Practices

- Use `.limit()` and `.sort()` for pagination.
- Use `.rawWhere()` for advanced MongoDB queries.

---

Next: [MongoDB Sessions & Transactions](./sessions.md)
