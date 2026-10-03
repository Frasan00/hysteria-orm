---
title: Relations
description: "Define hasOne, hasMany, belongsTo, and manyToMany relations in Hysteria ORM, load them eagerly, choose a load strategy, and filter by related records."
keywords: [hysteria-orm, relations, hasOne, hasMany, belongsTo, manyToMany]
---

# Relations

Relations are defined outside `defineModel`, using `defineRelations` + `createSchema`. Keeping them in a dedicated schema file means your model files never import each other, which avoids circular dependency errors. For the full model + schema walkthrough, see [Programmatic Models (defineModel)](/databases/sql/models/define-model).

Relations support configurable load strategies. The default `auto` strategy picks `join` or `batched` based on your query context; you can force one with `load("relation", { strategy })`. See [Load strategies](#load-strategies).

## Relation helpers

The `defineRelations` callback receives four typed helpers. Foreign keys are type-checked against the relevant model's columns.

| Helper       | Description                 | Foreign key location    |
| ------------ | --------------------------- | ----------------------- |
| `hasOne`     | One-to-one relationship     | On the related model    |
| `hasMany`    | One-to-many relationship    | On the related model    |
| `belongsTo`  | Inverse of hasOne/hasMany   | On the current model    |
| `manyToMany` | Many-to-many via join table | On the join/pivot table |

## Declaring relations

Define your models first, then wire them together in a schema file:

```typescript
import { createSchema, defineRelations } from "hysteria-orm";

const UserRelations = defineRelations(User, ({ hasMany, manyToMany }) => ({
  posts: hasMany(Post, { foreignKey: "userId" }),
  addresses: manyToMany(Address, {
    through: UserAddress,
    leftForeignKey: "userId",
    rightForeignKey: "addressId",
  }),
}));

const PostRelations = defineRelations(Post, ({ belongsTo }) => ({
  user: belongsTo(User, { foreignKey: "userId" }),
}));

export const schema = createSchema(
  { users: User, posts: Post, addresses: Address, user_addresses: UserAddress },
  { users: UserRelations, posts: PostRelations },
);

export const UserModel = schema.users;
```

## Loading relations

Use `.load()` on a model query builder to eagerly fetch relations. Every selected relation is filled on the returned records.

```typescript
const users = await sql.from(User).load("posts").many();
```

:::warning
Always select the relation's foreign key in the relation query builder, otherwise the relation will not be filled.
:::

### Filtering and nested loads

Pass a callback to configure the relation query, including nested loads:

```typescript
const users = await sql
  .from(User)
  .load("posts", (qb) => qb.where("title", "Hello World").load("comments"))
  .many();
```

### Per-parent limit and offset

Limit and offset apply to the related models of each parent (not the total result set). Adding either creates a CTE internally:

```typescript
const users = await sql
  .from(User)
  .load("posts", (qb) => qb.orderBy("id", "desc").limit(10).offset(10))
  .many();
```

## Typed relation references

`defineRelations` returns an object whose keys are the relation names, typed as string literals, the same pattern as `UserModel.id` for columns. Pass them to `.load()` for a refactor-safe, type-checked relation name:

```typescript
const UserRelations = defineRelations(User, ({ hasMany }) => ({
  posts: hasMany(Post, { foreignKey: "userId" }),
}));

// UserRelations.posts is the string "posts"
const users = await sql.from(User).load(UserRelations.posts).many();
```

At runtime the reference is a plain string, so it works anywhere a relation name is accepted, including `havingRelated()`.

## Load strategies

Hysteria ORM chooses how to fetch a relation at runtime, or you can force it with the `strategy` option:

```typescript
// Force a single-query join
await sql.from(User).load("posts", { strategy: "join" }).many();

// Force batched loading, with a relation query builder
await sql
  .from(User)
  .load("posts", (qb) => qb.where("published", true), { strategy: "batched" })
  .many();
```

### `auto` (default)

`auto` inspects the query context and picks the best strategy. It is the right choice for almost every query. Rules are evaluated top to bottom, and the first match wins:

| Condition                                                          | Strategy chosen |
| ------------------------------------------------------------------ | --------------- |
| `hasMany` or `manyToMany` with `limit` or `offset` on the relation | `batched`       |
| Single parent (for example after `.one()`)                         | `join`          |
| `manyToMany` with 10 or fewer parents                              | `join`          |
| Any relation with fewer than 10 parents                            | `join`          |
| Everything else (large parent sets)                                | `batched`       |

### `join`

Fetches the parents and all related records in a single query using `LEFT JOIN`.

- `hasOne` / `hasMany`: joins on the foreign key.
- `belongsTo`: joins on the related model's primary key.
- `manyToMany`: double join through the junction table.

**Pros**

- One round-trip to the database.
- Fastest for single records or small parent sets.

**Cons**

- Can produce large result sets (Cartesian product) for `manyToMany` or large datasets.
- Does not support nested `.load()` calls: if the relation query contains nested loads, loading falls back to `batched`.
- `limit` / `offset` on a `hasMany` relation cannot be expressed correctly in a join, so `auto` never chooses `join` for those cases.

### `batched`

Fetches related records in a separate query per relation using `WHERE foreignKey IN (...)`.

- `hasMany` / `manyToMany` with `limit`/`offset`: uses a CTE with `ROW_NUMBER()` so pagination is applied per parent.

**Pros**

- Safe for large datasets: no Cartesian product risk.
- Supports nested `.load()` calls.
- `limit` / `offset` work correctly per parent.

**Cons**

- Two or more queries per `.load()` call (one for the parents, one per relation).

### Load options

```typescript
type RelationLoadStrategy = "auto" | "join" | "batched";

interface LoadOptions {
  /** @default "auto" */
  strategy?: RelationLoadStrategy;
  /** Separator for JOIN column aliases. @default "__" */
  joinSeparator?: string;
}
```

Every `.load()` overload accepts an optional `LoadOptions` object, with or without a query builder:

```typescript
.load("posts")
.load("posts", (qb) => qb.where("published", true))
.load("posts", { strategy: "batched" })
.load("posts", (qb) => qb.orderBy("id", "desc"), { strategy: "join" })
```

:::tip
When in doubt, leave the strategy as `auto`. It makes the right call based on the actual data and query shape at runtime.
:::

## Filtering by related records

`havingRelated()` filters parents by whether related records exist, without loading the relation. It compiles to an `EXISTS` subquery.

```typescript
// Users with at least one post
await sql.from(User).havingRelated("posts").many();

// Users with a post matching a condition
await sql
  .from(User)
  .havingRelated("posts", (qb) => qb.where("published", true))
  .many();

// Users with more than 5 posts
await sql.from(User).havingRelated("posts", ">", 5).many();

// Users with exactly 3 posts
await sql.from(User).havingRelated("posts", 3).many();
```

The variants differ only in how the subquery is combined with the surrounding `where`:

| Method                                     | Combines with    |
| ------------------------------------------ | ---------------- |
| `havingRelated` / `andHavingRelated`       | `AND EXISTS`     |
| `orHavingRelated`                          | `OR EXISTS`      |
| `notHavingRelated` / `andNotHavingRelated` | `AND NOT EXISTS` |
| `orNotHavingRelated`                       | `OR NOT EXISTS`  |

`andHavingRelated`, `orHavingRelated`, `andNotHavingRelated`, and `orNotHavingRelated` take the same arguments as `havingRelated`. A callback filters the related records; a bare relation checks for at least one; an `operator`/`value` pair compares the related row count.

:::warning
`select` statements inside a `havingRelated` callback are ignored; a `SELECT 1` is used so the query only checks existence or count.
:::

## Syncing many-to-many relations

`sync(relation, leftModel, rightModels, joinTableCustomData?, options?)` inserts one join-table row per right model. Return extra pivot columns from the optional callback:

```typescript
await sql.from(User).sync("addresses", user, addresses);

// Add custom data to each join row
await sql.from(User).sync("addresses", user, addresses, (address, index) => ({
  id: crypto.randomUUID(),
  isPrimary: index === 0,
}));
```

`sync` only inserts; it does not clear existing join rows. To rewrite a pivot set, delete the through rows first (the through model is part of the schema, so you can query it directly) and then sync:

```typescript
await sql.from(UserAddress).where("userId", user.id).delete();
await sql.from(User).sync("addresses", user, addresses);
```

## Clearing pending loads

`clearRelations()` removes every relation load queued on the builder:

```typescript
const query = sql.from(User).load("posts").load("addresses");
query.clearRelations(); // drops both loads

const users = await query.many(); // no relations loaded
```

## Self-referencing relations

For tree-structured models, point a relation at the model itself:

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
```

## See also

- [Programmatic Models (defineModel)](/databases/sql/models/define-model)
- [Reading & Writing Data](/databases/sql/standard-methods/basics)
- [Query Builder](/databases/sql/query-builder/queries)
- [Transactions](/databases/sql/advanced/transactions)
