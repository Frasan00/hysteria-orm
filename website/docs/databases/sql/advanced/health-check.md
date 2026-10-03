---
title: Health Checks
description: Monitor database connectivity with ping and isHealthy for load balancers and orchestrators in Hysteria ORM.
keywords: [hysteria-orm, health check, ping, isHealthy, monitoring]
---

# Health checks

Health check methods verify database connectivity without throwing. They are safe to use in HTTP health endpoints, load balancer checks, and Kubernetes readiness or liveness probes.

## `sql.ping()`

```typescript
async ping(): Promise<PingResult>
```

Runs a lightweight query and returns status, latency, and dialect. It never throws: on failure it returns `ok: false`.

```typescript
const result = await sql.ping();

if (result.ok) {
  console.log(`Database is healthy (${result.latencyMs}ms)`);
} else {
  console.log(`Database is unreachable: ${result.dialect}`);
}
```

`PingResult`:

```typescript
type PingResult = {
  ok: boolean;
  latencyMs: number;
  dialect: SqlDataSourceType;
};
```

## `sql.isHealthy()`

```typescript
async isHealthy(): Promise<boolean>
```

Calls `ping()` and returns its `ok` field. It never throws, so it is the simplest option for health endpoints.

```typescript
const healthy = await sql.isHealthy();
```

## Dialect-specific queries

| Dialect                 | Query                    |
| ----------------------- | ------------------------ |
| MySQL, MariaDB          | `SELECT 1`               |
| PostgreSQL, CockroachDB | `SELECT 1`               |
| MSSQL                   | `SELECT 1`               |
| SQLite                  | `PRAGMA integrity_check` |

## HTTP and Kubernetes examples

```typescript
import express from "express";

const app = express();

app.get("/health", async (req, res) => {
  const result = await sql.ping();

  if (!result.ok) {
    return res
      .status(503)
      .json({ status: "unhealthy", dialect: result.dialect });
  }

  res.json({
    status: "healthy",
    latencyMs: result.latencyMs,
    dialect: result.dialect,
  });
});

app.get("/ready", async (req, res) => {
  res.status((await sql.isHealthy()) ? 200 : 503).send();
});
```

## Best practices

1. Use `isHealthy()` for simple boolean checks and `ping()` when you need latency or dialect.
2. Check periodically rather than on every request.
3. Configure connection timeouts so unresponsive databases are detected quickly.

```typescript
setInterval(async () => {
  if (!(await sql.isHealthy())) {
    console.error("Database health check failed");
  }
}, 30_000);
```

## See also

- [Read Replication](/databases/sql/advanced/replication)
- [Transactions](/databases/sql/advanced/transactions)
- [Caching](/databases/sql/advanced/caching)
