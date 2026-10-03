---
title: SQL ORM Introduction
description: "SQL database support in Hysteria ORM for PostgreSQL, MySQL, SQLite, MSSQL, and CockroachDB, with connections, configuration, and lifecycle helpers."
keywords:
  [
    hysteria-orm,
    SQL,
    PostgreSQL,
    MySQL,
    MariaDB,
    SQLite,
    MSSQL,
    CockroachDB,
    database,
    connection,
    configuration,
  ]
---

# SQL ORM introduction

Hysteria ORM is a partially type-safe ORM for SQL databases. This page covers connecting and configuring a `SqlDataSource`.

## Supported databases

| Database    | Support Level | Notes                                            |
| ----------- | ------------- | ------------------------------------------------ |
| PostgreSQL  | First-class   | Full feature support                             |
| MySQL       | First-class   | Full feature support                             |
| SQLite      | First-class   | Some alter table limitations                     |
| MariaDB     | First-class   | MySQL-compatible                                 |
| CockroachDB | Second-class  | Some relation query limitations                  |
| MSSQL       | Second-class  | See [limitations](#mssql-sql-server-limitations) |

:::note Minimum database versions
Database-generated defaults (`uuid()`/`now()` columns, `RETURNING`) require modern server versions. Anything older than the table below is unsupported as of 12.0.0.

| Database    | Minimum              |
| ----------- | -------------------- |
| PostgreSQL  | 13                   |
| MySQL       | 8.0.13               |
| MariaDB     | 10.5                 |
| SQLite      | 3.35                 |
| CockroachDB | (follows PostgreSQL) |
| MSSQL       | 2019                 |
| :::         |

## Connecting and disconnecting

By default, you must call `.connect()` before performing queries. You can opt in to lazy connections with `lazyLoad: true`, which auto-connects on the first query.

### Creating a connection

Use the `SqlDataSource` class to create and establish database connections:

```typescript
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "user",
  password: "pass",
  database: "mydb",
  logs: true,
});

// Strict mode: connect explicitly before querying.
await sql.connect();

// Or enable lazyLoad: true to connect on the first query instead.
const users = await sql.from(User).many();
```

If no configuration is provided, connection details come from environment variables:

```typescript
import { SqlDataSource } from "hysteria-orm";

// Uses DB_TYPE, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE from env
const sql = new SqlDataSource();
await sql.connect();
const users = await sql.from(User).many();
```

### Connection modes: lazyLoad

`SqlDataSource` defaults to strict mode (`lazyLoad: false`), which requires an explicit `.connect()` call before any operation. Setting `lazyLoad: true` establishes the connection automatically on the first query:

```typescript
// Default: lazyLoad = false (strict mode — requires explicit connect)
const sql = new SqlDataSource({ type: "postgres" });
await sql.connect(); // must call connect() explicitly
const users = await sql.from(User).many(); // works

// Lazy mode: lazyLoad = true (auto-connect on first query)
const lazySql = new SqlDataSource({ type: "postgres", lazyLoad: true });
const users = await lazySql.from(User).many(); // auto-connects
```

When `lazyLoad: false` (the default) and no explicit `.connect()`, any operation throws a `CONNECTION_NOT_ESTABLISHED` error.

### Configuration options

This is the complete `SqlDataSource` option reference. Other pages link back here for connection and configuration details.

```typescript
const sql = new SqlDataSource({
  // Database dialect.
  type: "postgres",

  // Connection details — each falls back to its DB_* environment variable.
  host: "localhost",
  port: 5432,
  username: "user",
  password: "pass",
  database: "mydb",

  // Log executed queries. Pass a LoggerConfig for granular control.
  logs: true,

  // Strict (false, default) requires an explicit connect(); true auto-connects
  // on the first query.
  lazyLoad: false,

  // Enable AsyncLocalStorage transaction propagation (default true).
  clsEnabled: true,

  // Models embedded on this instance, reachable via sql.models.<key>.
  models: { user: User, post: Post },

  // Retry policy for failed queries.
  connectionPolicies: {
    retry: {
      maxRetries: 3,
      delay: 1000,
    },
  },

  // sql-formatter options used when logging queries.
  queryFormatOptions: {
    // keywordCase: "upper", ...
  },

  // Driver-specific options (pg, mysql2, sqlite3, mssql, ...).
  driverOptions: {
    // Depends on the database type.
  },

  // Runtime used for driver selection. "auto" (default) resolves from the host;
  // force "node", "bun", "web", or "react-native".
  jsEnvironment: "auto",

  // Override the driver: a registered name or an inline adapter factory.
  // See Drivers below.
  driver: "pg",

  // Parse Postgres int8/numeric as bigint/number (node pg driver only).
  coerceNumericTypes: false,

  // Migration and seeder configuration.
  migrations: {
    path: "database/migrations",
    lock: true,
    transactional: true,
  },
  seeders: {
    path: "database/seeders",
  },

  // Query cache configuration.
  cacheStrategy: {
    cacheAdapter: cacheAdapter,
    keys: cacheKeys,
  },

  // Read replicas and slave failure handling.
  replication: {
    slaveAlgorithm: "roundRobin",
    slaves: [{ type: "postgres", host: "replica.db.com", database: "mydb" }],
    onSlaveServerFailure(error, context) {
      // Called when a read replica fails.
    },
  },
});
```

The runtime and driver layers have their own page: [SQL Drivers](/databases/sql/drivers).

### Secondary connections

Use a separate `SqlDataSource` instance for additional connections:

```typescript
import { SqlDataSource } from "hysteria-orm";

const replicaDb = new SqlDataSource({
  type: "postgres",
  host: "replica.db.com",
  port: 5432,
  username: "user",
  password: "pass",
  database: "mydb",
});

await replicaDb.connect();

const users = await replicaDb.from(User).many();
```

### Temporary connections

`SqlDataSource.useConnection()` opens a connection, runs your callback, and closes it automatically, even when the callback throws:

```typescript
import { SqlDataSource } from "hysteria-orm";

await SqlDataSource.useConnection(
  {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "user",
    password: "pass",
    database: "tempdb",
  },
  async (tempSql) => {
    const users = await tempSql.from(User).many();
  },
);
// Connection is closed here.
```

### Closing connections

```typescript
// Closes the pool, rolls back any active global transaction, and disconnects slaves.
await sql.disconnect();
```

### Low-level access

```typescript
// Get a connection from the pool (auto-connects if lazyLoad is enabled).
const connection = await sql.getConnection();

// Get the underlying pool/driver instance (requires a prior connection).
const pool = sql.getPool();
```

## Lifecycle and introspection helpers

| Helper                                   | Returns                  | Description                                                               |
| ---------------------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `ensureConnected()`                      | `Promise<void>`          | Ensures a connection; auto-connects under `lazyLoad`, otherwise throws.   |
| `isConnected`                            | `boolean`                | Getter: whether the pool or reserved connection is established.           |
| `getConnectionDetails()`                 | `SqlDataSourceInput`     | The resolved connection input, including policies and driver selection.   |
| `getDbType()`                            | dialect                  | The configured SQL dialect.                                               |
| `isInGlobalTransaction`                  | `boolean`                | Getter: whether a global (test) transaction is active.                    |
| `getTransactionBoundSqlDataSource()`     | `SqlDataSource \| null`  | The active global/ALS transaction source, or `null` when outside one.     |
| `isClsEnabled`                           | `boolean`                | Getter: whether AsyncLocalStorage transaction propagation is enabled.     |
| `getOnSlaveServerFailure()`              | callback \| `undefined`  | The configured read-replica failure handler.                              |
| `SqlDataSource.useConnection(input, cb)` | `Promise<void>`          | Static: run a callback against a temporary connection and close it after. |
| `SqlDataSource.isSqlDataSource(value)`   | `value is SqlDataSource` | Static: type guard for `SqlDataSource` instances.                         |
| `syncSchema(options?)`                   | `Promise<void>`          | Diffs models against the database and applies DDL. SQLite is unsupported. |

```typescript
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({ type: "postgres", lazyLoad: true });

await sql.ensureConnected(); // connect on demand
console.log(sql.isConnected); // true
console.log(sql.getDbType()); // "postgres"
console.log(sql.isClsEnabled); // true (default)
console.log(sql.isInGlobalTransaction); // false

const details = sql.getConnectionDetails();
const active = sql.getTransactionBoundSqlDataSource(); // null outside a transaction

if (SqlDataSource.isSqlDataSource(sql)) {
  console.log("is a SqlDataSource");
}

// Diff the models against the database and apply the DDL.
await sql.syncSchema({ transactional: true });
```

For schema discovery, see [Schema Introspection](/databases/sql/advanced/introspection). `syncSchema()` is the programmatic counterpart to the CLI sync command; for SQLite it logs a warning and returns without changes.

## MSSQL (SQL Server) limitations

MSSQL is a second-class database. These limitations apply, and there may be others:

### Transactions

- Single request per transaction: MSSQL allows only one active request per transaction. Parallel-query operations (like `paginate()`) are serialized inside a transaction.
- Pessimistic locking: uncommitted writes block reads from other connections on the same table.

### Query builder

- Recursive CTEs: recursion is implicit; the `RECURSIVE` keyword is not used.
- Empty `whereIn`/`whereNotIn`: empty arrays generate invalid SQL and must be avoided.
- `whereRegexp`: not supported, since MSSQL has no native `REGEXP` operator.
- Lock clauses: use `WITH (UPDLOCK)` hints instead of the other dialects' syntax.

### JSON queries

- Limited support: JSON queries use `CHARINDEX`, which only performs exact substring matching.
- Not supported: partial JSON object matching, `whereJsonContains`, and nested property queries with complex conditions.

### Relations

- HasMany/ManyToMany with limit/offset: may fail with "Ambiguous column name" when `orderByRaw` uses unqualified columns. Always use fully qualified names (for example, `table.column`).

### Unique constraints

- NULL handling: multiple `NULL` values are treated as duplicates for `UNIQUE` constraints, unlike PostgreSQL.

### UUIDs

- Case sensitivity: MSSQL returns UUIDs in uppercase, so comparisons should be case-insensitive.

### Alter statements

- Limited support: some alter table statements are unsupported and may require raw SQL.

## See also

- [SQL Drivers](/databases/sql/drivers)
- [ORM Patterns](/databases/sql/patterns)
- [Models](/databases/sql/models/define-model)
- [Schema Introspection](/databases/sql/advanced/introspection)
- [CLI Overview](/databases/sql/cli/overview)
