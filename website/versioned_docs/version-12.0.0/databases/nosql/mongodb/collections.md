---
title: Defining MongoDB Collections
description: "Define MongoDB collections with defineCollection and prop namespace in Hysteria ORM."
keywords: [hysteria-orm, MongoDB collections, defineCollection, document schema]
sidebar_position: 2
---

# Defining MongoDB Collections

Collections represent MongoDB collections. Define them using `defineCollection` and the `prop` namespace for property types.

## Example: User Collection

```typescript
import { defineCollection, prop } from "hysteria-orm";

const User = defineCollection("users", {
  properties: {
    name: prop.string(),
    email: prop.string(),
    age: prop.number(),
    isActive: prop.boolean(),
    createdAt: prop.date(),
  },
});
```

## Property Types

The `prop` namespace provides type-safe property definitions:

```typescript
import { defineCollection, prop } from "hysteria-orm";

const Product = defineCollection("products", {
  properties: {
    name: prop.string(), // string values
    price: prop.number(), // numeric values
    inStock: prop.boolean(), // boolean values
    releaseDate: prop.date(), // Date values
    metadata: prop.object<{
      // typed nested objects
      tags: string[];
      category: string;
    }>(),
    extra: prop.any(), // any type (untyped)
  },
});
```

| Helper             | TypeScript Type | Description          |
| ------------------ | --------------- | -------------------- |
| `prop.string()`    | `string`        | String values        |
| `prop.number()`    | `number`        | Numeric values       |
| `prop.boolean()`   | `boolean`       | Boolean values       |
| `prop.date()`      | `Date`          | Date values          |
| `prop.object<T>()` | `T`             | Typed nested objects |
| `prop.any()`       | `any`           | Any type (untyped)   |

## Notes

- The `id` property is handled automatically and maps to MongoDB `_id`.
- You can use nested objects and arrays via `prop.object<T>()`.
- The first argument to `defineCollection` is the MongoDB collection name.

---

Next: [Collection Methods](./methods.md)
