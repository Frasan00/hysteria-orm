# Changelog

All notable changes to this project are documented in this file starting from 12.0.0. Version 11.x and earlier history is not tracked here.

## 12.0.0 - unreleased

### Breaking changes

- **Hooks removed.** `afterFetch`, `beforeInsert`, `beforeInsertMany`, `beforeUpdate`, and `beforeDelete` no longer exist. Only `beforeFetch` remains (mutates the query builder once per query, still async-capable). The `ignoreHooks`, `ignoreBeforeUpdateHook`, and `ignoreBeforeDeleteHook` options are gone.
  - Write-time defaults now live in the database: UUID and datetime columns get native DDL defaults (`gen_random_uuid()`, `DEFAULT (UUID())`, `NEWID()`, `lower(hex(randomblob(16)))`, `NOW()`/`CURRENT_TIMESTAMP`).
  - Query-result transforms that used `afterFetch` must move to application code after `many()`/`one()`.
- **Oracle support removed.** The `oracledb` driver, interpreter, `handleOracleIdentityInsert`, and CLI/docker-compose integration are deleted. Supported dialects: postgres, mysql, mariadb, sqlite, mssql, cockroachdb.
- **`many()`/`stream()` result serialization is now synchronous.** No per-row `Promise.all` or async lifecycle callbacks; rows are shallow-copied onto the model prototype with aliased column names.
- **`serialize`/`prepare` are synchronous.** A `serialize` that returns a Promise now throws.
- **`autoInsertColumns`/`autoUpdateColumns` machinery removed.** Casing is applied via `SELECT ... AS` aliases; no per-query column re-fill.
- **Min DB versions bumped:** PostgreSQL 13+, MySQL 8.0.13+, MariaDB 10.5+, SQLite 3.35+, MSSQL 2019+.
- **Driver resolution no longer falls back across environments.** A dialect with no driver for the resolved runtime now throws `DriverNotFoundError` instead of quietly resolving to the Node factory — e.g. `jsEnvironment: "web"` with `type: "postgres"` used to boot a Node `pg` pool that could never have worked in a browser. The fallback is kept only for `bun` → `node`, which is legitimate (there is no Bun-native `mssql`).
- **`ResolvedJsEnvironment` gains `"react-native"`.** Consumer code doing an exhaustive `switch` over the environment that ends in `const _never: never = env` no longer compiles until the new member is handled.

### Features

- **Web and React Native SQLite drivers.** `jsEnvironment: "web"` resolves to `@sqlite.org/sqlite-wasm` and `"react-native"` to `@op-engineering/op-sqlite`, both optional peer dependencies loaded lazily so Node and Bun bundles never pull them in. Neither path touches a Node API. Browser SQLite is in-memory for `:memory:` and OPFS-backed for any other name (requires a dedicated worker plus COOP/COEP headers); React Native opens a real file. See [Web & React Native Drivers](website/docs/databases/sql/web-and-react-native-drivers.md).
- **Type-safe `driver` prop.** A registered name is now a union narrowed by `(dialect, jsEnvironment)` — postgres on Node offers `pg`, postgres on Bun offers `bun-sql`, and a pair with no builtin offers nothing. Omitting `jsEnvironment` resolves against the Node names, so existing configs keep compiling. A `(string & {})` hatch keeps names registered through `registerDriverAdapter` assignable; unknown names are caught at runtime by `DriverNotFoundError`.
- **Third-party drivers: pass the factory as `driver`.** `driver` now accepts an inline `DriverAdapterFactory` alongside the name form, so `driver: { name, dialects, create }` is the custom path — no `"custom"` sentinel, no separate option to keep in sync. The factory declares the dialects it serves, builds the adapter per datasource (clones and replicas each get their own), and skips environment filtering since passing one is already an explicit opt-in. A declared-dialect mismatch names both sides in the error, and an object that is not a factory is rejected with a message instead of a `TypeError`.
- **Worker runtimes are detected as `"web"`.** A Web or Service Worker has no `window`, `document`, or `process`, so it previously resolved to `"node"` and crashed at import time dereferencing `process.env`. `NodePlatformAdapter.readEnv` is also guarded now. React Native crypto degrades from `randomUUID` to a `getRandomValues`-built v4 UUID, and throws an actionable `PlatformUnsupportedError` when neither exists instead of falling back to weak randomness.

- **`sqlFunc` global namespace.** Symbolic expression tokens (`$uuid`, `$now`, `$currentTimestamp`) rendered per-dialect by the interpreter. Available in migration column DDL defaults (`table.<type>(...).default(sqlFunc.uuid())`) and `update().set({ col: sqlFunc.now() })` expression values. `where()`/complex-expression usage is planned for 12.1.
- **`RETURNING` on writes.** Insert/insertMany/update/delete can return generated values across dialects: native `RETURNING` (postgres, cockroachdb, sqlite, mariadb), `OUTPUT inserted.*` (mssql, with `AS` aliases), and follow-up `SELECT` (mysql).
- **DB-generated column defaults on reads.** Columns omitted from INSERT that have database defaults now come back automatically via RETURNING when requested.

### Deferred to 12.1

- `sqlFunc` inside `where()` and custom/user-defined tokens.
- DB-generated UUID/ULID defaults on MySQL/MariaDB primary keys; native ULID database functions.
- pg `setTypeParser` bigint/numeric coercion change (explicit opt-in later).
