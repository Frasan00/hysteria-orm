---
title: Model Hooks & Lifecycle
description: "Lifecycle hooks for SQL models: beforeFetch in Hysteria ORM."
keywords: [hysteria-orm, hooks, lifecycle events, model hooks, SQL callbacks]
sidebar_position: 4
---

# Model Hooks & Lifecycle

Hooks allow you to run logic before certain model actions. Define them in the `hooks` key of `defineModel`.

As of 12.0.0, `beforeFetch` is the **only** hook. All write-time hooks (`afterFetch`, `beforeInsert`, `beforeInsertMany`, `beforeUpdate`, `beforeDelete`) were removed: the ORM delegates defaults to the database and keeps the query path free of per-row JavaScript.

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

| Hook          | Signature                                          | Description                  |
| ------------- | -------------------------------------------------- | ---------------------------- |
| `beforeFetch` | `(qb: ModelQueryBuilder) => void \| Promise<void>` | Modify query before fetching |

`beforeFetch` runs once per query, before the SQL is built. It is async-capable and receives the model's query builder so it can mutate conditions, joins, ordering, or anything else the builder supports. A common use is soft-delete filtering:

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
  },
});
```

Every `fetch`, `all`, `one`, and related-query path on this model now filters out soft-deleted rows automatically.

## What Was Removed in 12.0.0

The previous hook surface (`afterFetch`, `beforeInsert`, `beforeInsertMany`, `beforeUpdate`, `beforeDelete`) together with the `ignoreHooks` / `ignoreBeforeUpdateHook` / `ignoreBeforeDeleteHook` options no longer exist. Anything you did in those hooks must move elsewhere:

| Old responsibility                            | v12 replacement                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| Default timestamps / UUIDs on insert          | Database defaults (see [columns](../models/basics.md))                     |
| Mutating data before insert/update            | `column.prepare` (sync) or a database trigger/default                      |
| Filtering soft-deleted rows after fetch       | `beforeFetch` adds the `whereNull("deleted_at")` condition instead        |
| Transforming query results                    | Apply the transform in your application code after `many()`/`one()`        |

---

Next: [Model Mixins](./mixins.md)
