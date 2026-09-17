---
title: Model Mixins
description: "Compose reusable model functionality using mixins in Hysteria ORM forDRY, consistent models."
keywords: [hysteria-orm, mixins, model composition, reusable patterns]
sidebar_position: 3
---

# Model Mixins

with `defineModel` you can share column definitions by composing plain objects. Spread shared column sets into your model's `columns` definition for DRY, consistent models.

## Sharing Column Definitions

Define reusable column sets as plain objects, then spread them into `defineModel`:

```typescript
import { defineModel, defineRelations, createSchema, col } from "hysteria-orm";

// Reusable timestamp columns
const timestampColumns = {
  createdAt: col.datetime({ autoCreate: true }),
  updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
  deletedAt: col.datetime(),
};

// Reusable UUID primary key
const uuidPk = {
  id: col.uuid({ primaryKey: true }),
};

// Reusable auto-increment primary key
const incrementPk = {
  id: col.increment(),
};

const User = defineModel("users", {
  columns: {
    ...uuidPk,
    name: col.string(),
    email: col.string({ nullable: false }),
    ...timestampColumns,
  },
});

const Post = defineModel("posts", {
  columns: {
    ...incrementPk,
    title: col.string(),
    body: col.text(),
    userId: col.integer(),
    ...timestampColumns,
  },
});

// Relations defined separately — no cross-file circular deps
const PostRelations = defineRelations(Post, ({ belongsTo }) => ({
  author: belongsTo(User, { foreignKey: "userId" }),
}));

export const schema = createSchema(
  { users: User, posts: Post },
  { posts: PostRelations },
);
```

## Common Patterns

### Primary Key + Timestamps

```typescript
const baseColumns = {
  id: col.increment(),
  createdAt: col.datetime({ autoCreate: true }),
  updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
  deletedAt: col.datetime(),
};

const Category = defineModel("categories", {
  columns: { ...baseColumns, name: col.string(), slug: col.string() },
});

const Tag = defineModel("tags", {
  columns: { ...baseColumns, label: col.string({ nullable: false }) },
});
```

### UUID-based Models

```typescript
const uuidBase = {
  id: col.uuid({ primaryKey: true }),
  createdAt: col.datetime({ autoCreate: true }),
  updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
};

const Product = defineModel("products", {
  columns: {
    ...uuidBase,
    name: col.string({ nullable: false }),
    price: col.float(),
    stock: col.integer(),
  },
});
```

### ULID-based Models

```typescript
const ulidBase = {
  id: col.ulid({ primaryKey: true }),
  createdAt: col.datetime({ autoCreate: true }),
  updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
};

const Event = defineModel("events", {
  columns: {
    ...ulidBase,
    name: col.string(),
    occurredAt: col.datetime(),
  },
});
```

### Audit Columns

```typescript
const auditColumns = {
  createdBy: col.string(),
  updatedBy: col.string(),
};

const Document = defineModel("documents", {
  columns: {
    id: col.uuid({ primaryKey: true }),
    title: col.string({ nullable: false }),
    ...timestampColumns,
    ...auditColumns,
  },
});
```

## Choosing a Primary Key Strategy

| Strategy           | Column Definition                | Use When                                 |
| ------------------ | -------------------------------- | ---------------------------------------- |
| Auto-increment     | `col.increment()`                | Traditional integer IDs                  |
| Big auto-increment | `col.bigIncrement()`             | Tables expected to exceed 2 billion rows |
| UUID               | `col.uuid({ primaryKey: true })` | Distributed systems, globally unique IDs |
| ULID               | `col.ulid({ primaryKey: true })` | Sortable unique IDs (ordered by time)    |

## Type Exports

Field interfaces are still exported for use in your own code:

```typescript
import {
  type TimestampFields,
  type UuidFields,
  type UlidFields,
  type IncrementFields,
  type BigIntFields,
} from "hysteria-orm";

function processTimestamped<T extends TimestampFields>(record: T) {
  console.log(`Created at: ${record.createdAt}`);
  console.log(`Updated at: ${record.updatedAt}`);
}
```

---

## See Also

- [Model Basics](./basics.md) - Column types and relations reference
- [Model Hooks](./hooks.md) - Lifecycle hooks
- [Model Views](./views.md) - Working with database views
- [Standard Methods](../standard-methods/basics.md) - CRUD operations

---

Next: [Model Hooks & Lifecycle](./hooks.md)
