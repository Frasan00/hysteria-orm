---
title: Health Checks
description: "Health check methods for monitoring database connectivity in production environments."
keywords: [hysteria-orm, health check, ping, isHealthy, database connectivity, monitoring, production]
sidebar_position: 6
---

# Health Checks

Hysteria ORM provides built-in health check methods for monitoring database connectivity. These are essential for production deployments, load balancers, and orchestration systems like Kubernetes.

## Overview

Health check methods enable you to verify database connectivity without throwing errors. This makes them safe to use in:

- **Health endpoints**: HTTP handlers that report service status
- **Load balancers**: Determining which instances are healthy
- **Kubernetes probes**: Readiness and liveness probes
- **Connection monitoring**: Detecting connection issues before they cause failures

## `PingResult` Type

The result type returned by `ping()`:

```typescript
type PingResult = {
  /** Whether the ping was successful */
  ok: boolean;
  /** Latency in milliseconds */
  latencyMs: number;
  /** Database dialect/type */
  dialect: SqlDataSourceType;
};
```

## `sql.ping()`

Executes a lightweight health check query and returns detailed status information.

**Returns**: `Promise<PingResult>`

**Behavior**:
- Uses dialect-specific queries: `SELECT 1` for most databases, `PRAGMA integrity_check` for SQLite
- Measures latency in milliseconds
- Returns `{ ok: false, latencyMs, dialect }` on failure — **never throws**

```typescript
const result = await sql.ping();

if (result.ok) {
  console.log(`Database is healthy (${result.latencyMs}ms)`);
} else {
  console.log(`Database is unreachable: ${result.dialect}`);
}
```

## `sql.isHealthy()`

A simple boolean check for database health.

**Returns**: `Promise<boolean>`

**Behavior**:
- Internally calls `ping()` and checks the `ok` field
- **Never throws** — safe for use in health check endpoints
- Returns `true` if database is reachable, `false` otherwise

```typescript
const healthy = await sql.isHealthy();
```

## Usage Examples

### Basic Health Check

```typescript
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  database: "mydb",
});

await sql.connect();

async function checkDatabaseHealth() {
  const result = await sql.ping();

  return {
    healthy: result.ok,
    latencyMs: result.latencyMs,
    dialect: result.dialect,
  };
}
```

### Express/HTTP Handler Integration

```typescript
import express from "express";

const app = express();

app.get("/health", async (req, res) => {
  const result = await sql.ping();

  if (result.ok) {
    res.json({
      status: "healthy",
      latencyMs: result.latencyMs,
      dialect: result.dialect,
    });
  } else {
    res.status(503).json({
      status: "unhealthy",
      dialect: result.dialect,
    });
  }
});
```

### Kubernetes Readiness/Liveness Probe Pattern

```typescript
const sql = new SqlDataSource({
  type: "mysql",
  host: "localhost",
  database: "mydb",
});

// Kubernetes readiness probe
app.get("/ready", async (req, res) => {
  const healthy = await sql.isHealthy();

  if (healthy) {
    res.status(200).send("OK");
  } else {
    res.status(503).send("Service Unavailable");
  }
});

// Kubernetes liveness probe
app.get("/live", async (req, res) => {
  const healthy = await sql.isHealthy();

  if (healthy) {
    res.status(200).send("OK");
  } else {
    res.status(503).send("Service Unavailable");
  }
});
```

## Dialect-Specific Queries

| Dialect | Query |
|---------|-------|
| MySQL, MariaDB | `SELECT 1` |
| PostgreSQL, CockroachDB | `SELECT 1` |
| MSSQL | `SELECT 1` |
| OracleDB | `SELECT 1` |
| SQLite | `PRAGMA integrity_check` |

## Best Practices

1. **Use `isHealthy()` for simple checks**: When you only need a boolean result
2. **Use `ping()` for detailed monitoring**: When you need latency metrics or dialect info
3. **Don't call on every request**: Cache results and check periodically, not on every operation
4. **Set appropriate timeouts**: Configure connection timeouts to detect unresponsive databases quickly

```typescript
// Good: Periodic health check
setInterval(async () => {
  const healthy = await sql.isHealthy();
  if (!healthy) {
    console.error("Database health check failed");
    // Alert or take action
  }
}, 30_000); // Every 30 seconds

// Bad: Health check on every request
app.use((req, res, next) => {
  const healthy = await sql.isHealthy(); // Don't do this
  next();
});
```

---

See also:

- [Transactions](./transactions.md)
- [Caching](./caching.md)
