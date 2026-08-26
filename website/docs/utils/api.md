---
title: API Reference
description: "Complete API reference for all Hysteria ORM exports and classes."
keywords: [hysteria-orm, API reference, utilities API]
sidebar_position: 2
---

# API Reference

A summary of all main exports from Hysteria ORM:

## Core Classes

- **Model**: Base class for SQL models ([docs](../databases/sql/models/basics.md))
- **Collection**: Base class for MongoDB collections ([docs](../databases/nosql/mongodb/collections.md))
- **QueryBuilder**: SQL query builder ([docs](../databases/sql/query-builder/basics.md))
- **MongoQueryBuilder**: MongoDB query builder ([docs](../databases/nosql/mongodb/query-builder.md))
- **sql**: SQL connection manager ([docs](../databases/sql/introduction.md))
- **MongoDataSource**: MongoDB connection manager ([docs](../databases/nosql/mongodb/introduction.md))
- **RedisDataSource**: Redis connection manager ([docs](../databases/nosql/redis/introduction.md))

## Model & Collection Definitions

- **defineModel**: Define SQL models programmatically ([docs](../databases/sql/models/define-model.md))
- **defineCollection**: Define MongoDB collections programmatically ([docs](../databases/nosql/mongodb/collections.md))
- **col**: Column type namespace (`col.string()`, `col.integer()`, `col.boolean()`, etc.) ([docs](../databases/sql/models/define-model.md))
- **rel**: Inline relation namespace for single-file models (`rel.hasOne()`, `rel.hasMany()`, `rel.belongsTo()`, `rel.manyToMany()`) ([docs](../databases/sql/relations/overview.md))
- **defineRelations**: Define relations separately to avoid circular imports — takes direct model references, type-checks foreign keys ([docs](../databases/sql/models/define-model.md#defining-relations-definerelations--createschema))
- **createSchema**: Combine models + relations into an augmented, fully-typed schema record ([docs](../databases/sql/models/define-model.md#defining-relations-definerelations--createschema))

## Utilities

- **logger**: Built-in and custom logging ([docs](../getting-started/logging.md))
- **generateULID**: Create unique, sortable IDs ([docs](./overview.md))
- **generateKeyPair**: Create RSA key pairs ([docs](./overview.md))
- **HysteriaError**: Custom error class ([docs](./overview.md))

## Data Sources

- **sql**: Default SQL data source ([docs](../databases/sql/introduction.md))
- **mongo**: Default MongoDB data source ([docs](../databases/nosql/mongodb/introduction.md))
- **Redis**: Default Redis data source ([docs](../databases/nosql/redis/introduction.md))

---

For detailed usage, see the linked documentation sections.
