---
title: OpenAPI Generation
description: Generate OpenAPI 3.0 schemas from your Hysteria ORM model definitions for API documentation and client SDKs.
keywords: [hysteria-orm, OpenAPI, API documentation, swagger, schema generation]
---

# OpenAPI generation

:::warning Experimental
This feature is experimental and may change in future versions. Use with caution in production environments.
:::

Hysteria ORM generates OpenAPI 3.0 schemas from your model definitions, so your API documentation and client SDKs stay in sync with your models. The generator reads column types and `openApi` column metadata.

## Basic usage

### A single model

```typescript
import { generateOpenApiModelSchema } from "hysteria-orm";
import { User } from "./models/User";

const userSchema = generateOpenApiModelSchema(User);
```

### Multiple models

```typescript
import { generateOpenApiModel } from "hysteria-orm";
import { User, Post, Comment } from "./models";

const schemas = generateOpenApiModel([User, Post, Comment]);
```

### With model names

```typescript
import { generateOpenApiModelWithMetadata } from "hysteria-orm";
import { User, Post } from "./models";

const schemasWithNames = generateOpenApiModelWithMetadata([User, Post]);
// Each entry is { modelName: string, $id: string, ...schema }
```

A `SqlDataSource` can generate schemas for every registered model directly:

```typescript
const schemas = sql.getModelOpenApiSchema();
```

## Type detection

The generator maps column types to OpenAPI property types. Columns can carry `openApi` metadata to override the detected type and description:

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

| Column type                     | OpenAPI schema                            |
| ------------------------------- | ----------------------------------------- |
| `col.date()` / `col.datetime()` | `{ type: "string", format: "date-time" }` |
| `col.boolean()`                 | `{ type: "boolean" }`                     |
| `col.integer()`                 | `{ type: "integer", format: "int32" }`    |
| `col.bigInteger()`              | `{ type: "integer", format: "int64" }`    |
| `col.json()`                    | `{ type: "object" }`                      |
| `col.uuid()`                    | `{ type: "string", format: "uuid" }`      |
| `col.ulid()`                    | `{ type: "string", format: "ulid" }`      |

## Example output

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
      "type": "integer",
      "format": "int32",
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
  "required": ["email"]
}
```

## See also

- [Models](/databases/sql/models/define-model)
- [SQL ORM Introduction](/databases/sql/introduction)
