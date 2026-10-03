# Changelog

All notable changes to this project are documented in this file starting from 12.0.0. Version 11.x and earlier history is not tracked here.

## [Unreleased]

### Features

- **CTE, set-operation, and join parity on the query builder.** `withSchema(schema)` qualifies a CTE, `withNotMaterialized(alias, cb)` emits `AS NOT MATERIALIZED` (Postgres/CockroachDB), `using(...columns)` renders `USING (...)` on `join`/`innerJoin`/`leftJoin`/`rightJoin` (plus bare-`join` overloads) and is rejected on MSSQL, `fromRaw(raw, bindings?)` builds a raw `FROM` (also `sql.fromRaw`), `intersect`/`except` join set operations, and `crossJoin(table, alias?)` adds a `cross join`.
- **Negated-column and extended JSON predicates.** `whereNotColumn` (plus `andWhereNotColumn`/`orWhereNotColumn`); `whereJsonObject`/`whereNotJsonObject`, `whereJsonPath`, `whereJsonSupersetOf`/`whereJsonSubsetOf`, and `whereJsonHasNone`, each with `and`/`or` variants; and `columnInfo([column])` for query-time column metadata.
- **Extended HAVING helpers.** `havingNull`/`havingNotNull`, `havingIn`/`havingNotIn` (array or subquery), `havingBetween`/`havingNotBetween`, `havingExists`/`havingNotExists`, and `havingWrapped`, each with its `and`/`or` variant.
- **JSON mutation in `update()`.** `sql.jsonSet`, `sql.jsonInsert`, and `sql.jsonRemove` build an expression that mutates a JSON column at a `'$.a.b'` path or segment array. `jsonSet` works on every dialect; `jsonInsert` and `jsonRemove` work on PostgreSQL, MySQL/MariaDB, and SQLite, while MSSQL supports only `jsonSet` (`JSON_MODIFY`).
- **Postgres lock strengths.** `forNoKeyUpdate()` and `forKeyShare()` add the two weaker row locks, both accepting `{ skipLocked, noWait }`; they throw `LOCK_STRENGTH_NOT_SUPPORTED_IN_*` outside PostgreSQL.
- **Per-query timeout.** `timeout(ms, { cancel })` rejects with a `QUERY_TIMEOUT` `HysteriaError` once the limit is exceeded. With `cancel: true`, PostgreSQL cancels through `pg_cancel_backend`, MySQL/MariaDB through `KILL QUERY`, and MSSQL through `Request.cancel()`; SQLite and Bun only enforce the wall-clock timeout.

### Bug fixes

- **HAVING clauses were joined without a separator.** `HavingNode` chained with a trailing space, so two conditions rendered as `... $2or  "x"`; it now uses a leading space like `WHERE`.
- **MySQL/SQLite HAVING emitted Postgres-style `$n` placeholders.** Any HAVING condition with a bound value produced invalid SQL on those dialects; placeholders are now dialect-correct (`?`).
- **Update `SET` parameter numbering is now sequential.** The update interpreters numbered placeholders by column index, which misaligned once an expression value contributed its own bindings; values are numbered as they are bound, and expression nodes (SQL functions, JSON mutations) render in place with their bindings.
- **MSSQL ignored `isNegated` on raw-column WHERE predicates.** Negated raw-column conditions now wrap the predicate in `not (...)`.
- **MySQL and MariaDB disagreed on JSON object equality.** Structural equality is emitted per dialect (`CAST(? AS JSON)` on MySQL, plain text on MariaDB).

## [12.1.0] - 2026-10-03

### Features

- **Dialect-typed SQL comments and optimizer hints on the query builder.** `comment(comment)` prepends a native SQL comment before `SELECT` and `hintComment(hint)` emits an optimizer hint (`/*+ ... */`) immediately after the `SELECT` keyword, where MySQL and Oracle read it. Both are available on `sql.from("table")` and `sql.from(Model)`, select-only, and stackable (repeated `hintComment()` calls merge into a single hint comment, matching Knex); they survive `clone()` and are cleared with `clearComment()` / `clearHintComment()`. The argument is the comment literal as it appears in SQL — `-- line`, `/* block */`, plus `# line` and `/*! executable */` on MySQL/MariaDB — and is type-checked against the active dialect: `#` comments and `/*+ */` hints are compile errors on PostgreSQL/SQLite/MSSQL. This required threading the dialect generic through the query builder’s `select()`/`from()` chain. Line comments are terminated with a newline so they cannot comment out the rest of the statement. A value that could escape the comment (a newline inside a line comment, a nested `*/` in a block comment) or contains `?` is rejected with `INVALID_SQL_COMMENT`. Note that `/*+ ... */` is only an optimizer hint on MySQL/Oracle; PostgreSQL reads it only with the `pg_hint_plan` extension, SQLite ignores it, and MSSQL uses `OPTION (...)`, so on those dialects it is a plain comment.

## [12.0.2] - 2026-09-19

### Bug fixes

- **jsonb values written through the Bun driver were double-encoded.** A column's `prepare` returns the payload as a JSON string, which node `pg` coerces into `jsonb` but `Bun.sql` binds as a JSON _string_, storing `"{\"sandbox\":true}"` rather than the object. Reads still worked (the column's `serialize` re-parses), so the defect was silent, but `->>` returned `NULL` on the column, which broke SQL-side filters over it. A string payload bound to a `jsonb` column now emits `::text::jsonb`, parsing the text into the document; the bare `::jsonb` used for object payloads is a no-op on an already-string value. Applies to `insert` and `update` on `postgres` and `cockroachdb`.
- **`acquireLock`/`releaseLock` leaked the lock when a transaction ran between them.** `pg_try_advisory_lock` is session-scoped, but both calls went through the pool, so under Bun.sql — where a transaction rotates the pooled connection — the unlock ran on a different backend and the lock stayed held, making every later `acquireLock` for that key return `false` for the life of the process. Locks now share one dedicated reserved session from acquire to release; it is returned to the pool once the last key is unlocked, and released on `disconnect()` if the caller never unlocks.

## [12.0.1] - 2026-09-18

### Features

- **`sqlFunc` tokens in `where()` and `having()`.** A symbolic token can now stand in as the right-hand side of a predicate and renders inline instead of being bound as a parameter: `where("created_at", "<", sqlFunc.now())`. Previously the `SqlFuncNode` was handed to the driver as a bound value, producing a driver error or `[object Object]`.
- **Custom `sqlFunc` tokens.** `registerSqlFuncRenderer(dialect, renderer)` (also exported as the `SqlFuncRenderer` type) registers a renderer for a dialect, or for every dialect via `"*"`. A renderer returns `undefined` to fall through to the next one, then to the built-in tokens; an unregistered function name renders as `fn(args)`.
- **`coerceNumericTypes` input option.** Opt-in, `postgres`/`cockroachdb` only, off by default. When enabled the `pg` driver parses `int8` to a real `bigint` and `numeric` to a `number` instead of the strings it returns today, which matters on result paths that bypass a model column's `serialize` (`rawQuery`, `sql.from("table")`, `selectRaw` aliases, generic `col<T>()`). Enabling it is breaking for callers comparing against strings. A caller-supplied `driverOptions.types` takes precedence. The Bun driver ignores the flag.

### Bug fixes

- **MySQL/MariaDB uuid columns get a native DDL default.** `create table` now emits `varchar(36) default (uuid())`, so rows inserted outside the ORM (raw SQL, another service, a data migration) receive a generated UUID instead of `NULL`. Foreign-key uuid columns are excluded, since a random FK value would violate the constraint. On MySQL the default is stripped from `alter table ... add column`, which the server rejects with ERROR 1674 (unsafe under binlog, including with `binlog_format=ROW` and `log_bin_trust_function_creators=ON`); MariaDB accepts it on both paths. Values for rows inserted through the ORM continue to be generated by `prepare`, on every dialect.
- **`col.datetime({ autoUpdate: true })` works again on the model path.** 12.0.0 dropped the `autoUpdateColumns` list when it removed the auto-column machinery, which left the flag inert: nothing added the column to an UPDATE payload, so `updated_at` stayed frozen at its insert value. The flag behaves as documented — `prepare` runs on every update regardless of whether the caller supplied the value, so an explicitly passed value is regenerated rather than preserved.
- **`autoCreate: true` no longer generates a destructive migration.** The differ compared only `constraints.default`, but the model records an auto-generated timestamp as `autoCreate` (the date column options omit `default`), so it read the column as model-has-none/db-has-one and emitted `drop default`. `db:generate` therefore produced a migration that converged on a re-run while leaving every insert failing with a NOT NULL violation, because the ORM still omits the column on insert. Implicit timestamp and auto-increment defaults (PostgreSQL `nextval`, CockroachDB `unique_rowid`) are now recognised and left alone.
- **`bun-sql` errors expose the Postgres SQLSTATE on `.code`.** Bun wraps server errors and moves the SQLSTATE into `.errno`, so consumers branching on `error.code === "23505"` behaved differently under the default Bun driver than under the node drivers, despite the adapter canonicalizing result shapes. The SQLSTATE is now also set on `.code`, with the original error preserved as `.cause`; Bun's own codes are left untouched. MySQL/MariaDB report a numeric `errno` (1062 for a duplicate key) rather than a SQLSTATE, so those are unchanged — `mysql2` reports the symbolic `ER_DUP_ENTRY` there and matching it would need a server-error-number table.
- **`t.increment("id").primaryKey()` works on SQLite.** The column interpreter already emits `integer primary key autoincrement` inline, and the builder also emitted a table-level primary key constraint, so the CREATE failed with `table "x" has more than one primary key`. The table-level constraint is now skipped when the column carries the key inline.
- **SQLite stores dates as datetimes, not epoch milliseconds.** SQLite has no date type — the column is TEXT and the value is stored as written — and neither `node-sqlite3` nor `bun:sqlite` can bind a `Date`. A `Date` reaching the driver was therefore coerced to epoch milliseconds (`1577934245000.0`), which the read path could not parse, so the model received an `Invalid Date` and ordering or comparison silently broke. Date values are now formatted to the same representation the database writes for an `autoCreate` column (`default current_timestamp`) before being bound. Other dialects bind `Date` natively and are unaffected.
- **`getSum`/`getMax`/`getMin`/`getAvg` resolve model property names.** They built their clause with `selectRaw`, which interpolates the argument verbatim, so a model property whose database column differs (`userId` → `user_id`) reached SQL untranslated and the query failed with `no such column`. They now use the same rendering path as `selectFunc()`, so the column is resolved through the model's column map and quoted per dialect. Note `getSum("*")` is not meaningful in any dialect (`sum(*)` is invalid SQL) — pass a column.
- **MariaDB keeps its dialect identity inside `alter table`.** The MySQL alter-table interpreter parsed its children with a hardcoded `"mysql"` dialect, so nested interpreters could not tell MariaDB apart from MySQL and made MySQL-only decisions for both.

### Documentation

- Corrected the `sqlFunc` per-dialect table (MySQL/MariaDB render `(uuid())`; MSSQL `now()` renders `current_timestamp`), replaced the documented `.update().set({...}).execute()` example — neither method exists, the API is `update(data, returning?)` — and documented predicate usage, custom tokens, and the MySQL `alter table` uuid limitation.

## [12.0.0] - 2026-09-18

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

- **`sqlFunc` global namespace.** Symbolic expression tokens (`$uuid`, `$now`, `$currentTimestamp`) rendered per-dialect by the interpreter. Available in migration column DDL defaults (`table.<type>(...).default(sqlFunc.uuid())`) and `update().set({ col: sqlFunc.now() })` expression values.
- **`RETURNING` on writes.** Insert/insertMany/update/delete can return generated values across dialects: native `RETURNING` (postgres, cockroachdb, sqlite, mariadb), `OUTPUT inserted.*` (mssql, with `AS` aliases), and follow-up `SELECT` (mysql).
- **DB-generated column defaults on reads.** Columns omitted from INSERT that have database defaults now come back automatically via RETURNING when requested.
