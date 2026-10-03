---
title: Read Replication
description: Route reads to replica databases and writes to the master with read replication in Hysteria ORM.
keywords:
  [hysteria-orm, read replication, read replicas, database scaling, failover]
---

# Read replication

Read replication routes `SELECT` queries to one or more slave databases while all writes go to the master. It scales read-heavy workloads and can fail over to the master when a slave is unavailable. Connection options are covered in [SQL ORM Introduction](/databases/sql/introduction).

## Configuration

Configure slaves under `replication` when creating the `SqlDataSource`. Slaves accept the same connection options as the master.

```typescript
import { SqlDataSource } from "hysteria-orm";

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
  },
});

await sql.connect();
```

If no slaves are configured, every operation uses the master.

## Slave selection

- `roundRobin` (default): distributes requests evenly across slaves in sequence.
- `random`: picks a slave at random per request.

## Automatic routing

Read operations use a slave (falling back to the master), and write operations always use the master.

```typescript
// Reads
await sql.from(User).find();
await sql.from(User).where("id", 1).one();
await sql.from(User).getCount();
await sql.from(User).paginate(1, 10);
await sql.from(User).stream();

// Writes
await sql.from(User).insert({ name: "John", email: "john@example.com" });
await sql.from(User).where("id", 1).update({ name: "Jane" });
await sql.from(User).where("id", 1).delete();
```

## Explicit replication mode

Override routing per query with `setReplicationMode("master" | "slave")`. Force the master right after a write to avoid replication lag, or force a slave when you want to bypass the default.

```typescript
await sql.from(User).insert({ name: "John", email: "john@example.com" });

const user = await sql
  .from(User)
  .where("email", "john@example.com")
  .setReplicationMode("master")
  .one();
```

`setReplicationMode` is also available on the raw query builder and on `ModelManager`.

## Replication lag

Slaves may lag behind the master. A read immediately after a write can miss the new row until replication catches up. Force a master read in that window:

```typescript
const user = await sql.from(User).insert({ name: "John" });
const found = await sql
  .from(User)
  .where("id", user.id)
  .setReplicationMode("master")
  .one();
```

## Transactions

Every operation inside a transaction runs on the master, regardless of replication settings. See [Transactions](/databases/sql/advanced/transactions) for the transaction API.

## Slave failure handling

Provide `onSlaveServerFailure` to react to slave errors. The callback receives the error and the slave's connection context, and after it completes the operation is retried on the master. Without the callback, the error is thrown.

```typescript
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres" /* connection options: see SQL ORM Introduction */,
  replication: {
    slaves: [{ type: "postgres", host: "slave1.db.com" /* ... */ }],
    onSlaveServerFailure: async (error, context) => {
      logger.error(
        { error, host: context.host },
        "Slave failure, using master",
      );
      metrics.increment("db.slave.failure");
    },
  },
});
```

Slave connections are opened on `sql.connect()` and closed on `sql.disconnect()`. A slave that fails during initialization throws and aborts the connect.

## Best practices

1. Always set `onSlaveServerFailure` to monitor slave health.
2. Force master reads after writes when strong read-after-write consistency is required.
3. Pick `roundRobin` or `random` based on your infrastructure.
4. Test failover scenarios before relying on them in production.

## See also

- [Transactions](/databases/sql/advanced/transactions)
- [Caching](/databases/sql/advanced/caching)
- [Health Checks](/databases/sql/advanced/health-check)
