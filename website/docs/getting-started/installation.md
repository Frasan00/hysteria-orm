---
title: Installation
description: "Install Hysteria ORM, add a database driver, and configure connection environment variables."
keywords: [hysteria-orm, installation, database drivers, environment variables]
---

# Installation

## Requirements

- **Node.js** 22 or higher
- **Yarn 1** or **npm**
- **TypeScript** 5+ (optional, but recommended)

Install the ORM:

```bash
yarn add hysteria-orm
# or
npm install --save hysteria-orm
```

If you use the CLI and migrations, add the dev tooling:

```bash
yarn add esbuild typescript -D
# or
npm install --save-dev esbuild typescript
```

## Supported databases

SQL: PostgreSQL, MySQL, MariaDB, SQLite, CockroachDB, MSSQL. NoSQL: MongoDB (experimental), Redis.

SQL support levels and minimum server versions live in [SQL ORM Introduction](/databases/sql/introduction).

## Database drivers

Install the driver for your database. Only the driver you use is required.

| Database        | Package   |
| --------------- | --------- |
| PostgreSQL      | `pg`      |
| CockroachDB     | `pg`      |
| MySQL / MariaDB | `mysql2`  |
| SQLite          | `sqlite3` |
| MSSQL           | `mssql`   |
| MongoDB         | `mongodb` |
| Redis           | `ioredis` |

```bash
npm install pg
```

## Environment variables

Connection details can come from the environment instead of explicit options.

| Variable                         | Used by | Description                                                                |
| -------------------------------- | ------- | -------------------------------------------------------------------------- |
| `DB_TYPE`                        | SQL     | Dialect: `postgres`, `mysql`, `mariadb`, `sqlite`, `cockroachdb`, `mssql`. |
| `DB_HOST`                        | SQL     | Database host.                                                             |
| `DB_PORT`                        | SQL     | Database port.                                                             |
| `DB_USER`                        | SQL     | Database user.                                                             |
| `DB_PASSWORD`                    | SQL     | Database password.                                                         |
| `DB_DATABASE`                    | SQL     | Database name.                                                             |
| `DB_LOGS`                        | SQL     | `true`/`false`. Enables query logging.                                     |
| `MSSQL_TRUST_SERVER_CERTIFICATE` | MSSQL   | `true`/`false`. Trust self-signed certificates.                            |
| `MONGO_URL`                      | MongoDB | Connection string.                                                         |
| `MONGO_LOGS`                     | MongoDB | `true`/`false`. Enables query logging.                                     |
| `REDIS_HOST`                     | Redis   | Redis host.                                                                |
| `REDIS_PORT`                     | Redis   | Redis port.                                                                |
| `REDIS_USERNAME`                 | Redis   | Redis username.                                                            |
| `REDIS_PASSWORD`                 | Redis   | Redis password.                                                            |
| `REDIS_DATABASE`                 | Redis   | Redis database index.                                                      |

## Scaffold with the CLI

The `init` command creates the database layer and installs the driver automatically:

```bash
npx hysteria init -t postgres
```

Available types: `postgres`, `mysql`, `mariadb`, `sqlite`, `cockroachdb`, `mssql`, `mongodb`, `redis`.

It creates `database/index.ts` (connection configuration) and `database/migrations/` (SQL only).

## See also

- [Setup & Configuration](/getting-started/setup)
- [SQL ORM Introduction](/databases/sql/introduction)
