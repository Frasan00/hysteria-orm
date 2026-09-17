---
title: OpenAPI Generation (Experimental)
description: "Generate OpenAPI schemas from Hysteria ORM models for API documentation."
keywords: [hysteria-orm, OpenAPI, API documentation, swagger]
sidebar_position: 1
---

# OpenAPI Generation

:::warning Experimental Feature
OpenAPI generation is currently an **experimental feature** and may undergo breaking changes in future releases. Use with caution in production environments.
:::

Hysteria ORM provides experimental support for automatically generating OpenAPI schemas from your model definitions. This feature allows you to create API documentation and client SDKs directly from your database models.

## Overview

The OpenAPI generation feature analyzes your model definitions, TypeScript types, and serialization functions to automatically generate OpenAPI 3.0 compatible schemas. This includes:

- **Property types** based on column definitions and serialization functions
- **Required fields** detection from primary keys and non-optional properties
- **Format specifications** for dates, UUIDs, and other special types
- **Property descriptions** from OpenAPI metadata

## Basic Usage

### Generating Schema for a Single Model

```typescript
import { generateOpenApiModelSchema } from "hysteria-orm";
import { User } from "./models/User";

const userSchema = generateOpenApiModelSchema(User);
console.log(JSON.stringify(userSchema, null, 2));
```

### Generating Schemas for Multiple Models

```typescript
import { generateOpenApiModel } from "hysteria-orm";
import { User, Post, Comment } from "./models";

const schemas = generateOpenApiModel([User, Post, Comment]);
```

### Generating Schemas with Model Names

```typescript
import { SqlDataSource, generateOpenApiModelWithMetadata } from "hysteria-orm";
import { User, Post } from "./models";

const schemasWithNames = generateOpenApiModelWithMetadata([User, Post]);
// Returns array with { modelName: string, ...schema }

// From sql data source with embedded models
const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  database: "mydb",
  models: {
    user: User,
    post: Post,
  },
});

await sql.connect();

const schemasWithNames = sql.getModelOpenApiSchema();
```

## Type Detection

The OpenAPI generator automatically detects types based on your model definition. Below is an example model using `defineModel` and `col`, followed by the type mappings:

```typescript
import { defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.uuid(),
    name: col.string(),
    email: col.string({
      openApi: {
        type: "string",
        description: "User's email address",
        required: true,
      },
    }),
    age: col.integer(),
    isActive: col.boolean(),
    metadata: col.json(),
    createdAt: col.date({ autoCreate: true }),
  },
});
```

### Date/Time Fields

`col.date()` / `col.datetime()` → `{ type: "string", format: "date-time" }`

### Boolean Fields

`col.boolean()` → `{ type: "boolean" }`

### Numeric Fields

`col.integer()` → `{ type: "number" }`

### JSON Fields

`col.json()` → `{ type: "object" }`

### UUID Fields

`col.uuid()` → `{ type: "string", format: "uuid" }`

### ULID Fields

`col.ulid()` → `{ type: "string", format: "ulid" }`

## OpenAPI Metadata

You can provide additional OpenAPI metadata in column options:

```typescript
email: col.string({
  openApi: {
    type: "string",
    description: "User's email address",
    required: true,
  },
}),
```

## Example Output

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Property: id"
    },
    "email": {
      "type": "string",
      "description": "User's email address"
    },
    "age": {
      "type": "number",
      "description": "Property: age"
    },
    "isActive": {
      "type": "boolean",
      "description": "Property: isActive"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Property: createdAt"
    }
  },
  "required": ["id", "email", "age"]
}
```
