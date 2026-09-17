---
title: Relations Overview
description: "Define and query model relationships: hasOne, hasMany, belongsTo, manyToMany with eager loading in Hysteria ORM."
keywords:
  [
    hysteria-orm,
    relations,
    hasOne,
    hasMany,
    belongsTo,
    manyToMany,
    eagre loading,
  ]
sidebar_position: 5
---

# Relations Overview

Relations in Hysteria ORM must always be defined outside of `defineModel`, using `defineRelations` + `createSchema`. This separation keeps model files free of cross-model imports and completely eliminates circular dependency errors.

All relation types support configurable load strategies — `join` (single query) or `batched` (one query per relation). The default `auto` strategy picks the right approach based on your query context. See [Relation Load Strategy](./load-strategy) for details.

| Relation     | Description                 | Foreign Key Location    |
| ------------ | --------------------------- | ----------------------- |
| `hasOne`     | One-to-one relationship     | On the related model    |
| `hasMany`    | One-to-many relationship    | On the related model    |
| `belongsTo`  | Inverse of hasOne/hasMany   | On the current model    |
| `manyToMany` | Many-to-many via join table | On the join/pivot table |

:::caution
Loading too many relations can slow down your query. Be selective about what you load.
:::

---

## Defining Relations (`defineRelations` + `createSchema`)

### Models

```typescript
// user.ts
export const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
  },
});

// post.ts
export const Post = defineModel("posts", {
  columns: {
    id: col.increment(),
    title: col.string(),
    userId: col.integer(),
  },
});

// address.ts
export const Address = defineModel("addresses", {
  columns: {
    id: col.increment(),
    street: col.string(),
    city: col.string(),
  },
});

// user_address.ts
export const UserAddress = defineModel("user_addresses", {
  columns: {
    id: col.increment(),
    userId: col.integer(),
    addressId: col.integer(),
  },
});
```

### Relations

```typescript
import { createSchema, defineRelations } from "hysteria-orm";
import { User } from "./user";
import { Post } from "./post";
import { Address } from "./address";
import { UserAddress } from "./user_address";

const UserRelations = defineRelations(
  User,
  ({ hasOne, hasMany, manyToMany }) => ({
    post: hasOne(Post, { foreignKey: "userId" }),
    posts: hasMany(Post, { foreignKey: "userId" }),
    addresses: manyToMany(Address, {
      through: UserAddress,
      leftForeignKey: "userId",
      rightForeignKey: "addressId",
    }),
  }),
);

const PostRelations = defineRelations(Post, ({ belongsTo }) => ({
  user: belongsTo(User, { foreignKey: "userId" }),
}));

const AddressRelations = defineRelations(Address, ({ manyToMany }) => ({
  users: manyToMany(User, {
    through: UserAddress,
    leftForeignKey: "addressId",
    rightForeignKey: "userId",
  }),
}));

export const schema = createSchema(
  { users: User, posts: Post, addresses: Address, user_addresses: UserAddress },
  { users: UserRelations, posts: PostRelations, addresses: AddressRelations },
);
```

### `defineRelations` helpers

The callback receives four typed helpers. Foreign keys are type-checked against the actual model columns:

| Helper       | `foreignKey` type-checked against | Description                    |
| ------------ | --------------------------------- | ------------------------------ |
| `hasOne`     | Target model columns              | One-to-one (FK on the target)  |
| `hasMany`    | Target model columns              | One-to-many (FK on the target) |
| `belongsTo`  | Source model columns              | Inverse of hasOne/hasMany      |
| `manyToMany` | Through model columns             | Many-to-many via a join model  |

---

## Querying Relations

:::important
Always select the foreign key in the relation query builder, otherwise the relation will not be filled.
:::

### Eager Loading

```typescript
// Whole relation object is returned by default
const users = await sql.from(UserModel).load("posts").many();
```

### Relation References

When relations are declared with `defineRelations`, the returned object exposes each relation name as a string literal — the same way `defineModel` exposes column references like `UserModel.id`. This gives you a type-safe, refactor-proof way to pass relations to `.load()`:

```typescript
const UserRelations = defineRelations(UserModel, ({ hasMany }) => ({
  posts: hasMany(PostModel, { foreignKey: "userId" }),
}));

const schema = createSchema({ users: UserModel, posts: PostModel }, { users: UserRelations });

// UserRelations.posts is the string "posts" — same pattern as UserModel.id
const users = await sql.from(UserModel).load(UserRelations.posts).many();
```

Just like column references, the relation reference is a plain string at runtime, so it works anywhere a relation name string is accepted (`.load()`, `.havingRelated()`, etc.).

### Selecting Columns

The foreign key (`userId`) must be selected for relations to work:

```typescript
const users = await sql
  .from(UserModel)
  .load("posts", (qb) => qb.select("id", "title", "userId"))
  .many();
```

### Nested Relations

```typescript
const users = await sql
  .from(UserModel)
  .load("posts", (qb) => qb.load("user"))
  .many();
```

### Filtering on Relations

```typescript
const users = await sql
  .from(UserModel)
  .load("posts", (qb) => qb.where("title", "Hello World"))
  .many();
```

### Limit and Offset

Limit and offset apply to the related models. Adding `limit` or `offset` creates a CTE internally.
This returns limited posts for each user, not just 10 posts total:

```typescript
const users = await sql
  .from(UserModel)
  .load("posts", (qb) => qb.where("title", "Hello World").limit(10).offset(10))
  .many();
```

### Advanced Relation Queries

```typescript
const users = await sql
  .from(UserModel)
  .load("posts", (qb) => qb.selectFunc("max", "id", "maxId").load("user"))
  .many();
```

---

## Self-Referencing Relations

For tree-structured models that reference themselves, use `defineRelations` with the model as its own target

```typescript
import { defineModel, defineRelations, createSchema, col } from "hysteria-orm";

const Category = defineModel("categories", {
  columns: {
    id: col.increment(),
    name: col.string({ nullable: false }),
    parentId: col.integer(),
  },
});

const CategoryRelations = defineRelations(
  Category,
  ({ belongsTo, hasMany }) => ({
    parent: belongsTo(Category, { foreignKey: "parentId" }),
    children: hasMany(Category, { foreignKey: "parentId" }),
  }),
);

export const schema = createSchema(
  { categories: Category },
  { categories: CategoryRelations },
);
export const CategoryModel = schema.categories;
```

---

## Best Practices

- Always define foreign keys explicitly — they are required in all relation methods.
- Use `load` callbacks for nested and filtered relations.
- Always select the foreign key column in relation sub-queries.

---

Next: [Advanced SQL Features](../advanced/cte.md)
