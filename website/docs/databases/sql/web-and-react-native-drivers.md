---
title: Web & React Native Drivers
description: "Run Hysteria ORM SQLite in browsers and React Native with WASM and native drivers that never touch Node APIs."
keywords: [hysteria-orm, sqlite-wasm, op-sqlite, react-native, browser, wasm, opfs, driver, sqlite]
sidebar_position: 4
---

# Web & React Native Drivers

`SqlDataSource` can run SQLite in a browser or in React Native without any Node API. The two runtimes have genuinely different engines — a browser talks to WASM, React Native talks to a native module — so they are two separate drivers with two separate packages:

| Runtime          | Driver name   | npm package                | Installed as   |
| ---------------- | ------------- | -------------------------- | -------------- |
| browser / worker | `sqlite-wasm` | `@sqlite.org/sqlite-wasm`  | optional peer  |
| React Native     | `sqlite-rn`   | `@op-engineering/op-sqlite`| optional peer  |

Install only the one your target actually uses:

```bash
# browser
yarn add @sqlite.org/sqlite-wasm

# React Native
yarn add @op-engineering/op-sqlite
```

Both are declared as **optional** peer dependencies, so bundlers leave them external and the driver modules are imported lazily. A Node or Bun build never loads them.

## Automatic detection

Create the datasource normally. Hysteria detects the runtime the same way it detects Bun:

```ts
import { SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "sqlite",
  database: ":memory:",
});

await sql.connect();
```

Detection order is: `process.versions.bun` → `navigator.product === "ReactNative"` or a Hermes global → `window`/`document` or a worker scope → Node. Workers are checked explicitly, since a Web Worker has no `window` and no `process`.

## Choosing the database

`database` picks between ephemeral and persistent storage. The `:memory:` name is SQLite's own, and both engines honour it:

```ts
// in-memory, discarded when the tab or app session ends
new SqlDataSource({ type: "sqlite", database: ":memory:" });

// browser: OPFS-backed, survives reloads
new SqlDataSource({ type: "sqlite", database: "app.db" });
```

In a browser any name other than `:memory:` (or the empty string) opens an **OPFS** database. OPFS is only reachable from a dedicated worker and requires the page to be cross-origin isolated, so the host page must send:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

If `OpfsDb` is unavailable in the loaded build, the adapter falls back to a plain in-memory handle rather than failing — check `sql.driverAdapter` if persistence silently looks absent.

In React Native the name is passed straight to the native module and is a real file on disk.

## Overriding the driver

`driver` takes either a registered **name** or a **factory object**, and as a name it is typed per `(dialect, jsEnvironment)` pair, so an invalid combination is a compile error rather than a confusing runtime failure:

| Dialect      | `node` (default) | `bun`       | `web`         | `react-native` |
| ------------ | ---------------- | ----------- | ------------- | -------------- |
| sqlite       | `sqlite3`        | `bun-sqlite`| `sqlite-wasm` | `sqlite-rn`    |
| postgres     | `pg`             | `bun-sql`   | —             | —              |
| cockroachdb  | `pg`             | `bun-sql`   | —             | —              |
| mysql        | `mysql2`         | `bun-sql`   | —             | —              |
| mariadb      | `mysql2`         | `bun-sql`   | —             | —              |
| mssql        | `mssql`          | `mssql`     | —             | —              |

An omitted `jsEnvironment` (`"auto"`) resolves the names against **Node**, because the type system cannot know the real runtime. Set it explicitly to unlock a runtime's names with autocomplete:

```ts
const sql = new SqlDataSource({
  type: "sqlite",
  database: ":memory:",
  jsEnvironment: "web", // unlocks driver: "sqlite-wasm"
  driver: "sqlite-wasm",
});
```

Only SQLite has a web or React Native driver. Asking for postgres on web **by name** throws `DriverNotFoundError` instead of silently booting the Node `pg` pool — a Node server cannot serve a browser anyway, and the quiet fallback only deferred the failure. A custom factory still works there, since it makes no claim about the runtime.

## Registering a custom driver

Anything not covered by the table plugs in through `driver`, which accepts a factory object as well as a name. Passing one *is* the custom path — there is no sentinel to set and no second option to keep in sync:

```ts
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

The factory's `create()` runs per datasource, so clones and read replicas each get their own adapter, and environment filtering is deliberately skipped — you opted in explicitly. The declared dialect still has to match the one configured on the datasource; a mismatch throws a message naming both.

Because a factory is a value rather than a name, it is also the only way to fill a `(dialect, jsEnvironment)` pair that has no builtin — the row of dashes in the table above.

For drivers that should be selectable **by name** and shared process-wide, use `registerDriverAdapter` instead — see [Native Bun Drivers](./bun-drivers.md#registering-custom-drivers).

## Requirements and limits

- **Crypto.** UUID and ULID generation needs `crypto.getRandomValues`. Browsers require a secure context (HTTPS, or `localhost`); React Native needs a polyfill such as `react-native-get-random-values`. Without it, identity-generating calls throw a `PlatformUnsupportedError` naming the fix rather than falling back to weak randomness.
- **No filesystem.** The web and React Native platform adapters have no `fs`. File operations throw `PlatformUnsupportedError`.
- **Migrations.** Migration files are modules resolved from disk at runtime, which browsers cannot do. Ship a schema with the app (or run migrations from a Node process against the same database) rather than calling the migrator in the browser.
- **Streaming.** `stream()` materializes the result set and buffers it, since neither engine exposes a cursor over the full result set. The `for await` consumption API is unchanged.
- **Result shapes, transactions, and `RETURNING`** match the Node drivers exactly: inserts use SQLite's `RETURNING *` (SQLite ≥ 3.35), and transaction keywords are forwarded verbatim.
