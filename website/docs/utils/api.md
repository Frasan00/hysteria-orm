---
title: Utilities & Errors
description: Logger configuration, encrypted columns, HysteriaError and ValidationError, and the built-in validators exported by Hysteria ORM.
keywords:
  [
    hysteria-orm,
    logger,
    errors,
    HysteriaError,
    ValidationError,
    validators,
    encryption,
  ]
---

# Utilities & errors

Hysteria ORM exports a small set of runtime utilities and the error and validation primitives used across the library.

## Logger

The default export is a logger class. Configure logging per data source through the `logs` option, which accepts a `boolean` or a `LoggerConfig` object.

```typescript
import { SqlDataSource, logger } from "hysteria-orm";
import type { LoggerConfig } from "hysteria-orm";

const config: LoggerConfig = {
  level: "info",
  logQueries: true,
  customLogger: {
    info: (message) => console.log(message),
    warn: (message) => console.warn(message),
    error: (message) => console.error(message),
  },
};

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  database: "test",
  logs: config,
});
```

Passing `logs: true` uses the defaults: level `info` and query logging enabled.

### Logger API

| Member                        | Description                                              |
| ----------------------------- | -------------------------------------------------------- |
| `logger.info(message)`        | Logs an informational message through the active logger. |
| `logger.warn(message)`        | Logs a warning through the active logger.                |
| `logger.error(message)`       | Logs an error through the active logger.                 |
| `logger.setCustomLogger(cfg)` | Replaces the process-wide custom logger.                 |

### Types

- `LoggerConfig`: `level` (`"info" | "warn" | "error"`), `logQueries` (`boolean`), and an optional `customLogger`.
- `CustomLogger`: an object with `info`, `warn`, and `error` methods that each receive a `string`.

## Errors

Every failure raised by the library is an instance of `HysteriaError`. It carries a `code`, the `caller` that raised it, and an optional wrapped `error`.

```typescript
import { HysteriaError } from "hysteria-orm";

try {
  await sql.from(User).findOneOrFail({ where: { id: 1 } });
} catch (error) {
  if (error instanceof HysteriaError) {
    console.log(error.code); // "ROW_NOT_FOUND"
    console.log(error.caller);
  }
}
```

| Error             | Description                                                           |
| ----------------- | --------------------------------------------------------------------- |
| `HysteriaError`   | Base error with `code`, `caller`, and optional `error`.               |
| `ValidationError` | Extends `HysteriaError` with an `errors` record of field to messages. |

`HysteriaErrorCode` is the union type of every code the library can raise, and is exported for exhaustive handling.

## Validation

Model validation runs through validators. A `Validator` receives the value and a `ValidationContext`, and returns a `ValidationResult` synchronously or as a promise.

```typescript
import type {
  Validator,
  ValidationContext,
  ValidationResult,
} from "hysteria-orm";

const startsWithAdmin: Validator = (
  value,
  _context: ValidationContext,
): ValidationResult => {
  if (typeof value !== "string" || !value.startsWith("admin_")) {
    return { valid: false, message: "Value must start with admin_" };
  }
  return { valid: true };
};
```

The following built-in validators are exported:

| Validator             | Description                                      |
| --------------------- | ------------------------------------------------ |
| `required`            | Rejects `undefined`, `null`, and empty strings.  |
| `minLength(n)`        | Enforces a minimum string length; `null` passes. |
| `maxLength(n)`        | Enforces a maximum string length; `null` passes. |
| `min(value)`          | Enforces a minimum numeric value; `null` passes. |
| `max(value)`          | Enforces a maximum numeric value; `null` passes. |
| `pattern(regex)`      | Matches a string against a regular expression.   |
| `email`               | Accepts a valid email address.                   |
| `url`                 | Accepts a parseable URL.                         |
| `enumValidator(list)` | Restricts a string to a list of allowed values.  |

## Encrypted columns

Encryption is configured on a column through `col.encryption`. Symmetric columns use a shared AES key; asymmetric columns use an RSA public/private key pair.

```typescript
import { defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    ssn: col.encryption.symmetric({ key: process.env.COLUMN_KEY! }),
    token: col.encryption.asymmetric({
      publicKey: process.env.PUBLIC_KEY!,
      privateKey: process.env.PRIVATE_KEY!,
    }),
  },
});
```

Values are encrypted before they are written and decrypted after they are read, using the same key material you provide.

## See also

- [Logging](/getting-started/logging)
- [Validation](/databases/sql/models/validation)
- [Models](/databases/sql/models/define-model)
