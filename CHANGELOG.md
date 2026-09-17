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

### Features

- **`sqlFunc` global namespace.** Symbolic expression tokens (`$uuid`, `$now`, `$currentTimestamp`) rendered per-dialect by the interpreter. Available in migration column DDL defaults (`table.<type>(...).default(sqlFunc.uuid())`) and `update().set({ col: sqlFunc.now() })` expression values. `where()`/complex-expression usage is planned for 12.1.
- **`RETURNING` on writes.** Insert/insertMany/update/delete can return generated values across dialects: native `RETURNING` (postgres, cockroachdb, sqlite, mariadb), `OUTPUT inserted.*` (mssql, with `AS` aliases), and follow-up `SELECT` (mysql).
- **DB-generated column defaults on reads.** Columns omitted from INSERT that have database defaults now come back automatically via RETURNING when requested.

### Deferred to 12.1

- `sqlFunc` inside `where()` and custom/user-defined tokens.
- DB-generated UUID/ULID defaults on MySQL/MariaDB primary keys; native ULID database functions.
- pg `setTypeParser` bigint/numeric coercion change (explicit opt-in later).
