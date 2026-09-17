---
title: Zod Integration
description: "Generate Zod schemas automatically from Hysteria ORM models for request validation and type safety."
keywords: [hysteria-orm, zod, schema generation, validation, type safety, model to zod]
sidebar_position: 9
---

# Zod Integration

Hysteria ORM provides a built-in way to translate your models into [Zod](https://zod.dev/) schemas automatically. This is extremely useful for validating incoming API requests against your database schema without duplicating definitions.

## Setup

Since Zod is an optional peer dependency, you must first install it and load it into your `SqlDataSource`.

```bash
npm install zod
```

In your database configuration file:

```typescript
import { z } from "zod";
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  // ... your config
});

// Load the zod engine
sql.loadZodEngine(z);

export { sql };
```

## Generating Schemas

Once the Zod engine is loaded, every model created via `defineModel` (or `defineView`) exposes a `toZodSchema()` method.

```typescript
import { defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string({ nullable: false }),
    email: col.string({ nullable: false }),
    age: col.integer(),
    isActive: col.boolean({ default: true }),
    role: col.enum(["admin", "user"] as const, { nullable: false }),
    createdAt: col.datetime({ autoCreate: true }),
  },
});

// Generate a Zod schema
const userSchema = User.toZodSchema();

// Now you can use it to validate data
const result = userSchema.safeParse({
  name: "John Doe",
  email: "john@example.com",
  role: "admin",
});
```

## How Types Map to Zod

Hysteria ORM automatically maps column types to their Zod equivalents:

| ORM Type | Zod Type |
|----------|----------|
| `string`, `varchar`, `char`, `text` | `z.string()` |
| `uuid`, `ulid` | `z.string()` |
| `integer`, `bigint`, `float`, `decimal` | `z.number()` |
| `increment`, `bigIncrement` | `z.number()` |
| `boolean` | `z.boolean()` |
| `date`, `datetime`, `timestamp`, `time` | `z.date()` |
| `enum` | `z.enum([...values])` |
| `json`, `jsonb`, `binary`, `blob` | `z.any()` |

### Nullability

Columns that are **nullable** in the ORM definition (default for non-primary keys) will automatically be marked as `.nullable()` in the generated Zod schema.

```typescript
// ORM Definition
email: col.string() // nullable by default

// Generated Zod
email: z.string().nullable()
```

### Precise Typing

The `toZodSchema()` method returns a strictly typed `z.ZodObject`. This means TypeScript will correctly infer the shape of the data when using Zod methods like `.parse()` or `.safeParse()`.

## Advanced Usage

### Request Validation (Express Example)

```typescript
import { UserModel } from "./schema";

app.post("/users", async (req, res) => {
  const schema = UserModel.toZodSchema();
  
  const validation = schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json(validation.error);
  }

  const user = await sql.from(UserModel).insert(validation.data);
  res.json(user);
});
```

### Extending Schemas

Since `toZodSchema()` returns a standard `ZodObject`, you can use all of Zod's transformation methods to extend or modify the schema.

```typescript
const registerSchema = User.toZodSchema().extend({
  password: z.string().min(8),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
```

## Error Handling

If you attempt to call `toZodSchema()` without first calling `sql.loadZodEngine(z)`, the ORM will throw a `HysteriaError` with the code `ZOD_ENGINE_NOT_LOADED`.

```typescript
import { HysteriaError } from "hysteria-orm";

try {
  const schema = User.toZodSchema();
} catch (error) {
  if (error instanceof HysteriaError && error.code === "ZOD_ENGINE_NOT_LOADED") {
    // Handle uninitialized engine
  }
}
```
