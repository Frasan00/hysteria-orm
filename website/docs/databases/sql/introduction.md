---
title: SQL ORM Introduction
description: "SQL database support in Hysteria ORM for PostgreSQL, MySQL, SQLite, MSSQL, Oracle, CockroachDB with type-safe models and query builder."
keywords:
  [hysteria-orm, SQL, PostgreSQL, MySQL, SQLite, MSSQL, Oracle, database]
sidebar_position: 1
---

# SQL ORM Introduction

Hysteria ORM provides a powerful, partially type-safe ORM for SQL databases.

## Supported Databases

| Database    | Support Level | Notes                                                 |
| ----------- | ------------- | ----------------------------------------------------- |
| PostgreSQL  | First-class   | Full feature support                                  |
| MySQL       | First-class   | Full feature support                                  |
| SQLite      | First-class   | Some alter table limitations                          |
| MariaDB     | First-class   | MySQL-compatible                                      |
| CockroachDB | Second-class  | Some relation query limitations                       |
| MSSQL       | Second-class  | See [limitations](#mssql-sql-server-some-limitations) |
| OracleDB    | Experimental  | See [limitations](#oracledb-limitations)              |

## Key Features

- Partially type-safe models and queries
- `defineModel`-based schema definition
- Advanced query builder (Knex-like)
- Migrations and schema management
- Relations: `hasOne`, `hasMany`, `belongsTo`, `manyToMany`
- Transactions: global, nested, concurrent
- Hooks and lifecycle events
- Factory support for testing and seeding

## Connecting and Disconnecting

Hysteria ORM provides flexible methods to manage your SQL database connections. By default, you must call `.connect()` before performing queries. You can opt in to lazy connections with `lazyLoad: true`, which auto-connects on the first query.

### Creating a Connection

Use the `SqlDataSource` class to create and establish database connections:

```typescript
import { SqlDataSource } from "hysteria-orm";

// Create instance with configuration
const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "user",
  password: "pass",
  database: "mydb",
  logs: true,
});

// Connection is established lazily on first query (recommended)
// const users = await sql.from(User).many();

// Or explicitly connect (also works)
await sql.connect();
```

If no configuration is provided, environment variables are used:

```typescript
import { SqlDataSource } from "hysteria-orm";

// Uses DB_TYPE, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE from env
const sql = new SqlDataSource();
await sql.connect();
const users = await sql.from(User).many();
```

### Connection Modes: lazyLoad

By default, `SqlDataSource` uses **strict mode** (`lazyLoad: false`), which requires an explicit `.connect()` call before any operation. You can enable lazy loading by setting `lazyLoad: true`, meaning the connection is established automatically on the first query:

```typescript
// Default: lazyLoad = false (strict mode — requires explicit connect)
const sql = new SqlDataSource({ type: "postgres" });
await sql.connect(); // must call connect() explicitly
const users = await sql.from(User).many(); // works

// Lazy mode: lazyLoad = true (auto-connect on first query)
const lazySql = new SqlDataSource({ type: "postgres", lazyLoad: true });
const users = await lazySql.from(User).many(); // auto-connects
```

When `lazyLoad: false` (the default) and no explicit `.connect()`, any operation will throw a `CONNECTION_NOT_ESTABLISHED` error.

### Configuration Options

```typescript
const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "user",
  password: "pass",
  database: "mydb",
  logs: true,
  // Embedded models that can be used directly from the sql data source instance
  models: {
    user: User,
    post: Post,
  },
  // Retry policy for failed queries
  connectionPolicies: {
    retry: {
      maxRetries: 3,
      delay: 1000,
    },
  },
  // Query format options for logging
  queryFormatOptions: {
    // sql-formatter options
  },
  // Driver-specific options (mysql2, pg, sqlite3, etc.)
  driverOptions: {
    // Depends on database type
  },
});
```

### Secondary Connections

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

// Use with models by passing the connection
const users = await replicaDb.from(User).many();
```

### Temporary Connections

Create a connection, use it, and disconnect:

```typescript
import { SqlDataSource } from "hysteria-orm";

const tempSql = new SqlDataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "user",
  password: "pass",
  database: "tempdb",
});
// Connection is established on first query
const users = await tempSql.from(User).many();
await tempSql.disconnect();
```

### Closing Connections

```typescript
// Close a specific instance
await sql.disconnect();
```

### Low-Level Access

```typescript
// Get a connection from the pool (auto-connects if needed)
const connection = await sql.getConnection();

// Get the underlying pool/driver instance (requires prior connection)
const pool = sql.getPool();
```

## Example Usage

```typescript
import { SqlDataSource } from "hysteria-orm";
import { User } from "./models/User";

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "root",
  password: "root",
  database: "mydb",
});

// Connection is established lazily on first query
const users = await sql.from(User).many();
```

---

## MSSQL (SQL Server) Some Limitations

MSSQL is supported as a second-class database. The following and potentially other limitations apply:

### Transactions

- **Single request per transaction**: MSSQL only allows one active request per transaction at a time. Operations that run queries in parallel (like `paginate()`) are automatically serialized when running inside a transaction.
- **Pessimistic locking**: Uncommitted writes block reads from other connections on the same table.

### Query Builder

- **Recursive CTEs**: MSSQL doesn't use the `RECURSIVE` keyword - recursion is implicit.
- **Empty `whereIn`/`whereNotIn`**: Empty arrays generate invalid SQL and should be avoided.
- **`whereRegexp`**: Not supported - MSSQL doesn't have a native `REGEXP` operator.
- **Lock clauses**: Uses different syntax (`WITH (UPDLOCK)` hints) than other databases.

### JSON Queries

- **Limited JSON support**: MSSQL uses `CHARINDEX` for JSON queries, which only performs exact substring matching.
- **Not supported**: Partial JSON object matching, `whereJsonContains`, nested property queries with complex conditions.

### Relations

- **HasMany/ManyToMany with limit/offset**: May fail with "Ambiguous column name" errors when using `orderByRaw` with unqualified column names. Always use fully qualified column names (e.g., `table.column`) in `orderByRaw`.

### Unique Constraints

- **NULL handling**: MSSQL considers multiple `NULL` values as duplicates for `UNIQUE` constraints, unlike PostgreSQL.

### UUIDs

- **Case sensitivity**: MSSQL returns UUIDs in uppercase. Comparisons should use case-insensitive matching.

### Alter statements

- **Limited support**: Some issues could arise in alter table statements that can lead to have to write raw sql.

---

Next: [ORM Patterns](./patterns.md)

## OracleDB Limitations

OracleDB is supported as a partial-class database. The following and potentially other limitations apply:

### CLOB Columns

- **Cannot be used in WHERE comparisons**: CLOB columns cannot be used in WHERE comparisons.

### Overall Limitations

- **Some features may not work as expected**: Some features may not work as expected due to the differences in the database.
- **Raw SQL may be required**: Raw SQL may be required to achieve the desired result in both DDL and DML statements.
