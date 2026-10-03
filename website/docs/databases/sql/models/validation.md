---
title: Validation
description: Column-level validation for SQL models, plus Zod schema generation from models and views.
keywords:
  [
    hysteria-orm,
    validation,
    validators,
    model validation,
    SQL validation,
    zod,
    schema generation,
  ]
---

# Validation

Hysteria ORM provides a column-level validation system that runs automatically during insert and update operations, and can also be triggered manually. The same model definitions can generate [Zod](https://zod.dev/) schemas for request validation.

## Column-level validation

Add validators to any column using the `validate` option on `col.*()` methods. The option accepts a single `Validator` or an array of `Validator[]`.

```typescript
import { defineModel, col, required, email, minLength } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    email: col.string({ validate: [required, email] }),
    name: col.string({ validate: [required, minLength(2)] }),
    bio: col.text({ validate: maxLength(500) }),
  },
});
```

:::note Null handling
Most built-in validators (except `required`) allow `null` and `undefined` values to pass through without error. This lets you combine nullable columns with optional validation.
:::

## Built-in validators

| Validator               | Signature                                  | Description                                    | Null behavior    |
| ----------------------- | ------------------------------------------ | ---------------------------------------------- | ---------------- |
| `required`              | `(value, ctx) => ValidationResult`         | Rejects `null`, `undefined`, and empty strings | Always validates |
| `minLength(n)`          | `(n: number) => Validator`                 | Minimum string length                          | Allows null      |
| `maxLength(n)`          | `(n: number) => Validator`                 | Maximum string length                          | Allows null      |
| `min(n)`                | `(n: number) => Validator`                 | Minimum numeric value                          | Allows null      |
| `max(n)`                | `(n: number) => Validator`                 | Maximum numeric value                          | Allows null      |
| `pattern(regex)`        | `(regex: RegExp) => Validator`             | Must match regex                               | Allows null      |
| `email`                 | `Validator`                                | Must be valid email format                     | Allows null      |
| `url`                   | `Validator`                                | Must be valid URL                              | Allows null      |
| `enumValidator(values)` | `(values: readonly string[]) => Validator` | Must be one of the allowed values              | Allows null      |

```typescript
import {
  required,
  minLength,
  maxLength,
  min,
  max,
  pattern,
  email,
  url,
  enumValidator,
} from "hysteria-orm";

const Product = defineModel("products", {
  columns: {
    id: col.increment(),
    name: col.string({ validate: required }),
    sku: col.string({ validate: [required, minLength(5), maxLength(50)] }),
    price: col.decimal({ validate: [required, min(0), max(999999.99)] }),
    quantity: col.integer({ validate: min(0) }),
    code: col.string({ validate: pattern(/^[A-Z]{3}-\d{4}$/) }),
    supportEmail: col.string({ validate: email }),
    website: col.string({ validate: url }),
    status: col.string({
      validate: enumValidator(["active", "inactive", "draft"] as const),
    }),
  },
});
```

## Custom validators

Implement the `Validator` type to create custom validators. Validators may be async.

```typescript
import type {
  Validator,
  ValidationResult,
  ValidationContext,
} from "hysteria-orm";

const startsWithUppercase: Validator = (value): ValidationResult => {
  if (value == null) return { valid: true }; // Allow null
  if (typeof value !== "string") {
    return { valid: false, message: "Value must be a string" };
  }
  return /^[A-Z]/.test(value)
    ? { valid: true }
    : { valid: false, message: "Must start with an uppercase letter" };
};

const divisibleBy = (n: number): Validator => {
  return (value): ValidationResult => {
    if (value == null) return { valid: true };
    if (typeof value !== "number") {
      return { valid: false, message: "Value must be a number" };
    }
    return value % n === 0
      ? { valid: true }
      : { valid: false, message: `Must be divisible by ${n}` };
  };
};

const Item = defineModel("items", {
  columns: {
    id: col.increment(),
    title: col.string({ validate: [required, startsWithUppercase] }),
    quantity: col.integer({ validate: [required, divisibleBy(10)] }),
  },
});
```

### Type signatures

```typescript
type ValidationResult = {
  valid: boolean;
  message?: string;
};

type ValidationContext = {
  model: any; // Model class constructor
  column: string; // Column name being validated
  operation: "insert" | "update";
  data: any; // Full data object being validated
};

type Validator = (
  value: any,
  context: ValidationContext,
) => ValidationResult | Promise<ValidationResult>;
```

## Manual validation

Trigger validation manually with the `Model.validate()` static method. It returns `{ valid: true }` on success and throws `ValidationError` on failure.

```typescript
const result = await User.validate({
  email: "test@example.com",
  name: "John",
});
console.log(result); // { valid: true }

try {
  await User.validate({
    email: "invalid-email",
    name: "", // Empty string fails `required`
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.errors);
    // {
    //   email: ["Invalid email"],
    //   name: ["Value is required"]
    // }
  }
}
```

The operation type is inferred from the presence of the primary key: if the primary key is present, validation runs as `"update"`; otherwise it runs as `"insert"`.

## Auto-validation

Validation runs automatically before `insert()` and `update()` operations. If validation fails, the operation is aborted and a `ValidationError` is thrown.

```typescript
await sql.from(User).insert({
  email: "test@example.com",
  name: "John",
});

await sql.from(User).where("id", 1).update({
  name: "Jane",
});
```

## Error handling

Validation errors are collected and thrown as a single `ValidationError`. Access individual field errors through the `errors` property.

```typescript
import { ValidationError } from "hysteria-orm";

try {
  await sql.from(User).insert({
    email: "invalid",
    name: "",
  });
} catch (error) {
  if (error instanceof ValidationError) {
    // error.errors: Record<string, string[]>
    for (const [field, messages] of Object.entries(error.errors)) {
      console.log(`${field}: ${messages.join(", ")}`);
    }
  }
}
```

## Zod integration

Zod is an optional peer dependency. Install it and load it into your `SqlDataSource`:

```bash
npm install zod
```

```typescript
import { z } from "zod";
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  // ... your config
});

sql.loadZodEngine(z);

export { sql };
```

Once loaded, every model created with `defineModel` or `defineView` exposes `toZodSchema()`.

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

const userSchema = User.toZodSchema();

const result = userSchema.safeParse({
  name: "John Doe",
  email: "john@example.com",
  role: "admin",
});
```

### How types map to Zod

| ORM type                                | Zod type              |
| --------------------------------------- | --------------------- |
| `string`, `varchar`, `char`, `text`     | `z.string()`          |
| `uuid`, `ulid`                          | `z.string()`          |
| `integer`, `bigint`, `float`, `decimal` | `z.number()`          |
| `increment`, `bigIncrement`             | `z.number()`          |
| `boolean`                               | `z.boolean()`         |
| `date`, `datetime`, `timestamp`, `time` | `z.date()`            |
| `enum`                                  | `z.enum([...values])` |
| `json`, `jsonb`, `binary`, `blob`       | `z.any()`             |
| computed columns                        | `z.any().optional()`  |

Columns that are **nullable** in the model (the default for non-primary keys) are marked `.nullable()` in the generated schema. `toZodSchema()` returns a typed `z.ZodObject`, so TypeScript infers the shape for `.parse()` and `.safeParse()`.

### Request validation example

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

### Extending schemas

Because `toZodSchema()` returns a standard `ZodObject`, you can extend or refine it with Zod:

```typescript
const registerSchema = User.toZodSchema()
  .extend({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
```

### Zod engine errors

Calling `toZodSchema()` before `sql.loadZodEngine(z)` throws a `HysteriaError` with code `ZOD_ENGINE_NOT_LOADED`.

```typescript
import { HysteriaError } from "hysteria-orm";

try {
  const schema = User.toZodSchema();
} catch (error) {
  if (
    error instanceof HysteriaError &&
    error.code === "ZOD_ENGINE_NOT_LOADED"
  ) {
    // Handle uninitialized engine
  }
}
```

## See also

- [Models](/databases/sql/models/define-model)
- [Views & Computed Columns](/databases/sql/models/views)
- [CRUD Operations](/databases/sql/standard-methods/basics)
