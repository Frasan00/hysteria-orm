---
title: Query Observers
description: "Datasource-level query middleware for intercepting and monitoring all SQL queries."
keywords: [hysteria-orm, observers, query middleware, query hooks, monitoring, logging]
sidebar_position: 7
---

# Query Observers

Query observers provide datasource-level query middleware, allowing you to intercept **all queries** that pass through the `SqlDataSource`. Unlike model hooks, which are model-specific, observers intercept every query regardless of which model (or table) is being queried.

## Overview

Observers are a powerful mechanism for:

- **Logging and monitoring** - Track all database queries for debugging or auditing
- **Performance analysis** - Measure query execution times and identify slow queries
- **Error tracking** - Capture and log all database errors centrally
- **Query analytics** - Collect statistics about query patterns and frequency
- **Custom instrumentation** - Integrate with APM tools like DataDog, New Relic, etc.

## Observers vs Hooks

Understanding the difference between observers and hooks is important for choosing the right tool:

| Feature | Observers | Hooks |
|---------|-----------|-------|
| **Scope** | Datasource-level (ALL queries) | Model-level (specific model only) |
| **Operations** | Any SQL statement | Specific lifecycle events |
| **Use case** | Cross-cutting concerns | Model-specific business logic |
| **Context** | Raw SQL, params, duration | Model instances, relations |

### When to Use Observers

Use observers when you need to intercept **all queries** across your application:

```typescript
// This observer will fire for EVERY query
sql.addObserver({
  onBeforeQuery: (ctx) => {
    // Fires for User queries, Post queries, raw queries, etc.
    console.log("Query:", ctx.sql);
  },
});
```

### When to Use Hooks

Use hooks when you need model-specific logic:

```typescript
class User extends Model {
  static hooks = {
    beforeFetch: async (user) => {
      // Only fires for User model fetches
      user.lastAccessedAt = new Date();
    },
  };
}
```

## API Reference

### `sql.addObserver(observer)`

Adds a query observer to the datasource. Returns `this` for method chaining.

```typescript
addObserver(observer: QueryObserver): this
```

**Parameters:**
- `observer` - A `QueryObserver` object with optional hook methods

**Returns:**
- The `SqlDataSource` instance (chainable)

### `QueryObserver` Interface

```typescript
interface QueryObserver {
  onBeforeQuery?(ctx: QueryContext): Promise<void> | void;
  onAfterQuery?(ctx: QueryContextWithDuration): Promise<void> | void;
  onQueryError?(ctx: QueryContext & { error: Error }): Promise<void> | void;
}
```

All hooks are optional - you only need to implement the ones you need.

### `QueryContext` Type

```typescript
interface QueryContext {
  sql: string;           // The raw SQL query string
  params: any[];         // Query parameters
  model?: any;           // Model class (if applicable)
  operation?: Operation; // Derived operation type
  timestamp: number;     // Query start timestamp (ms)
}
```

### `QueryContextWithDuration` Type

```typescript
type QueryContextWithDuration = QueryContext & {
  duration: number;  // Execution time in milliseconds
  result?: any;      // Query result (optional)
};
```

### `Operation` Type

```typescript
type Operation = "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "OTHER";
```

The `operation` field is automatically derived from the SQL statement by analyzing the query string.

## Usage Examples

### Basic Logging Observer

Log all queries before and after execution:

```typescript
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  database: "mydb",
});

// Add a logging observer
sql.addObserver({
  onBeforeQuery: (ctx) => {
    console.log(`[SQL] ${ctx.operation}: ${ctx.sql}`);
  },
  onAfterQuery: (ctx) => {
    console.log(`[SQL] Completed in ${ctx.duration}ms`);
  },
});

await sql.connect();

// All subsequent queries will be logged
const users = await sql.from("users").many();
// Output:
// [SQL] SELECT: SELECT * FROM users
// [SQL] Completed in 5ms
```

### Query Timing Observer

Track slow queries for performance monitoring:

```typescript
const SLOW_QUERY_THRESHOLD = 100; // ms

sql.addObserver({
  onAfterQuery: (ctx) => {
    if (ctx.duration > SLOW_QUERY_THRESHOLD) {
      console.warn(
        `Slow query detected (${ctx.duration}ms): ${ctx.sql.substring(0, 100)}...`
      );
    }
  },
});
```

### Error Tracking Observer

Centralize error logging for all database operations:

```typescript
sql.addObserver({
  onQueryError: (ctx) => {
    errorTracker.captureException(ctx.error, {
      tags: { operation: ctx.operation },
      extra: {
        sql: ctx.sql,
        params: ctx.params,
        model: ctx.model?.name,
      },
    });
  },
});
```

### Analytics Observer

Collect query statistics:

```typescript
const stats = {
  queries: 0,
  totalDuration: 0,
  byOperation: {} as Record<string, { count: number; totalTime: number }>,
};

sql.addObserver({
  onAfterQuery: (ctx) => {
    stats.queries++;
    stats.totalDuration += ctx.duration;

    const op = ctx.operation || "OTHER";
    if (!stats.byOperation[op]) {
      stats.byOperation[op] = { count: 0, totalTime: 0 };
    }
    stats.byOperation[op].count++;
    stats.byOperation[op].totalTime += ctx.duration;
  },
});

// Get average query time
const avgTime = stats.totalDuration / stats.queries;
console.log(`Average query time: ${avgTime.toFixed(2)}ms`);
```

### Multiple Observers (Chaining)

You can add multiple observers by chaining `addObserver` calls:

```typescript
sql
  .addObserver({
    onBeforeQuery: (ctx) => {
      console.log(`Starting: ${ctx.operation}`);
    },
  })
  .addObserver({
    onAfterQuery: (ctx) => {
      console.log(`Finished: ${ctx.operation} in ${ctx.duration}ms`);
    },
  })
  .addObserver({
    onQueryError: (ctx) => {
      console.error(`Query failed: ${ctx.error.message}`);
    },
  });
```

Observers are executed in the order they were added.

### Complete Example

A comprehensive observer for production monitoring:

```typescript
import { SqlDataSource, type QueryContext, type QueryContextWithDuration } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  database: "mydb",
});

// Production-ready query observer
sql.addObserver({
  onBeforeQuery: (ctx: QueryContext) => {
    // Store query start time for correlation
    (ctx as any).__queryStart = Date.now();

    // Log query for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log(`[DB] ${ctx.operation} ${ctx.sql.substring(0, 80)}...`);
    }
  },

  onAfterQuery: (ctx: QueryContextWithDuration) => {
    // Log slow queries in production
    if (ctx.duration > 100 && process.env.NODE_ENV === "production") {
      logger.warn({
        msg: "Slow query detected",
        sql: ctx.sql,
        duration: ctx.duration,
        operation: ctx.operation,
        model: ctx.model?.name,
      });
    }

    // Send metrics to monitoring service
    metrics.timing("db.query.duration", ctx.duration);
    metrics.increment(`db.query.${ctx.operation?.toLowerCase()}`);
  },

  onQueryError: (ctx: QueryContext & { error: Error }) => {
    // Log all database errors
    logger.error({
      msg: "Database query failed",
      error: ctx.error.message,
      sql: ctx.sql,
      operation: ctx.operation,
    });

    // Send to error tracking service
    errorReporter.report(ctx.error, {
      context: {
        sql: ctx.sql,
        params: ctx.params,
        operation: ctx.operation,
      },
    });
  },
});

await sql.connect();
```

## Important Notes

### Observer Hooks Are Optional

All hooks in a `QueryObserver` are optional. You only implement the hooks you need:

```typescript
// Only implement onAfterQuery
sql.addObserver({
  onAfterQuery: (ctx) => {
    console.log(`Query took ${ctx.duration}ms`);
  },
});
```

### Observers Intercept ALL Queries

Observers are called for every query, including:
- Model-based queries (`sql.from(User).many()`)
- Raw table queries (`sql.from("users").many()`)
- Raw SQL queries (`sql.rawQuery("SELECT 1")`)
- Schema operations (`sql.schema().createTable(...)`)

### Observer Errors Are Silently Caught

To prevent observers from blocking queries, any errors thrown within observer hooks are silently caught and ignored. This ensures that a bug in your observer won't break your application:

```typescript
sql.addObserver({
  onBeforeQuery: (ctx) => {
    // Even if this throws, the query will still execute
    throw new Error("Observer bug!");
  },
});

// This will still work despite the observer error
const result = await sql.from("users").many();
```

### Operation Auto-Derivation

The `operation` field is automatically determined by analyzing the SQL query string:

- Queries starting with `SELECT` → `"SELECT"`
- Queries starting with `INSERT` → `"INSERT"`
- Queries starting with `UPDATE` → `"UPDATE"`
- Queries starting with `DELETE` → `"DELETE"`
- All other queries → `"OTHER"`

```typescript
sql.addObserver({
  onBeforeQuery: (ctx) => {
    switch (ctx.operation) {
      case "SELECT":
        // Handle SELECT queries
        break;
      case "INSERT":
        // Handle INSERT queries
        break;
      // ... etc
    }
  },
});
```

### Context Model Field

The `model` field in the context is only populated for model-based queries. For raw table queries and raw SQL, it will be `undefined`:

```typescript
sql.addObserver({
  onBeforeQuery: (ctx) => {
    if (ctx.model) {
      console.log(`Querying model: ${ctx.model.name}`);
    } else {
      console.log("Raw query (no model)");
    }
  },
});
```

---

See also:

- [Read Replication](./replication.md)
- [Caching](./caching.md)
- [Transactions](./transactions.md)
