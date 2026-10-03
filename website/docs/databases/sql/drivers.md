---
title: SQL Drivers
description: "Choose and configure SQL drivers for Node, Bun, browsers, and React Native, including runtime detection and custom driver factories."
keywords:
  [
    hysteria-orm,
    driver,
    node,
    bun,
    sqlite-wasm,
    op-sqlite,
    react-native,
    wasm,
    opfs,
    registerDriverAdapter,
  ]
---

# SQL drivers

Hysteria ORM selects a driver from the JavaScript runtime it is executing in. This page covers runtime detection, the driver matrix for Node, Bun, web, and React Native, and how to plug in your own driver.

## Driver and runtime matrix

`jsEnvironment` resolves the runtime, and each `(dialect, jsEnvironment)` pair maps to one driver. Only SQLite has a web or React Native driver; MSSQL always uses the pure-JS npm driver.

| Dialect     | Node (default) | Bun          | Web           | React Native |
| ----------- | -------------- | ------------ | ------------- | ------------ |
| postgres    | `pg`           | `bun-sql`    | -             | -            |
| cockroachdb | `pg`           | `bun-sql`    | -             | -            |
| mysql       | `mysql2`       | `bun-sql`    | -             | -            |
| mariadb     | `mysql2`       | `bun-sql`    | -             | -            |
| sqlite      | `sqlite3`      | `bun-sqlite` | `sqlite-wasm` | `sqlite-rn`  |
| mssql       | `mssql`        | `mssql`      | -             | -            |

The npm drivers (`pg`, `mysql2`, `sqlite3`, `mssql`) are installed per [Installation](/getting-started/installation). The Bun, web, and React Native drivers are covered below.

## Automatic detection

No configuration is needed. Hysteria detects the runtime at connect time and picks the matching driver:

1. Bun: `process.versions.bun`
2. React Native: `navigator.product === "ReactNative"` or a Hermes global
3. Web: `window`, `document`, or a worker `self`
4. Node: fallback

Workers are checked explicitly, since a Web Worker has no `window` and no `process`. Set `jsEnvironment` to override detection.

Everything else (models, query builder, transactions, migrations, streaming) uses the same syntax regardless of the underlying driver.

## Bun native drivers

When your app runs on [Bun](https://bun.sh), Hysteria ORM executes SQL through Bun's native database clients instead of the npm drivers, so no extra dependencies or native compilation are required.

| Dialect     | Bun driver   | npm driver used on Node |
| ----------- | ------------ | ----------------------- |
| postgres    | `Bun.sql`    | `pg`                    |
| cockroachdb | `Bun.sql`    | `pg`                    |
| mysql       | `Bun.sql`    | `mysql2`                |
| mariadb     | `Bun.sql`    | `mysql2`                |
| sqlite      | `bun:sqlite` | `node-sqlite3`          |
| mssql       | -            | `mssql` (always)        |

Under Bun, `bun:sqlite` accepts a path or `":memory:"`:

```typescript
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "sqlite",
  database: ":memory:", // or a file path
});
```

To run the npm drivers even when the process is Bun (for example, to compare behavior or because your deployment bundles npm modules), force the runtime:

```typescript
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "sqlite",
  database: "/tmp/data.db",
  jsEnvironment: "node", // build npm pools (node-sqlite3) even under Bun
});
```

## Web and React Native drivers

`SqlDataSource` can run SQLite in a browser or in React Native without touching Node APIs. The two runtimes use different engines (a browser talks to WASM, React Native talks to a native module), so they are two separate drivers with two separate packages:

| Runtime          | Driver name   | npm package                 | Installed as  |
| ---------------- | ------------- | --------------------------- | ------------- |
| browser / worker | `sqlite-wasm` | `@sqlite.org/sqlite-wasm`   | optional peer |
| React Native     | `sqlite-rn`   | `@op-engineering/op-sqlite` | optional peer |

Install only the one your target uses:

```bash
# browser
yarn add @sqlite.org/sqlite-wasm

# React Native
yarn add @op-engineering/op-sqlite
```

Both are declared as optional peer dependencies, so bundlers leave them external and the driver modules are imported lazily. A Node or Bun build never loads them.

Create the datasource normally and detection picks the right driver:

```typescript
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "sqlite",
  database: ":memory:",
});

await sql.connect();
```

### Choosing the database

`database` picks between ephemeral and persistent storage:

```typescript
// in-memory, discarded when the tab or app session ends
new SqlDataSource({ type: "sqlite", database: ":memory:" });

// browser: OPFS-backed, survives reloads
new SqlDataSource({ type: "sqlite", database: "app.db" });
```

In a browser, any name other than `:memory:` (or the empty string) opens an OPFS database. OPFS is only reachable from a dedicated worker and requires the page to be cross-origin isolated, so the host page must send:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

If `OpfsDb` is unavailable in the loaded build, the adapter falls back to a plain in-memory handle rather than failing. Check `sql.driverAdapter` if persistence silently looks absent. In React Native the name is passed straight to the native module and is a real file on disk.

## Overriding the driver

`driver` accepts either a registered name or a factory object. As a name it is typed per `(dialect, jsEnvironment)` pair, so an invalid combination is a compile error rather than a confusing runtime failure.

An omitted `jsEnvironment` (`"auto"`) resolves names against Node, because the type system cannot know the real runtime. Set it explicitly to unlock a runtime's names with autocomplete:

```typescript
const sql = new SqlDataSource({
  type: "sqlite",
  database: ":memory:",
  jsEnvironment: "web", // unlocks driver: "sqlite-wasm"
  driver: "sqlite-wasm",
});
```

Asking for postgres on web by name throws `DriverNotFoundError` instead of silently booting the Node `pg` pool. A custom factory still works there, since it makes no claim about the runtime.

To run the npm drivers under Bun, set `jsEnvironment: "node"` as shown in [Bun native drivers](#bun-native-drivers).

## Registering custom drivers

Drivers are pluggable. Use `registerDriverAdapter` for a driver that should be selectable by name and shared process-wide, for example the `mysql` package replacing `mysql2`, or a web/WASM SQLite driver for a runtime without Node or Bun:

```typescript
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

### Inline driver factories

Passing a factory object to `driver` is the custom path: there is no sentinel to set and no second option to keep in sync. This is also the only way to fill a `(dialect, jsEnvironment)` pair that has no builtin:

```typescript
import { SqlDataSource } from "hysteria-orm";
import type { DriverAdapterFactory } from "hysteria-orm";

const myDriver: DriverAdapterFactory<"sqlite"> = {
  name: "my-sqlite",
  dialects: ["sqlite"],
  create: async ({ dialect, jsEnvironment, input }) => {
    // return a DriverAdapter instance
  },
};

const sql = new SqlDataSource({
  type: "sqlite",
  database: ":memory:",
  driver: myDriver,
});
```

The factory's `create()` runs per datasource, so clones and read replicas each get their own adapter, and environment filtering is deliberately skipped because you opted in explicitly. The declared dialect still has to match the one configured on the datasource; a mismatch throws a message naming both.

## Requirements and limits

- Result shapes are canonicalized to match the npm drivers, so `RETURNING` values, affected-row counts, lock/`forUpdate` queries, and migration table introspection behave identically everywhere.
- Transactions adapt per dialect: MySQL/MariaDB use `START TRANSACTION`, Postgres/CockroachDB use `BEGIN TRANSACTION`, and SQLite forwards the keywords verbatim.
- Streaming: under Bun, `bun:sqlite`'s `iterate()` feeds `stream()` row-by-row with backpressure. `bun-sql` has no cursor API in Bun 1.4, so Postgres/MySQL streams are buffered. On web and React Native, `stream()` materializes and buffers the result set. The `for await` consumption API is unchanged.
- Crypto: UUID and ULID generation needs `crypto.getRandomValues`. Browsers require a secure context (HTTPS, or `localhost`); React Native needs a polyfill such as `react-native-get-random-values`. Without it, identity-generating calls throw a `PlatformUnsupportedError` naming the fix rather than falling back to weak randomness.
- No filesystem: the web and React Native platform adapters have no `fs`. File operations throw `PlatformUnsupportedError`.
- Migrations: migration files are modules resolved from disk at runtime, which browsers cannot do. Ship a schema with the app, or run migrations from a Node process against the same database, rather than calling the migrator in the browser.
- mssql always uses the pure-JS npm driver (there is no Bun-native client), which works under Bun via the node-environment fallback.

## See also

- [SQL ORM Introduction](/databases/sql/introduction)
- [Installation](/getting-started/installation)
- [Migrations](/databases/sql/cli/migrations/basics)
