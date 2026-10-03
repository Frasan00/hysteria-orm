---
title: MongoDB Query Builder
description: Build fluent MongoDB filters, sorts, and pagination with mongo.from(Collection).query() in Hysteria ORM.
keywords: [hysteria-orm, MongoDB query, filtering, sorting, pagination]
---

# MongoDB query builder

Start a builder with `mongo.from(Collection).query()` and chain filters, sorting, and pagination. Terminate with `many()`, `one()`, `oneOrFail()`, `count()`, `update()`, or `delete()`.

```typescript
const users = await mongo
  .from(User)
  .query()
  .where("email", "test@example.com")
  .many();
```

## Filtering

`where` accepts either a value or a MongoDB comparison operator:

```typescript
const adults = await mongo.from(User).query().where("age", "$gte", 18).many();
```

Use `whereIn` and `whereNotIn` for list membership:

```typescript
const users = await mongo
  .from(User)
  .query()
  .whereIn("name", ["Alice", "Bob"])
  .many();
```

Use `whereNull` and `whereNotNull` for null checks:

```typescript
const users = await mongo.from(User).query().whereNull("email").many();
```

Use `whereRaw` to provide a raw MongoDB filter:

```typescript
const users = await mongo
  .from(User)
  .query()
  .whereRaw({ email: { $exists: false } })
  .many();
```

## Sorting and pagination

```typescript
const users = await mongo
  .from(User)
  .query()
  .where("age", "$gte", 18)
  .sort({ name: 1 })
  .limit(10)
  .offset(5)
  .many();
```

`sort` also accepts a field name with a direction, an array of fields, or `1`/`-1`. Use `sortById` to sort on `_id`.

## Terminating methods

| Method         | Description                                  |
| -------------- | -------------------------------------------- |
| `many()`       | Returns all matching documents.              |
| `one()`        | Returns the first match, or `null`.          |
| `oneOrFail()`  | Returns the first match or throws when none. |
| `count()`      | Returns the number of matching documents.    |
| `update(data)` | Updates all matching documents.              |
| `delete()`     | Deletes all matching documents.              |

## See also

- [Collection Methods](/databases/nosql/mongodb/methods)
- [Sessions & Transactions](/databases/nosql/mongodb/sessions)
