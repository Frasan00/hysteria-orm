---
title: Model Hooks & Lifecycle
description: "Lifecycle hooks for SQL models: beforeFetch, afterFetch, beforeInsert, beforeUpdate in Hysteria ORM."
keywords: [hysteria-orm, hooks, lifecycle events, model hooks, SQL callbacks]
sidebar_position: 4
---

# Model Hooks & Lifecycle

Hooks allow you to run logic before or after certain model actions. Define them in the `hooks` key of `defineModel`.

:::note
Hooks do not apply to joined models in queries from other models.
:::

```typescript
// Post model hooks won't run here
const users = await sql
  .from(User)
  .join("posts", "posts.userId", "users.id")
  .many();
```

## Available Hooks

| Hook               | Signature                                          | Description                      |
| ------------------ | -------------------------------------------------- | -------------------------------- |
| `beforeFetch`      | `(qb: ModelQueryBuilder) => void \| Promise<void>` | Modify query before fetching     |
| `afterFetch`       | `(data: T[]) => T[] \| Promise<T[]>`               | Transform results after fetching |
| `beforeInsert`     | `(data: Partial<T>) => void \| Promise<void>`      | Modify data before insert        |
| `beforeInsertMany` | `(data: Partial<T>[]) => void \| Promise<void>`    | Modify data before bulk insert   |
| `beforeUpdate`     | `(qb: ModelQueryBuilder) => void \| Promise<void>` | Modify query before update       |
| `beforeDelete`     | `(qb: ModelQueryBuilder) => void \| Promise<void>` | Modify query before delete       |

Where `T` is inferred from your `columns` definition, giving you typed data inside hook callbacks.

## Example: Soft Delete Filtering

```typescript
import { defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    isAdmin: col.boolean(),
    deletedAt: col.datetime(),
  },
  hooks: {
    beforeFetch(qb) {
      qb.whereNull("users.deleted_at");
    },
    beforeInsert(data) {
      data.isAdmin = false;
    },
    afterFetch(data) {
      return data.filter((user) => user.deletedAt === null);
    },
    beforeUpdate(qb) {
      // e.g., add conditions before any update
    },
    beforeDelete(qb) {
      // e.g., add conditions before any delete
    },
  },
});
```

## Ignoring Hooks

You can bypass hooks when needed using the `ignoreHooks` option:

```typescript
// Fetch soft-deleted records by ignoring beforeFetch hook
const allUsers = await sql.from(User).many({ ignoreHooks: ["beforeFetch"] });
```

---

Next: [Model Mixins](./mixins.md)
