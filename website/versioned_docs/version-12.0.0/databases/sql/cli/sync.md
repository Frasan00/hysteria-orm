---
title: Sync Schema Command
description: "Synchronize models with database schema using sync command in Hysteria ORM."
keywords: [hysteria-orm, sync, schema synchronization, auto-sync]
sidebar_position: 6
---

# Sync Schema Command

The `sync` command inspects your live database schema and your registered models, computes a diff, and applies the SQL statements directly to reconcile them. This is a shortcut for the `generate:migrations` + `migrate` workflow when you want to apply schema changes without creating migration files.

:::warning
This command applies changes directly to the database. Always use `--dry` first to review the SQL statements that would be executed. Not supported for SQLite or CockroachDB.
:::

## Usage

```bash
npx hysteria sync -d ./database/index.ts
yarn hysteria sync -d ./database/index.ts
```

## Options

- `-d, --datasource [path]` — Path to a file exporting a default `sql` instance (with models registered). **Required.**
- `-c, --tsconfig [tsconfigPath]` — Path to tsconfig.json to load TypeScript files. Defaults to `./tsconfig.json`.
- `-f, --dry` — Does not apply changes but only outputs the SQL statements that would be executed.
- `-t, --transactional` — Runs all the sync statements in a single transaction.

## Dry Run

Always preview changes before applying:

```bash
npx hysteria sync -d ./database/index.ts --dry
```

This outputs the SQL statements without executing them.

## Transactional Sync

Wrap all sync statements in a single transaction so they either all succeed or all roll back:

```bash
npx hysteria sync -d ./database/index.ts --transactional
```

## Requirements

Your datasource file must register the models you want to sync. The sync command compares the registered models' metadata against the live database schema:

```typescript
import { SqlDataSource } from "hysteria-orm";
import { User } from "./models/user";
import { Post } from "./models/post";

const db = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "root",
  password: "root",
  database: "mydb",
  models: { User, Post },
});

await db.connect();
export default db;
```

## Supported Databases

- MySQL
- MariaDB
- PostgreSQL
- CockroachDB (schema introspection differences may produce incorrect statements — always review `--dry` output carefully)

SQLite is not supported due to its limited `ALTER TABLE` capabilities.

## When to Use

- **Development**: Quickly sync your database with model changes without managing migration files.
- **Prototyping**: Rapidly iterate on your schema without accumulating migration files.

For production environments, prefer `generate:migrations` to create tracked, reviewable migration files.

---

Back to: [CLI Overview](./overview.md)
