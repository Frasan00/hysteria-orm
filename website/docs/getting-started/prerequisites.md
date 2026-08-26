---
title: Prerequisites
description: "Prerequisites for using Hysteria ORM: Node.js, TypeScript, and database driver requirements."
keywords: [hysteria-orm, prerequisites, Node.js requirements, TypeScript setup]
sidebar_position: 1
---

# Prerequisites

Welcome to **Hysteria ORM**! Before you get started, ensure your environment meets the following requirements:

## Runtime Requirements

- **Node.js** v22 or higher
- **TypeScript** v5 or higher (recommended)
- **NPM**, **Yarn** or **pnpm**

## Supported Databases

| Database    | Support Level                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| PostgreSQL  | Full support                                                                                         |
| MySQL       | Full support                                                                                         |
| MariaDB     | Full support                                                                                         |
| SQLite      | Full support (some alter table limitations)                                                          |
| CockroachDB | Second-class (some query limitations)                                                                |
| MSSQL       | Second-class (see [limitations](../databases/sql/introduction.md#mssql-sql-server-some-limitations)) |
| OracleDB    | Experimental (see [limitations](../databases/sql/introduction.md#oracledb-limitations))              |
| MongoDB     | Experimental                                                                                         |
| Redis       | Caching and key-value storage                                                                        |

---

Next: [Installation](./installation.md)
