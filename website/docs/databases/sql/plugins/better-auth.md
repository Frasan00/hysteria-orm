---
title: Better Auth (Experimental)
description: "Better Auth database adapter for Hysteria ORM."
keywords: [hysteria-orm, better-auth, authentication, adapter]
sidebar_position: 2
---

# Better Auth Integration

:::warning Experimental
This feature is experimental and may change in future versions. Use with caution in production environments.
:::

Hysteria ORM ships a database adapter for [Better Auth](https://www.better-auth.com/), so Better Auth
can persist its `user`, `session`, `account`, and `verification` tables through your existing
`SqlDataSource` - same connection pool, same transactions, same replication setup - instead of
opening a second connection through Better Auth's built-in Kysely adapter.

## Installation

`better-auth` is an optional peer dependency and is loaded lazily via a dynamic `import()` - it is
never required just to import `hysteria-orm`. Install it in whichever environment actually runs the
adapter:

```bash
npm install better-auth
```

If you only need Better Auth's types during development (for example your production build installs
dependencies separately), a type-only import is enough locally:

```typescript
import type { BetterAuthOptions } from "better-auth";
```

Calling any method on the adapter without `better-auth` installed throws a clear
`Driver 'better-auth' not found, it's likely not installed, try running 'npm install better-auth'`
error - the rest of `hysteria-orm` keeps working either way.

## Basic Setup

```typescript
import { betterAuth } from "better-auth";
import { betterAuthAdapter, SqlDataSource } from "hysteria-orm";

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "root",
  password: "root",
  database: "test",
});

await sql.connect();

export const auth = betterAuth({
  database: betterAuthAdapter(sql),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
});
```

## Creating the Auth Tables

The adapter does **not** support Better Auth's CLI `generate`/`migrate` commands - write a regular
Hysteria migration for the four core tables instead. This mirrors
[Better Auth's core schema](https://www.better-auth.com/docs/concepts/database#core-schema):

```typescript
import { Migration } from "hysteria-orm";

export default class extends Migration {
  async up() {
    this.schema.createTable("user", (t) => {
      t.varchar("id", 36).primaryKey();
      t.varchar("name", 255).notNullable();
      t.varchar("email", 255).notNullable().unique();
      t.boolean("emailVerified").notNullable();
      t.varchar("image", 2083);
      t.datetime("createdAt").notNullable();
      t.datetime("updatedAt").notNullable();
    });

    this.schema.createTable("session", (t) => {
      t.varchar("id", 36).primaryKey();
      t.datetime("expiresAt").notNullable();
      t.varchar("token", 255).notNullable().unique();
      t.datetime("createdAt").notNullable();
      t.datetime("updatedAt").notNullable();
      t.varchar("ipAddress", 255);
      t.varchar("userAgent", 255);
      t.varchar("userId", 36).notNullable();
    });

    this.schema.createTable("account", (t) => {
      t.varchar("id", 36).primaryKey();
      t.varchar("accountId", 255).notNullable();
      t.varchar("providerId", 255).notNullable();
      t.varchar("userId", 36).notNullable();
      t.varchar("accessToken", 2083);
      t.varchar("refreshToken", 2083);
      t.varchar("idToken", 2083);
      t.datetime("accessTokenExpiresAt");
      t.datetime("refreshTokenExpiresAt");
      t.varchar("scope", 255);
      t.varchar("password", 255);
      t.datetime("createdAt").notNullable();
      t.datetime("updatedAt").notNullable();
    });

    this.schema.createTable("verification", (t) => {
      t.varchar("id", 36).primaryKey();
      t.varchar("identifier", 255).notNullable();
      t.varchar("value", 255).notNullable();
      t.datetime("expiresAt").notNullable();
      t.datetime("createdAt");
      t.datetime("updatedAt");
    });
  }

  async down() {
    this.schema.dropTableIfExists("session");
    this.schema.dropTableIfExists("account");
    this.schema.dropTableIfExists("verification");
    this.schema.dropTableIfExists("user");
  }
}
```

## Plugin Support

The adapter is **not** hardcoded to the four core tables - every Better Auth method (`create`,
`findOne`, `findMany`, `update`, `updateMany`, `delete`, `deleteMany`, `count`, `incrementOne`) takes
a `model` name and routes it straight to `sql.from(model)`. Any plugin that only needs standard CRUD
against its own table(s) - two-factor, passkey, magic-link, email-otp, username, phone-number,
multi-session, admin, api-key, one-time-token, and **organizations/teams** - works with the adapter
as-is. You only need to:

1. Add the plugin to `betterAuth({ plugins: [...] })`, same as with any other database adapter.
2. Create the plugin's tables with a Hysteria migration, matching the field names and types
   [documented for that plugin](https://www.better-auth.com/docs/plugins).

For example, the [organization plugin](https://www.better-auth.com/docs/plugins/organization) (with
teams enabled) needs five extra tables plus two columns on `session`:

```typescript
this.schema.alterTable("session", (t) => {
  t.varchar("activeOrganizationId", 36);
  t.varchar("activeTeamId", 36); // only if teams are enabled
});

this.schema.createTable("organization", (t) => {
  t.varchar("id", 36).primaryKey();
  t.varchar("name", 255).notNullable();
  t.varchar("slug", 255).notNullable().unique();
  t.varchar("logo", 2083);
  t.datetime("createdAt").notNullable();
  t.datetime("updatedAt");
  t.varchar("metadata", 4000);
});

this.schema.createTable("member", (t) => {
  t.varchar("id", 36).primaryKey();
  t.varchar("organizationId", 36).notNullable();
  t.varchar("userId", 36).notNullable();
  t.varchar("role", 255).notNullable();
  t.datetime("createdAt").notNullable();
});

this.schema.createTable("invitation", (t) => {
  t.varchar("id", 36).primaryKey();
  t.varchar("organizationId", 36).notNullable();
  t.varchar("email", 255).notNullable();
  t.varchar("role", 255);
  t.varchar("status", 255).notNullable();
  t.datetime("expiresAt");
  t.datetime("createdAt").notNullable();
  t.varchar("inviterId", 36).notNullable();
  t.varchar("teamId", 36); // only if teams are enabled
});

// Teams only:
this.schema.createTable("team", (t) => {
  t.varchar("id", 36).primaryKey();
  t.varchar("name", 255).notNullable();
  t.varchar("organizationId", 36).notNullable();
  t.datetime("createdAt").notNullable();
  t.datetime("updatedAt");
});

this.schema.createTable("teamMember", (t) => {
  t.varchar("id", 36).primaryKey();
  t.varchar("teamId", 36).notNullable();
  t.varchar("userId", 36).notNullable();
  t.datetime("createdAt").notNullable();
});
```

```typescript
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  database: betterAuthAdapter(sql),
  plugins: [organization({ teams: { enabled: true } })],
});
```

This flow - create organization, create team, invite a member, accept the invitation, list
members/organizations - is covered end to end by the adapter's test suite on sqlite, postgres, and
mysql (`test/better_auth/better_auth_organization_plugin.test.ts`).

### Atomic operations (`incrementOne`, `consumeOne`)

`incrementOne` and `consumeOne` are implemented natively (not left to Better Auth's generic
fallbacks), which Better Auth 1.7 requires of custom adapters.

`incrementOne` also covers atomic **compare-and-swap** updates, not just numeric counters -
accepting an invitation transitions its status from pending to accepted only if it is still pending:

```typescript
adapter.incrementOne({
  model: "invitation",
  increment: {},
  set: { status: "accepted" },
  where: [
    { field: "id", value: invitationId },
    { field: "status", value: "pending" },
  ],
});
```

That's a single `UPDATE ... WHERE id = ? AND status = 'pending'` statement, so the guard and the
write are atomic together - a concurrent second accept affects zero rows and gets `null` back
instead of racing the first one. Plain numeric increments (rate limits, usage counters) work the
same way, in one statement per call.

`consumeOne` reads a row then deletes it by the same `where` - used for single-use credentials
(one-time tokens, magic links). No transaction needed: DELETE is atomic, so of two concurrent
callers only one's delete affects a row and wins.

## Config Support

`databaseHooks`, `user`/`session`/`account`.`additionalFields`, and database-backed `rateLimit` all
work as documented by Better Auth - each is verified by the adapter's test suite, not just assumed:

- **`databaseHooks`** (`user.create.before/after`, `update.before/after`, same for `session`/
  `account`/`verification`) run entirely inside Better Auth's own `createWithHooks` layer, above the
  adapter - they call the exact same `create`/`update` the adapter already implements, so they compose
  correctly with no extra work here.
- **`additionalFields`** on any model are just more keys in the `data`/`update` objects the adapter
  already passes straight through to `insert`/`update` - add the matching column via your migration
  and it round-trips like any other field.
- **`rateLimit: { storage: "database" }`** uses plain `create`/`updateMany`/`findOne` against a
  `rateLimit` table (`key`, `count`, `lastRequest`) - standard CRUD, no special adapter support
  needed. `storage: "memory"` (the default) and `storage: "secondary-storage"` don't touch the
  database adapter at all.
- **`secondaryStorage`** (e.g. Redis-backed sessions) is independent of the database adapter by
  design - whatever you configure it for bypasses `betterAuthAdapter` entirely for those reads/writes.
- **Plugin API hooks** (the top-level `hooks: { before, after }` option) run purely at the
  request/endpoint layer and never touch the adapter.

### `advanced.database.generateId`

The default (random string ids) and a custom `generateId` function or `"uuid"` are fully supported -
Better Auth generates the id itself before calling `create`, so the adapter never needs to.

`generateId: "serial"` or `generateId: false` (database-generated ids) only work on **postgres,
cockroachdb, and mssql** - the raw query builder can hand back the DB-generated row on insert there
(`RETURNING`/`OUTPUT`), the same mechanism `incrementOne` and `update` rely on elsewhere in this
adapter. mysql, mariadb, sqlite, and oracledb have no equivalent path through the raw table-string
query builder (only Hysteria's typed Model query builder implements a driver-specific last-insert-id
follow-up, which isn't reachable here since Better Auth passes table names, not typed models) - on
those dialects the adapter throws a clear error instead of silently inserting a row with no id. Stick
to the default id generation (as used throughout this page) unless you specifically need serial ids
on one of the three supported dialects. Both outcomes are covered by
`test/better_auth/better_auth_serial_id.test.ts`.

## Capability Detection

The adapter reads `sql.getDbType()` and configures Better Auth's storage capabilities automatically,
since the underlying query builder does not serialize values for you:

| Dialect                 | JSON | Dates | Booleans | Arrays |
| ------------------------ | :--: | :---: | :------: | :----: |
| `postgres`, `cockroachdb` |  ✅  |  ✅   |    ✅    |   ✅   |
| `mysql`, `mariadb`       |  ✅  |  ✅   |    ❌    |   ❌   |
| `mssql`, `oracledb`      |  ❌  |  ✅   |    ❌    |   ❌   |
| `sqlite`                 |  ❌  |  ❌   |    ❌    |   ❌   |

Where a capability is `❌`, Better Auth stores the value as text/number itself (e.g. booleans as
`0`/`1` on MySQL) and converts it back on read - this is exactly what Better Auth's own adapters do
for the same dialects.

**Test coverage**: sqlite, postgres, and mysql are covered end to end by the test suite. mssql is
verified for insert-returning only (not a full auth flow). mariadb, cockroachdb, and oracledb have
no live verification - their row in the table above is inferred from the query builder's interpreter
source, not tested.

Override any of these, or other adapter options, with the second argument:

```typescript
betterAuthAdapter(sql, {
  usePlural: true, // tables named "users", "sessions", ...
  supportsJSON: true, // force JSON support on a dialect the table above marks unsupported
  debugLogs: true,
});
```

## Transactions

`betterAuthAdapter` wires Better Auth's transaction support to `sql.transaction()`, so operations
Better Auth groups into a transaction (for example creating a user and its account together) commit
or roll back atomically through the same pool as the rest of your app.

## Limitations

- No `createSchema` support - Better Auth's CLI `generate`/`migrate` commands don't work with this
  adapter; use a Hysteria migration as shown above.
- No `join` support - Better Auth falls back to separate queries when the adapter doesn't implement
  joins, which is the case here.
- `advanced.database.generateId: "serial"` / `false` (database-generated ids) only works on
  postgres, cockroachdb, and mssql - see [Config Support](#config-support) above.
