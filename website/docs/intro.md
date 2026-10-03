---
title: Introduction
slug: /
description: "Hysteria ORM is a TypeScript-first ORM for SQL, MongoDB, and Redis with typed models and a unified query API."
keywords:
  [hysteria-orm, TypeScript ORM, SQL ORM, MongoDB, Redis, database, Node.js]
---

# Introduction

**Hysteria ORM** is a TypeScript-first ORM for SQL, MongoDB, and Redis. It gives you one API across database systems, with models and query results inferred from your definitions.

:::tip AI Agent Guide
Building with an AI coding assistant? Read the **[AI Agent Guide](/ai-agent-guide)** for a self-contained brief on bootstrapping a project from scratch and the idiomatic, type-safe best practices for Hysteria ORM.
:::

## Why Hysteria ORM?

- **One API, many databases**: PostgreSQL, MySQL, MariaDB, SQLite, CockroachDB, MSSQL, MongoDB, and Redis.
- **TypeScript-first**: models, columns, relations, and query results are fully inferred, with plain JavaScript support.
- **Framework agnostic**: works with any Node.js framework or as a standalone library.
- **Batteries included**: query builder, relations, migrations, transactions, caching, and a CLI.

## Quick example

```typescript
import {
  SqlDataSource,
  defineModel,
  defineRelations,
  createSchema,
  col,
} from "hysteria-orm";

// Define models
const Post = defineModel("posts", {
  columns: {
    id: col.increment(),
    title: col.string(),
    userId: col.integer(),
  },
});

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string({ nullable: false }),
  },
});

// Define relations with the callback form
const UserRelations = defineRelations(User, ({ hasMany }) => ({
  posts: hasMany(Post, { foreignKey: "userId" }),
}));

// Combine models and relations into a schema
const schema = createSchema(
  { users: User, posts: Post },
  { users: UserRelations },
);

// Initialize the data source with the schema
const db = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  database: "myapp",
  models: schema,
});

await db.connect();

// Query through the model
const users = await db.from(schema.users).orderBy("name").many();
```

## Getting started

- **[Installation](/getting-started/installation)**: install the package and a database driver.
- **[Setup](/getting-started/setup)**: configure your first data source.
- **[SQL ORM Introduction](/databases/sql/introduction)**: connections, configuration, and supported databases.
- **[AI Agent Guide](/ai-agent-guide)**: bootstrap a project with an AI coding assistant.

## See also

- [Models](/databases/sql/models/define-model)
- [Relations](/databases/sql/relations/overview)
- [ORM Patterns](/databases/sql/patterns)
- [CLI Overview](/databases/sql/cli/overview)
