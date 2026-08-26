---
title: Command Line Interface Overview
description: "Command line interface for Hysteria ORM: migrations, seeders, SQL execution, and schema management."
keywords: [hysteria-orm, CLI, command line, migrations, seeders]
sidebar_position: 1
---

# Command Line Interface (CLI)

The Hysteria ORM CLI provides a set of commands to manage your database and schema, automate migrations, and run SQL directly from the command line.
If working with typescript (dev environment), you must install `typescript` and `esbuild` as dev dependencies in your project.

## Accessing the CLI

The CLI is available as a package in your project. You can access it using the `npx` command:

```bash
npx hysteria <command>
yarn hysteria <command>

# For CommonJS projects (deprecated)
npx hysteria-cjs <command>
```

## Available Commands

- **Migrations**: Create, run, rollback, and refresh migrations.
- **Sync**: Sync the database schema with your models metadata directly, without creating migration files.
- **Seeders**: Create and run database seeders for populating initial or test data.
- **Run SQL**: Execute raw SQL queries or files against your database.
- **Refresh**: Drop all tables or rollback all migrations, then re-run all migrations.
- **Create Migration**: Generate migration files with templates.
- **Database Pull**: Generate TypeScript model files from existing database schema.

See the sidebar for detailed documentation on each command.

## Datasource-first workflow

CLI commands accept a `--datasource` (`-d`) option pointing to a file that exports a default `sql` instance. This keeps configuration in one place and avoids repeating connection flags.

---

Next: [Migrations](./migrations/basics.md)
