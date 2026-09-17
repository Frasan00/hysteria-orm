---
title: Refresh Migrations Command
description: "Refresh database: reset migrations and re-seed data in Hysteria ORM."
keywords: [hysteria-orm, refresh database, reset migrations, re-seed]
sidebar_position: 4
---

# Refresh Migrations Command

The `refresh` command rolls back all migrations (or drops all tables) and then re-runs all migrations from scratch.

## Usage

```bash
yarn hysteria refresh
```

## Options

- `-f, --force`: Drop all tables before running migrations (instead of running down migrations).
- `-m, --migration-path [path]`: Path to the migrations.
- `-d, --datasource [path]`: Path to a sql file (default export).
- `-t, --transactional`: Runs all the pending migrations in a single transaction, this does not apply to mysql since it does not support transactions inside schema changes.

## Example

```bash
# Using a sql file
yarn hysteria refresh --force -d ./database/index.ts

# Alternative with explicit connection flags
yarn hysteria refresh --force -t postgres -h localhost -d test -u root -p root
```

---

Back to: [CLI Overview](./overview.md)
