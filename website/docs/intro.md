---
id: intro
title: Introduction
description: "Hysteria ORM is a TypeScript-first ORM supporting SQL, MongoDB, and Redis with type safety and unified APIs."
keywords:
  [
    hysteria-orm,
    TypeScript ORM,
    SQL ORM,
    MongoDB ORM,
    Redis ORM,
    database,
    Node.js,
  ]
slug: /
sidebar_position: 0
---

# Welcome to Hysteria ORM

**Hysteria ORM** is a TypeScript-first ORM for SQL, MongoDB, and Redis. It provides a unified, expressive API for interacting with multiple database systems while maintaining type safety and developer productivity.

:::tip AI Agent Guide
Building with an AI coding assistant? Read the **[AI Agent Guide](/ai-agent-guide)** — a self-contained brief covering how to bootstrap a project from scratch and the idiomatic, type-safe best practices for Hysteria ORM.
:::

## Why Hysteria ORM?

- **Multi-Database Support**: Work with SQL databases (PostgreSQL, MySQL, SQLite, MSSQL, Oracle, CockroachDB), MongoDB, and Redis using a consistent API
- **TypeScript-First and Javascript Friendly**: Built with TypeScript for excellent IDE support and type safety
- **Flexible & Expressive**: Powerful query builder with an intuitive API
- **Framework Agnostic**: Use with any Node.js framework or standalone

## Quick Example

```typescript
import {
  SqlDataSource,
  defineModel,
  col,
  defineRelations,
  createSchema,
} from "hysteria-orm";

// Define a model
const user = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string(),
  },
});

// Define Relations
const userRelations = defineRelations(user, {
  posts: (rel) => rel.hasMany("posts", "userId"),
});

// Initialize data source
const db = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  database: "myapp",
  models: createSchema(
    // models
    {
      user,
    },
    // relations
    {
      user: userRelations,
    },
  ),
});

await db.connect();

// Query your data from the user model
const users = await db.from(User).orderBy("name");

// Or directly from the data source
const usersDirect = await db.models.user.orderBy("name");
```

## Getting Started

Ready to dive in? Start with our guides:

- **[Philosophy](/getting-started/philosophy)** - Understand the design principles
- **[Installation](/getting-started/installation)** - Get Hysteria ORM installed
- **[Setup](/getting-started/setup)** - Configure your first data source
- **[SQL Guide](/databases/sql/introduction)** - Work with SQL databases
- **[MongoDB Guide](/databases/nosql/mongodb/introduction)** - Use MongoDB
- **[Redis Guide](/databases/nosql/redis/introduction)** - Integrate Redis

## Features at a Glance

### SQL Databases

- Type-safe query builder
- Migrations & schema management
- Relations (eager loading, lazy loading)
- Transactions & connection pooling
- CTEs, JSON operations, and advanced queries
- Read replicas support

### MongoDB (Experimental)

- Type-safe document operations
- Aggregation pipeline support
- Session & transaction support
- Change streams

### Redis (Experimental)

- Key-value operations
- Pub/Sub support
- Connection pooling

### Developer Tools

- Unified caching layer
- Environment configuration
- Query logging & performance monitoring
- AdminJS integration (experimental)
- OpenAPI schema generation (experimental)

## Community & Support

- **GitHub**: [github.com/Frasan00/hysteria-orm](https://github.com/Frasan00/hysteria-orm)
- **Issues**: Report bugs or request features on [GitHub Issues](https://github.com/Frasan00/hysteria-orm/issues)
- **NPM**: [npmjs.com/package/hysteria-orm](https://www.npmjs.com/package/hysteria-orm)

## License

Hysteria ORM is [MIT licensed](https://github.com/Frasan00/hysteria-orm/blob/main/LICENSE).

---

**Let's get started!** Head over to [Installation](/getting-started/installation) to begin.
