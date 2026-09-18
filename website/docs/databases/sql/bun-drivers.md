---
title: Native Bun Drivers
description: "Run Hysteria ORM SQL on Bun with zero extra dependencies using the native Bun.sql and bun:sqlite drivers."
keywords: [hysteria-orm, bun, bun-sql, bun-sqlite, database, driver, postgres, mysql, sqlite]
sidebar_position: 3
---

# Native Bun Drivers

When your app runs on [Bun](https://bun.sh), Hysteria ORM can execute SQL through Bun's **native database clients** instead of the npm drivers (`pg`, `mysql2`, `node-sqlite3`). No extra dependencies, no native compilation — you only need the `bun` runtime itself.

| Dialect      | Bun driver | npm driver used on Node |
| ------------ | ---------- | ----------------------- |
| postgres     | `Bun.sql`  | `pg`                    |
| cockroachdb  | `Bun.sql`  | `pg`                    |
| mysql        | `Bun.sql`  | `mysql2`                |
| mariadb      | `Bun.sql`  | `mysql2`                |
| sqlite       | `bun:sqlite` | `node-sqlite3`         |
| mssql        | —          | `mssql` (always)        |

## Automatic detection

No configuration is needed. When you create a `SqlDataSource` under a Bun runtime, Hysteria detects the environment and selects the matching native driver:

```ts
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "app",
});

await sql.connect();
```

Everything else — models, query builder, transactions, migrations, streaming — uses the same syntax whether the underlying driver is Bun-native or the npm equivalent.

Under Bun, `bun:sqlite` accepts a path or `":memory:"`:

```ts
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "sqlite",
  database: ":memory:", // or a file path
});
```

## Overriding the driver

Two input options control driver selection for every `SqlDataSource`:

- **`driver`** — an explicit driver name (`"bun-sql"`, `"bun-sqlite"`, or an npm name like `"pg"`, `"mysql2"`, `"sqlite3"`, `"mssql"`). An explicit name must support the resolved environment, so a Node runtime cannot pick a Bun-only driver.
- **`jsEnvironment`** — `"auto"` (default), `"node"`, `"bun"`, `"web"`, or `"react-native"`. Forces the resolved runtime before driver selection. See [Web & React Native Drivers](./web-and-react-native-drivers.md) for the last two.

To run the npm drivers even when the process is Bun (e.g. to compare behavior, or because your deployment bundles npm modules):

```ts
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "sqlite",
  database: "/tmp/data.db",
  jsEnvironment: "node", // build npm pools (node-sqlite3) even under Bun
});
```

## Registering custom drivers

Drivers are pluggable. Any new driver — the `mysql` package replacing `mysql2`, a web/WASM sqlite driver for runtimes without Node or Bun — registers without touching the runtime core:

```ts
import { registerDriverAdapter } from "hysteria-orm";
import type { DriverAdapterFactory } from "hysteria-orm";

const myDriver: DriverAdapterFactory = {
  name: "my-driver",
  dialects: ["sqlite"],
  environments: ["node", "web"],
  create: async ({ dialect, jsEnvironment, input }) => {
    // return a DriverAdapter instance
  },
};

registerDriverAdapter(myDriver);
```

Once registered, `driver: "my-driver"` selects it. The factory receives the resolved dialect, environment, and the datasource input so it can build the pool/connection it needs.

## Notes

- **Result shapes** are canonicalized to match the npm drivers, so every existing feature — `RETURNING` values, affected-row counts, lock/`forUpdate` queries, migration table introspection — behaves identically.
- **Transactions** adapt per dialect: MySQL/MariaDB use `START TRANSACTION` and Postgres/CockroachDB `BEGIN TRANSACTION`, matching what each server accepts.
- **Streaming** is cursor-based under Bun: `bun:sqlite`'s `iterate()` feeds `stream()` row-by-row (backpressure-aware), so huge result sets never materialize in memory. `bun-sql` has no cursor API in Bun 1.4, so Postgres/MySQL streams are buffered — same `for await` consumption API either way.
- mssql always uses the pure-JS npm driver (there is no Bun-native client), which works fine under Bun via the node-environment fallback.
