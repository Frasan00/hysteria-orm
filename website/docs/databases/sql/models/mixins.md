---
title: Model Mixins
description: Share reusable column definitions across models by spreading plain objects into defineModel.
keywords:
  [
    hysteria-orm,
    mixins,
    model composition,
    reusable column sets,
    primary key strategy,
  ]
---

# Model Mixins

With `defineModel` you can share column definitions by composing plain objects. Spread shared column sets into a model's `columns` definition to avoid repeating them across models.

## Sharing column definitions

Define reusable column sets as plain objects, then spread them into `defineModel`:

```typescript
import { defineModel, defineRelations, createSchema, col } from "hysteria-orm";

const timestampColumns = {
  createdAt: col.datetime({ autoCreate: true }),
  updatedAt: col.datetime({ autoCreate: true, autoUpdate: true }),
  deletedAt: col.datetime(),
};

const uuidPk = {
  id: col.uuid({ primaryKey: true }),
};

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

// Relations are defined separately — no cross-file circular deps
const PostRelations = defineRelations(Post, ({ belongsTo }) => ({
  author: belongsTo(User, { foreignKey: "userId" }),
}));

export const schema = createSchema(
  { users: User, posts: Post },
  { posts: PostRelations },
);
```

## Common patterns

### Primary key + timestamps

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

### UUID-based models

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

### ULID-based models

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

### Audit columns

```typescript
const auditColumns = {
  createdBy: col.string(),
  updatedBy: col.string(),
};

const Document = defineModel("documents", {
  columns: {
    id: col.uuid({ primaryKey: true }),
    title: col.string({ nullable: false }),
    ...auditColumns,
  },
});
```

## Choosing a primary key strategy

| Strategy           | Column Definition                | Use When                                 |
| ------------------ | -------------------------------- | ---------------------------------------- |
| Auto-increment     | `col.increment()`                | Traditional integer IDs                  |
| Big auto-increment | `col.bigIncrement()`             | Tables expected to exceed 2 billion rows |
| UUID               | `col.uuid({ primaryKey: true })` | Distributed systems, globally unique IDs |
| ULID               | `col.ulid({ primaryKey: true })` | Sortable unique IDs (ordered by time)    |

## See also

- [Models](/databases/sql/models/define-model)
- [Case Conventions](/databases/sql/models/case-conventions)
- [Relations Overview](/databases/sql/relations/overview)
- [CRUD Operations](/databases/sql/standard-methods/basics)
