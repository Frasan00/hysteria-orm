---
title: Philosophy
description: "Learn the design principles behind Hysteria ORM: type-safe, database-agnostic, and developer-friendly."
keywords: [hysteria-orm, ORM philosophy, TypeScript, database design principles]
sidebar_position: 1
---

# Philosophy

Hysteria ORM is built on a set of guiding principles designed to empower developers working with both SQL and NoSQL databases in TypeScript and JavaScript environments.

## Core Principles

- **Agnostic by Design:**
  Hysteria ORM is not tied to a single database engine or a specific backend framework.

- **TypeScript-First, JavaScript-Friendly:**
  While Hysteria ORM is written in TypeScript and leverages type safety for a better developer experience, it remains accessible to JavaScript users with minimal configuration.

- **Partially Type-Safe by Design:**
  The ORM is intentionally "partially type-safe." This means you get helpful IntelliSense and type hints for model interactions, but you retain the flexibility to bypass strict typing when needed. This balance allows for rapid prototyping and advanced use cases without fighting the type system.

- **Inspired by the Best:**
  The structure and API design are inspired by leading TypeScript ORMs such as TypeORM, Knex (query builder), and Drizzle.

- **Minimalist Model Instances:**
  Model definitions act as metadata, model instances, on the other hand, are lightweight and only contain the columns (for SQL) or properties (for NoSQL) you define. This keeps your business logic clean and focused.

- **Concise and Expressive:**
  Interact with your data using concise, expressive static methods. No unnecessary boilerplate—just clear, direct access to your models and queries.

## Why This Approach?

- **Flexibility:**
  You can "shoot yourself in the foot" if you want to—Hysteria ORM doesn't get in your way. This is ideal for advanced users who need to step outside the guardrails.

- **Developer Experience:**
  The API is designed to be intuitive, discoverable, and enjoyable to use, whether you're building a quick prototype or a large-scale application.

## Example: Minimal Model

```typescript
import { defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    email: col.string(),
  },
});
```

You can then interact with your data using the query API:

```typescript
import { sql } from "hysteria-orm";

// Fetch all users from the database
const users = await sql.from(User).find();
```

---

Hysteria ORM aims to provide the right balance between safety, flexibility, and productivity—so you can focus on building great applications.
