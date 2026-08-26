---
title: Model Validation
description: "Column-level validation system for SQL models in Hysteria ORM. Built-in validators, custom validators, and auto-validation on insert/update."
keywords: [hysteria-orm, validation, validators, model validation, SQL validation, required, email, url]
sidebar_position: 5
---

# Model Validation

Hysteria ORM provides a column-level validation system that runs automatically during insert and update operations. You can also trigger validation manually when needed.

## Column-Level Validation

Add validators to any column using the `validate` option on `col.*()` methods. The option accepts a single `Validator` or an array of `Validator[]`.

```typescript
import { defineModel, col } from "hysteria-orm";
import { required, email, minLength } from "hysteria-orm/sql/validators";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    email: col.string({ validate: [required, email] }),
    name: col.string({ validate: [required, minLength(2)] }),
    bio: col.text({ validate: maxLength(500) }),
  },
});
```

:::note Null Handling
Most built-in validators (except `required`) allow `null` and `undefined` values to pass through without error. This lets you combine nullable columns with optional validation.
:::

## Built-in Validators

| Validator | Signature | Description | Null behavior |
|-----------|-----------|-------------|---------------|
| `required` | `(value, ctx) => ValidationResult` | Rejects `null`, `undefined`, and empty strings | Always validates |
| `minLength(n)` | `(n: number) => Validator` | Minimum string length | Allows null |
| `maxLength(n)` | `(n: number) => Validator` | Maximum string length | Allows null |
| `min(n)` | `(n: number) => Validator` | Minimum numeric value | Allows null |
| `max(n)` | `(n: number) => Validator` | Maximum numeric value | Allows null |
| `pattern(regex)` | `(regex: RegExp) => Validator` | Must match regex | Allows null |
| `email` | `Validator` | Must be valid email format | Allows null |
| `url` | `Validator` | Must be valid URL | Allows null |
| `enumValidator(values)` | `(values: readonly string[]) => Validator` | Must be one of the allowed values | Allows null |

### Usage Examples

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
} from "hysteria-orm/sql/validators";

const Product = defineModel("products", {
  columns: {
    id: col.increment(),
    // Required field validation
    name: col.string({ validate: required }),

    // String length validation
    sku: col.string({ validate: [required, minLength(5), maxLength(50)] }),

    // Numeric range validation
    price: col.decimal({ validate: [required, min(0), max(999999.99)] }),
    quantity: col.integer({ validate: min(0) }),

    // Pattern validation
    code: col.string({ validate: pattern(/^[A-Z]{3}-\d{4}$/) }),

    // Email validation
    supportEmail: col.string({ validate: email }),

    // URL validation
    website: col.string({ validate: url }),

    // Enum validation
    status: col.string({
      validate: enumValidator(["active", "inactive", "draft"] as const),
    }),
  },
});
```

## Custom Validators

Create custom validators by implementing the `Validator` type:

```typescript
import type { Validator, ValidationResult, ValidationContext } from "hysteria-orm/sql/validators";

// Custom validator function
const startsWithUppercase: Validator = (value, ctx): ValidationResult => {
  if (value == null) return { valid: true }; // Allow null
  if (typeof value !== "string") {
    return { valid: false, message: "Value must be a string" };
  }
  return /^[A-Z]/.test(value)
    ? { valid: true }
    : { valid: false, message: "Must start with an uppercase letter" };
};

// Validator factory (parameterized)
const divisibleBy = (n: number): Validator => {
  return (value, ctx): ValidationResult => {
    if (value == null) return { valid: true };
    if (typeof value !== "number") {
      return { valid: false, message: "Value must be a number" };
    }
    return value % n === 0
      ? { valid: true }
      : { valid: false, message: `Must be divisible by ${n}` };
  };
};

// Use custom validators
const Item = defineModel("items", {
  columns: {
    id: col.increment(),
    title: col.string({ validate: [required, startsWithUppercase] }),
    quantity: col.integer({ validate: [required, divisibleBy(10)] }),
  },
});
```

### Type Signatures

```typescript
type ValidationResult = {
  valid: boolean;
  message?: string;
};

type ValidationContext = {
  model: any;              // Model class constructor
  column: string;          // Column name being validated
  operation: "insert" | "update";
  data: any;               // Full data object being validated
};

type Validator = (
  value: any,
  context: ValidationContext,
) => ValidationResult | Promise<ValidationResult>;
```

## Manual Validation

Trigger validation manually using the `Model.validate()` static method:

```typescript
// Returns { valid: true } on success
const result = await User.validate({
  email: "test@example.com",
  name: "John",
});
console.log(result); // { valid: true }

// Throws ValidationError on failure
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

The `validate()` method automatically detects the operation type based on the presence of the primary key:
- If the primary key is present → `"update"` operation
- Otherwise → `"insert"` operation

## Auto-Validation

Validation runs automatically before `insert()` and `update()` operations. If validation fails, the operation is aborted and a `ValidationError` is thrown.

```typescript
// This will validate before inserting
const user = await sql.from(User).insert({
  email: "test@example.com",
  name: "John",
});

// This will validate before updating
await sql.from(User).where("id", 1).update({
  name: "Jane",
});
```

:::info Zod Integration
For more advanced validation or to generate Zod schemas automatically from your models, see the [Zod Integration](./zod-integration.md) documentation.
:::

## Error Handling

Validation errors are collected and thrown as a single `ValidationError`. Access individual field errors through the `errors` property:

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
    // Output:
    // email: Invalid email
    // name: Value is required
  }
}
```

---

Next: [Model Mixins](./mixins.md)
