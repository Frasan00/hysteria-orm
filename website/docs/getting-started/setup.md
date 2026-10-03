---
title: Setup & Configuration
description: "Create a SqlDataSource, choose strict or lazy connections, and use Hysteria ORM from TypeScript or JavaScript."
keywords: [hysteria-orm, setup, SqlDataSource, TypeScript, JavaScript]
---

# Setup & configuration

Every SQL operation goes through a `SqlDataSource`. The full option reference lives in [SQL ORM Introduction](/databases/sql/introduction); this page covers the setup workflow, connection modes, and language usage.

## Create a data source

```typescript
import { SqlDataSource, defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    email: col.string(),
  },
});

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "root",
  password: "root",
  database: "test",
  models: { User },
});

await sql.connect();

const users = await sql.from(User).many();

await sql.disconnect();
```

Omit the options to read connection details from environment variables. See [Installation](/getting-started/installation#environment-variables) for the variable list.

## Connection modes

| Mode             | `lazyLoad` | Behavior                                                    |
| ---------------- | ---------- | ----------------------------------------------------------- |
| Strict (default) | `false`    | Every operation requires an explicit `await sql.connect()`. |
| Lazy             | `true`     | The first query connects automatically.                     |

```typescript
const sql = new SqlDataSource({ type: "postgres", lazyLoad: true });
const users = await sql.from(User).many(); // connects on demand
```

In strict mode, running a query before `connect()` throws `CONNECTION_NOT_ESTABLISHED`.

## TypeScript usage

Hysteria ORM is written in TypeScript, so models and query results are inferred from your definitions. A typical `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

Set `experimentalDecorators: true` only if you use the [`@atomic` decorator](/databases/sql/advanced/transactions).

Column names and types flow through the query builder:

```typescript
const users = await sql.from(User).many(); // { id: number; name: string }[]
const ids = await sql.from(User).select("id").many(); // { id: number }[]
const renamed = await sql.from(User).select("id", ["name", "superName"]).many();
// { id: number; superName: string }[]
```

Define relations with `defineRelations` + `createSchema`; see [Defining Models](/databases/sql/models/define-model).

## JavaScript usage

The functional API works in plain JavaScript, and Node.js 22's top-level `await` is enough for ESM scripts. Type errors are not checked at build time, but every runtime feature is available.

```javascript
const { SqlDataSource, defineModel, col } = require("hysteria-orm");

const User = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.string(),
    isActive: col.boolean(),
  },
  indexes: [["name"]],
});

const sql = new SqlDataSource({
  type: "sqlite",
  database: "app.db",
  models: { User },
});

await sql.connect();
const active = await sql.from(User).where("isActive", true).many();
await sql.disconnect();
```

## Other data sources

MongoDB and Redis use the same lifecycle through `MongoDataSource` and `redis`. See [MongoDB](/databases/nosql/mongodb/introduction) and [Redis](/databases/nosql/redis/introduction).

## See also

- [Installation](/getting-started/installation)
- [Logging](/getting-started/logging)
