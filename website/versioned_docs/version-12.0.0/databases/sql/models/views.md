---
title: Database Views
description: "Work with database views in Hysteria ORM SQL models using defineView function."
keywords:
  [hysteria-orm, database views, SQL views, read-only models, defineView]
sidebar_position: 6
---

# Database Views

Database views are virtual tables based on the result set of a SQL query. They provide a way to encapsulate complex queries and present them as simple tables. Hysteria ORM supports creating and working with database views through the `defineView` function.

## Overview

Views in Hysteria ORM allow you to:

- Create virtual tables based on complex SQL queries
- Encapsulate business logic at the database level
- Provide simplified interfaces for complex data relationships
- Improve query performance through materialized views (when supported by the database)

## Creating Views

### Basic View Definition

Use `defineView` to create a view. It takes a table name and a definition object with `columns` (using the `col` namespace) and a `statement` callback that receives a query builder.

```typescript
import { defineView, col } from "hysteria-orm";

const UserCount = defineView("user_count_view", {
  columns: {
    id: col.integer({ primaryKey: true }),
    total: col.integer(),
  },
  // It is advised to only use selectRaw in views, as it is not type safe and will not be validated by the ORM.
  statement: (qb) => {
    qb.selectRaw("COUNT(*) as total").from("users");
  },
});
```

Query the view like any model:

```typescript
const counts = await sql.from(UserCount).many();
```

### View with Complex Queries

Views can contain complex SQL queries with joins, aggregations, and subqueries:

```typescript
import { defineView, col } from "hysteria-orm";

const UserStats = defineView("user_stats_view", {
  columns: {
    userId: col.integer({ primaryKey: true }),
    userName: col.string(),
    postCount: col.integer(),
    avgRating: col.float(),
  },
  statement: (qb) => {
    qb.selectRaw("users.id as userId")
      .selectRaw("users.name as userName")
      .selectRaw("COUNT(posts.id) as postCount")
      .selectRaw("AVG(posts.rating) as avgRating")
      .from("users")
      .leftJoin("posts", "users.id", "posts.user_id")
      .groupBy("users.id", "users.name")
      .having("post_count", ">", 0);
  },
});

// Query the view
const stats = await sql.from(UserStats).where("postCount", ">", 5).many();
```

### View with Hooks

Views support read-only hooks (`beforeFetch` and `afterFetch`):

```typescript
const ActiveUserSummary = defineView("active_user_summary", {
  columns: {
    id: col.integer({ primaryKey: true }),
    name: col.string(),
    email: col.string(),
  },
  statement: (qb) => {
    qb.select("id", "name", "email").from("users").where("is_active", true);
  },
  hooks: {
    afterFetch(data) {
      return data.filter((row) => row.email !== null);
    },
  },
});
```
