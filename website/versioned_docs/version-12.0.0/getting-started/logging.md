---
title: Logging
description: "Query logging and debugging configuration in Hysteria ORM."
keywords: [hysteria-orm, logging, debugging, query logs]
sidebar_position: 8
---

# Logging

Hysteria ORM provides built-in logging for queries and messages.

:::warning
Logs are **synchronous** by default and add significant overhead. Do not enable logging in production unless you override with an async custom logger. Logging is mainly intended for **debugging** during development.
:::

## Enabling Logs

### Simple boolean (all logs enabled)

Set `DB_LOGS=true` in your environment, or pass `logs: true` in connection options:

```typescript
const sql = await SqlDataSource.connect({
  type: "postgres",
  // ...
  logs: true,
});
```

### Logger Config (granular control)

You can pass a `LoggerConfig` object instead of a boolean to control what gets logged:

```typescript
import { SqlDataSource, type LoggerConfig } from "hysteria-orm";

const sql = await SqlDataSource.connect({
  type: "postgres",
  // ...
  logs: {
    level: "warn", // Only log warnings and errors (default: "info")
    logQueries: false, // Disable SQL query logging (default: true)
  },
});
```

#### LoggerConfig options

| Option         | Type                              | Default  | Description                                            |
| -------------- | --------------------------------- | -------- | ------------------------------------------------------ |
| `level`        | `"info"` \| `"warn"` \| `"error"` | `"info"` | Minimum log level. Messages below this are suppressed. |
| `logQueries`   | `boolean`                         | `true`   | Whether to log SQL/Mongo queries.                      |
| `customLogger` | `CustomLogger`                    | —        | Custom logger instance (see below).                    |

## Custom Logger

You can provide your own logger in two ways:

### Inline via LoggerConfig (recommended)

```typescript
const sql = await SqlDataSource.connect({
  type: "postgres",
  // ...
  logs: {
    level: "info",
    logQueries: true,
    customLogger: {
      info: (msg) => myLogger.info(msg),
      warn: (msg) => myLogger.warn(msg),
      error: (msg) => myLogger.error(msg),
    },
  },
});
```

### Via the static setter

```typescript
import { logger } from "hysteria-orm";

logger.setCustomLogger({
  info: (msg) => {
    /* ... */
  },
  warn: (msg) => {
    /* ... */
  },
  error: (msg) => {
    /* ... */
  },
});
```

### Custom Logger interface

```typescript
type CustomLogger = {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
};
```

:::tip
For production, consider passing an **async logger** (e.g., [pino](https://getpino.io/), [winston](https://github.com/winstonjs/winston)) as a `customLogger` to avoid blocking the event loop with synchronous console calls.
:::

## Log Levels

The `level` option controls the minimum severity of messages that are logged:

- **`"info"`** — Logs everything: info, warnings, and errors (default).
- **`"warn"`** — Logs only warnings and errors.
- **`"error"`** — Logs only errors.

Query logging (controlled by `logQueries`) is independent of the log level.

## Log Output

- Logs include timestamps and color coding for info, warn, and error.
- SQL queries are syntax-highlighted in the terminal.

---

Next: [SQL Introduction](../databases/sql/introduction.md)
