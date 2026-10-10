---
title: Query Observers
description: Intercept and monitor every SQL query at the data source level with query observers in Hysteria ORM.
keywords:
  [hysteria-orm, observers, query middleware, query hooks, monitoring, logging]
---

# Query observers

Query observers are data source-level middleware. They intercept every query that passes through a `SqlDataSource`, regardless of which model or table is involved. Use them for logging, performance analysis, error tracking, analytics, and APM instrumentation.

## Observers vs hooks

| Feature    | Observers                 | Hooks                                 |
| ---------- | ------------------------- | ------------------------------------- |
| Scope      | Data source (all queries) | A single model                        |
| Operations | Any SQL statement         | `beforeFetch` before the SQL is built |
| Use case   | Cross-cutting concerns    | Model-specific query logic            |
| Context    | Raw SQL, params, duration | Model query builder                   |

Use an observer when you need to see every query:

```typescript
sql.addObserver({
  onBeforeQuery: (ctx) => {
    console.log("Query:", ctx.sql);
  },
});
```

Use the `beforeFetch` hook for model-specific behavior. It is defined in `defineModel` and receives the model's query builder:

```typescript
import { defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    deletedAt: col.datetime({ nullable: true }),
  },
  hooks: {
    beforeFetch(qb) {
      // Only runs for User fetches
      qb.whereNull("users.deleted_at");
    },
  },
});
```

See [Defining Models](/databases/sql/models/define-model) for the full hook reference.

## API reference

### `sql.addObserver(observer)`

```typescript
addObserver(observer: QueryObserver): this
```

Adds an observer and returns the `SqlDataSource` for chaining. Call it multiple times to add multiple observers; they run in the order they were added.

### `QueryObserver`

```typescript
interface QueryObserver {
  onBeforeQuery?(ctx: QueryContext): Promise<void> | void;
  onAfterQuery?(ctx: QueryContextWithDuration): Promise<void> | void;
  onQueryError?(ctx: QueryContext & { error: Error }): Promise<void> | void;
}
```

All hooks are optional.

### `QueryContext`

```typescript
interface QueryContext {
  id: string;
  sql: string;
  params: any[];
  model?: any;
  operation?: string;
  timestamp: number;
}
```

### `QueryContextWithDuration`

```typescript
type QueryContextWithDuration = QueryContext & {
  duration: number;
  result?: any;
};
```

`operation` is derived from the SQL text: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, or `OTHER`.

## Examples

### Logging

```typescript
sql.addObserver({
  onBeforeQuery: (ctx) => {
    console.log(`[SQL] ${ctx.operation}: ${ctx.sql}`);
  },
  onAfterQuery: (ctx) => {
    console.log(`[SQL] completed in ${ctx.duration}ms`);
  },
});
```

### Slow-query detection

```typescript
const SLOW_QUERY_THRESHOLD = 100;

sql.addObserver({
  onAfterQuery: (ctx) => {
    if (ctx.duration > SLOW_QUERY_THRESHOLD) {
      console.warn(`Slow query (${ctx.duration}ms): ${ctx.sql}`);
    }
  },
});
```

### Error tracking

```typescript
sql.addObserver({
  onQueryError: (ctx) => {
    errorTracker.captureException(ctx.error, {
      tags: { operation: ctx.operation },
      extra: { sql: ctx.sql, params: ctx.params, model: ctx.model?.name },
    });
  },
});
```

### Analytics

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
    stats.byOperation[op] ??= { count: 0, totalTime: 0 };
    stats.byOperation[op].count++;
    stats.byOperation[op].totalTime += ctx.duration;
  },
});
```

### Chaining observers

```typescript
sql
  .addObserver({
    onBeforeQuery: (ctx) => console.log(`Starting: ${ctx.operation}`),
  })
  .addObserver({
    onAfterQuery: (ctx) => console.log(`Finished in ${ctx.duration}ms`),
  })
  .addObserver({
    onQueryError: (ctx) => console.error(`Query failed: ${ctx.error.message}`),
  });
```

## Behavior notes

- Observers run for model queries, raw table queries, raw SQL (`sql.rawQuery`), and schema operations.
- Observers also see queries inside a transaction. The transaction runs on a clone of the data source that shares the same observer chain, so an observer registered on the original still fires. The transaction's own control statements (`BEGIN`, `COMMIT`, `ROLLBACK`, savepoints) take the same path and arrive with `operation: "OTHER"`.
- Errors thrown inside an observer hook are swallowed so an observer bug cannot break a query.
- `ctx.model` is set only for model queries; it is `undefined` for raw table and raw SQL queries.

## See also

- [Defining Models](/databases/sql/models/define-model)
- [Caching](/databases/sql/advanced/caching)
- [Read Replication](/databases/sql/advanced/replication)
- [Transactions](/databases/sql/advanced/transactions)
