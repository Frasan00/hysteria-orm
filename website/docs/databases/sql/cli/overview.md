---
title: CLI Reference
description: Reference every Hysteria ORM CLI command, including migrations, schema sync, seeders, raw SQL, and model generation.
keywords: [hysteria-orm, CLI, commands, migrations, seeders, schema, reference]
---

# CLI reference

The Hysteria ORM command line interface manages migrations, seeders, schema syncing, raw SQL execution, and model generation. Commands that load your application code accept a datasource file, so connection details and registered models stay in one place.

## Installation

The CLI ships with the `hysteria-orm` package. Install it as a project dependency and add `typescript` and `esbuild` as dev dependencies so the CLI can load `.ts` datasource and migration files:

```bash
npm install hysteria-orm
npm install -D typescript esbuild
```

JavaScript projects that only use `.js` files do not need the TypeScript tooling.

## Invocation

Run commands through the package binary, or execute the bundled entry point directly:

```bash
hysteria-orm <command> [options]
node lib/cli.js <command> [options]
```

## Datasource-first workflow

Most commands take `-d, --datasource <path>` pointing to a file that default-exports a `SqlDataSource`. The CLI connects if needed and reuses that instance, so you do not repeat host, port, and credential flags per command. See [SQL ORM Introduction](/databases/sql/introduction) for datasource configuration.

## Command index

| Command                    | Description                                                           | Reference                                                                |
| -------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `init`                     | Scaffold a database folder, datasource file, and migrations folder.   | [Init](#init)                                                            |
| `migrate [runUntil]`       | Run pending migrations.                                               | [Migrate](#migrate)                                                      |
| `rollback [rollbackUntil]` | Roll back applied migrations.                                         | [Rollback](#rollback)                                                    |
| `refresh`                  | Reset the schema and re-run every migration.                          | [Refresh](#refresh)                                                      |
| `sync`                     | Apply model changes to the database without creating migration files. | [Sync](#sync)                                                            |
| `create:migration <name>`  | Scaffold a new migration file.                                        | [Create migration](#create-migration)                                    |
| `generate:migrations`      | Diff models against the schema and write a migration file.            | [Generate migrations](/databases/sql/cli/migrations/generate-migrations) |
| `sql [sql]` (`run:sql`)    | Execute a raw query or SQL file.                                      | [run:sql](#run-sql)                                                      |
| `create:seeder <name>`     | Scaffold a new seeder file.                                           | [Seeders](/databases/sql/cli/seeders/basics)                             |
| `seed`                     | Run seeders from a folder or file list.                               | [Seeders](/databases/sql/cli/seeders/basics)                             |
| `db:pull`                  | Generate TypeScript models from an existing database.                 | [db:pull](/databases/sql/cli/db-pull)                                    |

## init

Creates `database/index.ts`, the migrations folder, and installs the base database dependencies.

```bash
hysteria-orm init -t postgres
```

| Flag                | Description                                                                                                           | Default |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- | ------- |
| `-t, --type <type>` | Database type. Required. One of `sqlite`, `mysql`, `postgres`, `mariadb`, `cockroachdb`, `mssql`, `mongodb`, `redis`. | —       |

## migrate

Runs pending migrations. If you pass a migration name, it runs every migration up to and including that name.

```bash
hysteria-orm migrate -d ./database/index.ts
hysteria-orm migrate 001_create_users -d ./database/index.ts
```

| Flag                          | Description                                                       | Default                             |
| ----------------------------- | ----------------------------------------------------------------- | ----------------------------------- |
| `-d, --datasource <path>`     | Datasource file that default-exports a `SqlDataSource`. Required. | —                                   |
| `-c, --tsconfig <path>`       | Path to `tsconfig.json` used to load TypeScript files.            | `./tsconfig.json`                   |
| `-m, --migration-path <path>` | Directory or glob of migration files.                             | `migrations.path` on the datasource |
| `-t, --transactional`         | Run pending migrations in a single transaction.                   | `true`                              |
| `-l, --lock`                  | Acquire an advisory lock before migrating.                        | `true`                              |
| `--lock-timeout <ms>`         | Milliseconds to wait for the advisory lock.                       | `30000`                             |

`--transactional` only affects databases that support transactional schema changes, such as PostgreSQL and CockroachDB. MySQL and MariaDB ignore it.

## rollback

Rolls back applied migrations in reverse order. If you pass a migration name, it rolls back every migration down to and including that name.

```bash
hysteria-orm rollback -d ./database/index.ts
hysteria-orm rollback 001_create_users -d ./database/index.ts
```

| Flag                          | Description                                                       | Default                             |
| ----------------------------- | ----------------------------------------------------------------- | ----------------------------------- |
| `-d, --datasource <path>`     | Datasource file that default-exports a `SqlDataSource`. Required. | —                                   |
| `-c, --tsconfig <path>`       | Path to `tsconfig.json` used to load TypeScript files.            | `./tsconfig.json`                   |
| `-m, --migration-path <path>` | Directory or glob of migration files.                             | `migrations.path` on the datasource |
| `-t, --transactional`         | Roll back migrations in a single transaction.                     | `true`                              |
| `-l, --lock`                  | Acquire an advisory lock before rolling back.                     | `true`                              |
| `--lock-timeout <ms>`         | Milliseconds to wait for the advisory lock.                       | `30000`                             |

## refresh

Resets the database and then re-runs every migration. Without `--force`, it rolls back applied migrations first.

```bash
hysteria-orm refresh -d ./database/index.ts
hysteria-orm refresh --force -d ./database/index.ts
```

| Flag                          | Description                                                          | Default                             |
| ----------------------------- | -------------------------------------------------------------------- | ----------------------------------- |
| `-f, --force`                 | Drop all tables before migrating instead of running down migrations. | `false`                             |
| `-d, --datasource <path>`     | Datasource file that default-exports a `SqlDataSource`. Required.    | —                                   |
| `-c, --tsconfig <path>`       | Path to `tsconfig.json` used to load TypeScript files.               | `./tsconfig.json`                   |
| `-m, --migration-path <path>` | Directory or glob of migration files.                                | `migrations.path` on the datasource |
| `-t, --transactional`         | Run the reset and migrations in a single transaction.                | `true`                              |
| `-l, --lock`                  | Acquire an advisory lock for the whole operation.                    | `true`                              |
| `--lock-timeout <ms>`         | Milliseconds to wait for the advisory lock.                          | `30000`                             |

## sync

Inspects the live schema and your registered models, computes a diff, and applies the SQL statements directly. This is the `generate:migrations` plus `migrate` workflow without writing migration files.

```bash
hysteria-orm sync -d ./database/index.ts --dry
hysteria-orm sync -d ./database/index.ts --transactional
```

| Flag                      | Description                                                       | Default           |
| ------------------------- | ----------------------------------------------------------------- | ----------------- |
| `-d, --datasource <path>` | Datasource file that default-exports a `SqlDataSource`. Required. | —                 |
| `-c, --tsconfig <path>`   | Path to `tsconfig.json` used to load TypeScript files.            | `./tsconfig.json` |
| `-f, --dry`               | Print the SQL statements without applying them.                   | `false`           |
| `-t, --transactional`     | Apply all statements in a single transaction.                     | `false`           |

Supported for PostgreSQL, MySQL, MariaDB, and CockroachDB. SQLite and MSSQL are not supported.

:::warning
`sync` changes the database directly. Run it with `--dry` first to review the statements, and prefer tracked migrations for production.
:::

## create:migration {#create-migration}

Scaffolds a migration file. The CLI prefixes the generated filename with a timestamp.

```bash
hysteria-orm create:migration add_users_table --create --table users
```

| Flag                  | Description                                                      | Default |
| --------------------- | ---------------------------------------------------------------- | ------- |
| `-j, --javascript`    | Generate a JavaScript file instead of TypeScript.                | `false` |
| `-a, --alter`         | Scaffold an alter-table template.                                | `false` |
| `-c, --create`        | Scaffold a create-table template.                                | `false` |
| `-t, --table <table>` | Target table for the template. Requires `--create` or `--alter`. | —       |

`--alter` and `--create` cannot be combined. See [Migrations](/databases/sql/cli/migrations/basics) for the generated file structure and templates.

## run:sql {#run-sql}

The `sql` command (alias `run:sql`) executes a raw query or a SQL file through your datasource.

```bash
hysteria-orm sql -d ./database/index.ts "SELECT 1"
hysteria-orm sql -d ./database/index.ts -f ./scripts/init.sql -o ./results/init.json
```

| Flag                      | Description                                                       | Default           |
| ------------------------- | ----------------------------------------------------------------- | ----------------- |
| `-d, --datasource <path>` | Datasource file that default-exports a `SqlDataSource`. Required. | —                 |
| `-f, --file <path>`       | Execute SQL from a file.                                          | —                 |
| `-o, --out <path>`        | Write the query result to a file.                                 | —                 |
| `-t, --tsconfig <path>`   | Path to `tsconfig.json` used to load TypeScript files.            | `./tsconfig.json` |

Provide either a positional query or `--file`, never both.

## generate:migrations

Diffs your models against the live schema and writes a migration file, in either schema-builder (`code`) or raw SQL mode. See [Generate Migrations from Models](/databases/sql/cli/migrations/generate-migrations) for the full flag list and output modes.

## Seeders

`create:seeder <name>` scaffolds seeder files and `seed` runs them from folders, single files, or comma-separated lists. See [Seeders](/databases/sql/cli/seeders/basics) for flags and examples.

## db:pull

`db:pull` introspects an existing database and generates TypeScript model files. See [db:pull](/databases/sql/cli/db-pull) for naming conventions, output options, and limitations.

## See also

- [Migrations](/databases/sql/cli/migrations/basics)
- [Advanced Migration Patterns](/databases/sql/cli/migrations/advanced)
- [Generate Migrations from Models](/databases/sql/cli/migrations/generate-migrations)
- [Seeders](/databases/sql/cli/seeders/basics)
- [db:pull](/databases/sql/cli/db-pull)
- [SQL ORM Introduction](/databases/sql/introduction)
