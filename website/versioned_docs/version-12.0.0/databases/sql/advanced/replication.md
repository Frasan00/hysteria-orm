---
title: Read Replication
description: "Read replicas and database replication support in Hysteria ORM."
keywords: [hysteria-orm, read replicas, replication, database scaling]
sidebar_position: 6
---

# Read Replication

Hysteria ORM provides built-in support for database read replication, allowing you to scale your read operations across multiple slave databases while ensuring all write operations go to the master. This is particularly useful for high-traffic applications that have more read operations than writes.

## Overview

Read replication in Hysteria ORM works by:

- Automatically routing **read operations** (SELECT queries) to slave databases
- Routing all **write operations** (INSERT, UPDATE, DELETE) to the master database
- Supporting multiple load-balancing algorithms (Round Robin and Random)
- Providing explicit control over which database to use when needed

## Basic Configuration

Configure slaves when creating your SqlDataSource:

```typescript
import { SqlDataSource } from "hysteria-orm";
import { User } from "./models/user";

const sql = new SqlDataSource({
  type: "postgres",
  host: "master.db.com",
  username: "root",
  password: "password",
  database: "mydb",

  // Configure slave databases
  replication: {
    slaves: [
      {
        type: "postgres",
        host: "slave1.db.com",
        username: "root",
        password: "password",
        database: "mydb",
      },
      {
        type: "postgres",
        host: "slave2.db.com",
        username: "root",
        password: "password",
        database: "mydb",
      },
    ],
    slaveAlgorithm: "roundRobin",
  },
});

await sql.connect();
```

## Slave Selection Algorithms

### Round Robin (Default)

Distributes requests evenly across all slaves in sequence. Each slave gets an equal share of the traffic.

```typescript
const sql = new SqlDataSource({
  // ... connection config
  replication: {
    slaves: [
      // ... slave configurations
    ],
    slaveAlgorithm: "roundRobin",
  },
});
```

**Use case:** Best for evenly distributed load when all slaves have similar capacity.

### Random

Randomly selects a slave for each request.

```typescript
const sql = new SqlDataSource({
  // ... connection config
  replication: {
    slaves: [
      // ... slave configurations
    ],
    slaveAlgorithm: "random",
  },
});
```

**Use case:** Useful for simple load distribution without tracking state.

## Slave Failure Handling

Hysteria ORM provides a callback mechanism to handle slave server failures gracefully. When a slave fails during a read operation, you can define custom behavior such as logging, alerting, or metrics collection, and the system will automatically fall back to the master database.

### Configuration

Configure the failure handler when creating your SqlDataSource:

```typescript
import { SqlDataSource } from "hysteria-orm";
import logger from "./logger";

const sql = new SqlDataSource({
  type: "postgres",
  host: "master.db.com",
  username: "root",
  password: "password",
  database: "mydb",

  replication: {
    slaves: [
      {
        type: "postgres",
        host: "slave1.db.com",
        username: "root",
        password: "password",
        database: "mydb",
      },
      {
        type: "postgres",
        host: "slave2.db.com",
        username: "root",
        password: "password",
        database: "mydb",
      },
    ],
    slaveAlgorithm: "roundRobin",

    // Handle slave failures
    onSlaveServerFailure: async (error: Error) => {
      logger.error({ error }, "Slave server failure detected");
      // Send alert, update metrics, etc.
    },
  },
});

await sql.connect();
```

### Behavior

When a slave fails:

1. **Callback Invocation**: The `onSlaveServerFailure` callback is invoked with the error
2. **Automatic Fallback**: After the callback completes, the operation automatically falls back to the master database
3. **Transparent Recovery**: The application continues functioning without interruption

```typescript
// If slave1 fails during this operation:
const users = await sql.from(User).find();
// 1. onSlaveServerFailure is called with the error
// 2. Query is automatically retried on master
// 3. Users are returned successfully
```

### Without Failure Handler

If you don't provide an `onSlaveServerFailure` callback, errors are thrown as usual:

```typescript
const sql = new SqlDataSource({
  // ... connection config
  replication: {
    slaves: [
      // ... slave configurations
    ],
    // No onSlaveServerFailure callback
  },
});

// If a slave fails, the error is thrown
const users = await sql.from(User).find(); // Throws error if slave fails
```

### Use Cases

**Monitoring and Alerting**:

```typescript
replication: {
  slaves: [/* ... */],
  onSlaveServerFailure: async (error) => {
    await monitoring.sendAlert({
      severity: "high",
      message: "Database slave failure",
      error: error.message,
    });
  },
}
```

**Metrics Collection**:

```typescript
replication: {
  slaves: [/* ... */],
  onSlaveServerFailure: async (error) => {
    metrics.increment("db.slave.failure");
    logger.error({ error }, "Slave failure");
  },
}
```

**Graceful Degradation**:

```typescript
let slaveFailureCount = 0;

replication: {
  slaves: [/* ... */],
  onSlaveServerFailure: async (error) => {
    slaveFailureCount++;
    if (slaveFailureCount > 10) {
      // Trigger circuit breaker or disable slave routing
      await notifyOps("Multiple slave failures detected");
    }
  },
}
```

## Automatic Routing

By default, Hysteria ORM automatically routes operations to the appropriate database:

```typescript
// Read operations → Automatically uses slaves or master as fallback
const users = await sql.from(User).find();
const user = await sql.from(User).where("id", 1).one();
const count = await sql.from(User).getCount();
const paginated = await sql.from(User).paginate(1, 10);

// Write operations → Always uses master
const newUser = await sql
  .from(User)
  .insert({ name: "John", email: "john@example.com" });
await sql.from(User).where("id", 1).update({ name: "Jane" });
await sql.from(User).where("id", 1).delete();
```

## Explicit Replication Mode

You can override the automatic behavior using the `replicationMode` option:

### Force Master for Reads

Useful when you need strong consistency immediately after a write:

```typescript
// Write to master
await sql.from(User).insert({ name: "John", email: "john@example.com" });

// Force read from master (avoid replication lag)
const user = await sql
  .from(User)
  .where("email", "john@example.com")
  .setReplicationMode("master")
  .one();
```

### Force Slave for Reads

Explicitly use slaves even when you have control flow that might default to master:

```typescript
const users = await sql.from(User).setReplicationMode("slave").find();
```

### With Query Builder

The replication mode also works with the query builder using `setReplicationMode()`:

```typescript
// Force master for this read
const users = await sql
  .from(User)
  .setReplicationMode("master")
  .where("active", true)
  .many();

// Force slave for this read
const count = await sql.from(User).setReplicationMode("slave").getCount();
```

## Important Considerations

### Replication Lag

Slave databases may have a slight delay in receiving updates from the master. This is called **replication lag**.

```typescript
// This pattern can cause issues due to replication lag:
const user = await sql.from(User).insert({ name: "John" }); // Writes to master

// This might not find the user if slave hasn't replicated yet!
const found = await sql.from(User).where("id", user.id).one(); // Reads from slave

// Solution: Force master read after write
const found = await sql
  .from(User)
  .where("id", user.id)
  .setReplicationMode("master")
  .one();
```

### Transactions

All operations within a transaction use the master database, regardless of replication settings:

```typescript
await sql.transaction(async (trx) => {
  // Both operations use master
  const user = await sql.from(User, { trx }).insert({ name: "John" });
  const found = await sql.from(User, { trx }).where("id", user.id).one();
});
```

### No Slaves Configured

If no slaves are configured, all operations automatically fall back to the master:

```typescript
const sql = new SqlDataSource({
  // ... connection config
  replication: {
    slaves: [],
  },
});

// All operations use master
const users = await sql.from(User).find(); // Uses master
```

## Streaming Operations

Streaming operations also respect replication settings:

```typescript
// Streams from slave
const stream = await sql.from(User).stream();

// Streams from master
const stream = await sql.from(User).setReplicationMode("master").stream();
```

## Raw Queries

When using raw queries, write operations always use master, and read operations use slaves:

```typescript
// Uses master (INSERT)
await sql.from("users").insert({ name: "John", email: "john@example.com" });

// Uses slave (SELECT)
const users = await sql.from("users").many();

// Force master
const users = await sql.from("users").setReplicationMode("master").many();
```

## Connection Management

All slave connections are automatically managed:

```typescript
// Connects to master and all slaves
await sql.connect();

// Disconnects from master and all slaves
await sql.disconnect();
```

### Connection Initialization

If a slave fails to connect during initialization, an error will be thrown. Ensure all slave databases are accessible before connecting.

### Runtime Failures

For failures that occur during query execution (after successful connection), use the `onSlaveServerFailure` callback to handle errors gracefully. The system will automatically fall back to the master database, ensuring your application continues to function even when slaves become unavailable.

```typescript
const sql = new SqlDataSource({
  // ... connection config
  replication: {
    slaves: [
      /* ... */
    ],
    onSlaveServerFailure: async (error) => {
      // Handle runtime slave failures
      logger.warn({ error }, "Slave unavailable, falling back to master");
    },
  },
});
```

## Best Practices

1. **Always handle slave failures**: Configure `onSlaveServerFailure` to monitor and alert on slave issues
2. **Consider replication lag**: Use `replicationMode: "master"` for reads immediately after writes
3. **Monitor slave health**: Track slave failure rates and connection issues
4. **Use appropriate algorithms**: Choose between "roundRobin" and "random" based on your infrastructure
5. **Test failover scenarios**: Ensure your application handles slave failures gracefully in production
