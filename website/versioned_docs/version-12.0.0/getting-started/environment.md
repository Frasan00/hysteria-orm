---
title: Environment Variables
description: "Environment variables configuration for Hysteria ORM database connections."
keywords:
  [hysteria-orm, environment variables, configuration, database credentials]
sidebar_position: 4
---

# Environment Variables

Hysteria ORM supports configuration via environment variables. Here are the most common variables:

## SQL Databases

- `DB_TYPE` (postgres, mysql, mariadb, sqlite, cockroachdb, mssql)
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_DATABASE`
- `DB_LOGS` (true/false)

### MSSQL-Specific

- `MSSQL_TRUST_SERVER_CERTIFICATE` (true/false) - Trust self-signed certificates

## MongoDB

- `MONGO_URL`
- `MONGO_LOGS` (true/false)

## Redis

- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_USERNAME`
- `REDIS_PASSWORD`
- `REDIS_DATABASE`

---

Next: [TypeScript Usage](./typescript.md)
