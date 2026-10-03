---
title: Logging
description: "Enable query logging, pick a log level, and plug in a custom logger in Hysteria ORM."
keywords: [hysteria-orm, logging, debugging, custom logger]
---

# Logging

Hysteria ORM logs queries and internal messages.

:::warning
Logging is disabled by default. When enabled it is synchronous and adds significant overhead, so keep it for development or supply an async custom logger. Enable it with `logs` or `DB_LOGS=true`.
:::

## Enable logs

Pass `logs: true` to log everything at the default level:

```typescript
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres",
  logs: true,
});
await sql.connect();
```

Pass a `LoggerConfig` for granular control:

```typescript
import { SqlDataSource, type LoggerConfig } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres",
  logs: {
    level: "warn",
    logQueries: false,
  } satisfies LoggerConfig,
});
```

### LoggerConfig options

| Option         | Type                              | Default  | Description                                            |
| -------------- | --------------------------------- | -------- | ------------------------------------------------------ |
| `level`        | `"info"` \| `"warn"` \| `"error"` | `"info"` | Minimum log level. Messages below this are suppressed. |
| `logQueries`   | `boolean`                         | `true`   | Whether to log SQL/Mongo queries.                      |
| `customLogger` | `CustomLogger`                    | None     | Custom logger instance.                                |

## Log levels

- `"info"`: info, warnings, and errors (default).
- `"warn"`: warnings and errors.
- `"error"`: errors only.

`logQueries` is independent of `level`.

## Custom logger

Provide a logger inline through `logs.customLogger`:

```typescript
const sql = new SqlDataSource({
  type: "postgres",
  logs: {
    customLogger: {
      info: (msg) => myLogger.info(msg),
      warn: (msg) => myLogger.warn(msg),
      error: (msg) => myLogger.error(msg),
    },
  },
});
```

Or set it globally:

```typescript
import { logger } from "hysteria-orm";

logger.setCustomLogger({
  info: (msg) => myLogger.info(msg),
  warn: (msg) => myLogger.warn(msg),
  error: (msg) => myLogger.error(msg),
});
```

The interface is:

```typescript
type CustomLogger = {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
};
```

:::tip
For production, pass an async logger such as [pino](https://getpino.io/) or [winston](https://github.com/winstonjs/winston) to avoid blocking the event loop with synchronous console calls.
:::
