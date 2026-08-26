---
title: AdminJS (Experimental)
description: "AdminJS integration for auto-generated admin panels in Hysteria ORM."
keywords: [hysteria-orm, AdminJS, admin panel, admin interface]
sidebar_position: 1
---

# AdminJS Integration

:::warning Experimental
This feature is experimental and may change in future versions. Use with caution in production environments.
:::

Hysteria ORM provides built-in integration with [AdminJS](https://adminjs.co/), a powerful auto-generated admin panel for Node.js applications. This integration allows you to quickly set up an admin interface for your models without writing any additional code.

## Installation

AdminJS and its dependencies are optional peer dependencies. Install them based on your needs:

```bash
# Core AdminJS package
npm install adminjs

# For Express integration
npm install adminjs @adminjs/express express express-formidable
```

## Basic Setup

Enable AdminJS when connecting to your database by providing the `adminJs` configuration option:

```typescript
import { SqlDataSource, defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.bigIncrement(),
    name: col.varchar(100),
    email: col.varchar(255),
    age: col.integer(),
    isActive: col.boolean(),
    createdAt: col.datetime({ autoCreate: true }),
  },
});

const sql = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "root",
  password: "root",
  database: "test",
  models: { User },
  adminJs: {
    enabled: true,
    rootPath: "/admin",
  },
});

await sql.connect();
```

## Express Integration

The most common use case is integrating AdminJS with an Express application:

```typescript
import express from "express";
import { SqlDataSource, defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.bigIncrement(),
    name: col.varchar(100),
    email: col.varchar(255),
    age: col.integer(),
    isActive: col.boolean(),
    createdAt: col.datetime({ autoCreate: true }),
  },
});

(async () => {
  const sql = new SqlDataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "root",
    password: "root",
    database: "test",
    models: { User },
    adminJs: {
      enabled: true,
      rootPath: "/admin",
      branding: {
        companyName: "My App Admin",
        withMadeWithLove: false,
      },
      resourceOptions: {
        users: {
          navigation: {
            name: "User Management",
            icon: "User",
          },
          listProperties: ["id", "name", "email", "isActive"],
          showProperties: [
            "id",
            "name",
            "email",
            "age",
            "isActive",
            "createdAt",
          ],
          editProperties: ["name", "email", "age", "isActive"],
          filterProperties: ["name", "email", "isActive"],
        },
      },
    },
  });

  await sql.connect();

  const app = express();

  // Initialize AdminJS with Express router
  const { router, admin } = await sql.initializeAdminJsExpress();

  // Mount the AdminJS router
  app.use(admin.options.rootPath, router as express.Router);

  app.listen(3000, () => {
    console.log("AdminJS running at http://localhost:3000/admin");
  });
})();
```

## Configuration Options

### AdminJsOptions

| Option            | Type                                     | Default    | Description                                                   |
| ----------------- | ---------------------------------------- | ---------- | ------------------------------------------------------------- |
| `enabled`         | `boolean`                                | `false`    | Enable AdminJS integration                                    |
| `rootPath`        | `string`                                 | `"/admin"` | Root URL path for the admin panel                             |
| `branding`        | `AdminJsBranding`                        | -          | Custom branding options                                       |
| `resources`       | `Model[]`                                | -          | Specific models to expose (defaults to all registered models) |
| `resourceOptions` | `Record<string, AdminJsResourceOptions>` | -          | Per-model configuration                                       |
| `locale`          | `AdminJsLocale`                          | -          | Localization settings                                         |
| `assets`          | `AdminJsAssets`                          | -          | Custom CSS/JS assets                                          |
| `settings`        | `AdminJsSettings`                        | -          | General settings                                              |
| `pages`           | `Record<string, AdminJsPage>`            | -          | Custom pages                                                  |

### Branding Options

```typescript
adminJs: {
  enabled: true,
  branding: {
    companyName: "My Company",
    logo: "https://example.com/logo.png",
    favicon: "https://example.com/favicon.ico",
    withMadeWithLove: false,
    theme: {
      colors: {
        primary100: "#4268F6",
      },
    },
  },
}
```

### Resource Options

Configure how each model appears in the admin panel:

```typescript
adminJs: {
  enabled: true,
  resourceOptions: {
    users: {
      // Navigation grouping
      navigation: {
        name: "User Management",
        icon: "User",
      },

      // Custom display name
      name: "Users",

      // Properties shown in list view
      listProperties: ["id", "name", "email", "isActive"],

      // Properties shown in detail view
      showProperties: ["id", "name", "email", "age", "isActive", "createdAt"],

      // Properties available for editing
      editProperties: ["name", "email", "age", "isActive"],

      // Properties available for filtering
      filterProperties: ["name", "email", "isActive"],

      // Default sorting
      sort: {
        sortBy: "createdAt",
        direction: "desc",
      },

      // Property-level configuration
      properties: {
        email: {
          isRequired: true,
          description: "User's email address",
        },
        age: {
          type: "number",
          isVisible: {
            list: false,
            edit: true,
            filter: false,
            show: true,
          },
        },
      },
    },
  },
}
```

## API Reference

### SqlDataSource Methods

#### `initializeAdminJsExpress()`

Initializes AdminJS with an Express router. Returns an `AdminJsInstance` with both `admin` and `router` properties.

```typescript
const { admin, router } = await sql.initializeAdminJsExpress();
```

#### `getAdminJs()`

Returns the cached AdminJS instance if already initialized.

```typescript
const adminInstance = sql.getAdminJs();
```

#### `isAdminJsEnabled()`

Checks if AdminJS is enabled in the configuration.

```typescript
if (sql.isAdminJsEnabled()) {
  // AdminJS is configured
}
```

## Type Definitions

### AdminJsInstance

```typescript
type AdminJsInstance = {
  admin: {
    options: { rootPath: string; [key: string]: unknown };
    watch: () => Promise<void>;
    initialize: () => Promise<void>;
    resources: unknown[];
    findResource: (resourceId: string) => unknown;
  };
  router?: unknown;
};
```

## Supported Features

The AdminJS integration automatically provides:

- **List View**: Browse records with pagination and sorting
- **Create**: Add new records
- **Edit**: Modify existing records
- **Delete**: Remove records
- **Filtering**: Filter records by properties
- **Search**: Search across text fields

## Limitations

:::caution Current Limitations

- Authentication is not built-in; implement your own auth middleware
- File uploads require additional configuration
- Complex relationships may need custom handling
- Some AdminJS features may require direct AdminJS configuration
  :::

## See Also

- [AdminJS Documentation](https://docs.adminjs.co/)
- [Models](../models/basics.md)
- [Caching](../advanced/caching.md)
