---
title: Create Migration Command
description: "Create new migration files using Hysteria ORM CLI."
keywords: [hysteria-orm, create migration, CLI, migration file]
sidebar_position: 5
---

# Create Migration Command

The `create:migration` command generates a new migration file in your migrations directory.

## Usage

```bash
npx hysteria create:migration <name>
yarn hysteria create:migration <name>
```

## Options

- `-j, --javascript`: Generate a JavaScript migration file instead of TypeScript.
- `-a, --alter`: Generate a template for an alter table migration.
- `-c, --create`: Generate a template for a create table migration.
- `-t, --table <table>`: Specifies the target table name for the migration.

## Example

```bash
npx hysteria create:migration add_users_table --create --table users
yarn hysteria create:migration add_users_table --create --table users
```

---

Back to: [CLI Overview](./overview.md)
