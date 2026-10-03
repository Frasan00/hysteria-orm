---
title: Defining MongoDB Collections
description: Define MongoDB collections in Hysteria ORM with defineCollection and the typed prop namespace.
keywords:
  [hysteria-orm, MongoDB collections, defineCollection, prop, document schema]
---

# Defining MongoDB collections

Define a collection with `defineCollection`, passing the MongoDB collection name and a `properties` object built from the `prop` namespace. The returned class is used with `mongo.from(Collection)`.

```typescript
import { defineCollection, prop } from "hysteria-orm";

const Product = defineCollection("products", {
  properties: {
    name: prop.string(),
    price: prop.number(),
    inStock: prop.boolean(),
    releaseDate: prop.date(),
    metadata: prop.object<{
      tags: string[];
      category: string;
    }>(),
    extra: prop.any(),
  },
});
```

## Property types

| Helper             | TypeScript type | Description          |
| ------------------ | --------------- | -------------------- |
| `prop.string()`    | `string`        | String values        |
| `prop.number()`    | `number`        | Numeric values       |
| `prop.boolean()`   | `boolean`       | Boolean values       |
| `prop.date()`      | `Date`          | Date values          |
| `prop.object<T>()` | `T`             | Typed nested objects |
| `prop.any()`       | `any`           | Any type (untyped)   |

## Notes

- The `id` property is handled automatically and maps to MongoDB `_id`.
- Use `prop.object<T>()` for nested objects and arrays.
- The first argument to `defineCollection` is the MongoDB collection name.

## See also

- [Collection Methods](/databases/nosql/mongodb/methods)
- [MongoDB Query Builder](/databases/nosql/mongodb/query-builder)
