---
title: Philosophy
description: "The design principles behind Hysteria ORM: database-agnostic, type-safe where it helps, and lightweight."
keywords: [hysteria-orm, ORM philosophy, TypeScript, design principles]
---

# Philosophy

## Core principles

- **Database-agnostic.** No hard dependency on a single engine or backend framework.
- **TypeScript-first, JavaScript-friendly.** Types improve the developer experience without locking anyone out.
- **Partially type-safe by design.** IntelliSense and type hints guide model interactions, but you can bypass strict typing when a use case calls for it.
- **Models are DTOs.** A model definition is metadata; an instance only carries the columns (SQL) or properties (NoSQL) you declare. No hidden state or behavior.
- **Concise and expressive.** Static methods keep queries direct, with no boilerplate.

## Why this approach

The API is built for flexibility: advanced users can step outside the guardrails, while everyday usage stays intuitive and discoverable.

## Example

```typescript
import { defineModel, col, SqlDataSource } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    email: col.string(),
  },
});

const sql = new SqlDataSource({
  type: "postgres",
  database: "myapp",
  models: { User },
});

await sql.connect();
const users = await sql.from(User).many();
```

## See also

- [Setup & Configuration](/getting-started/setup)
- [Defining Models](/databases/sql/models/define-model)
