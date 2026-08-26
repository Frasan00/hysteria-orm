---
title: Installation
description: "Install Hysteria ORM with npm or yarn. Setup database drivers for PostgreSQL, MySQL, MongoDB, Redis, SQLite."
keywords: [hysteria-orm, installation, npm install, yarn add, database drivers]
sidebar_position: 2
---

# Installation

Install Hysteria ORM using your preferred package manager:

```bash
yarn add hysteria-orm
# or
npm install --save hysteria-orm
```

## Development Dependencies

When working with TypeScript, install the following dev dependencies to run the CLI and migrations:

```bash
npm install --save-dev esbuild typescript
# or
yarn add esbuild typescript -D
```

## Database Drivers

Install the driver for your target database:

| Database      | Package    |
| ------------- | ---------- |
| PostgreSQL    | `pg`       |
| MySQL/MariaDB | `mysql2`   |
| SQLite        | `sqlite3`  |
| MongoDB       | `mongodb`  |
| Redis         | `ioredis`  |
| MSSQL         | `mssql`    |
| OracleDB      | `oracledb` |

Example:

```bash
npm install pg
```

## Quick Setup with CLI

The CLI can initialize your project with the standard configuration:

```bash
npx hysteria init --type <database-type>
```

Available types: `sqlite`, `mysql`, `postgres`, `mariadb`, `cockroachdb`, `mssql`, `oracledb`, `mongodb`, `redis`

This creates:

```
your-project/
├── database/
│   ├── index.ts          # Database connection configuration
│   └── migrations/       # Migration files folder (SQL databases only)
```

The CLI also installs the required dependencies automatically.

---

Next: [Setup](./setup.md)
