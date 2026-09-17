---
title: TypeScript Usage
description: "TypeScript configuration and type safety features in Hysteria ORM."
keywords: [hysteria-orm, TypeScript, type safety, tsconfig, generics]
sidebar_position: 5
---

# TypeScript Usage

Hysteria ORM is built with TypeScript in mind, providing full type safety for models, queries, and migrations.

## Model Typing

All models and collections are strongly typed. Example:

```typescript
import { defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    name: col.string(),
  },
});
```

## Query Type Inference

Query results are automatically typed based on your model definition:

```typescript
import { defineModel, SqlDataSource, col, createSchema } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.bigIncrement(),
    name: col.string(),
  },
});

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  database: "myapp",
  models: createSchema({ User }),
});

const users = await sql.from(User); // { id: number; name: string }[]
const users2 = await sql.from(User).select("id"); // { id: number; }[]
const users3 = await sql.from(User).select("id", ["name", "superName"]); // { id: number; superName: string }[]
```

---

Next: [JavaScript Usage](./javascript.md)
