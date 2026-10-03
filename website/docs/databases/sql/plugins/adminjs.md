---
title: AdminJS Integration
description: Generate an AdminJS admin panel from your Hysteria ORM models, with Express routing and per-model resource options.
keywords: [hysteria-orm, AdminJS, admin panel, admin interface, Express]
---

# AdminJS integration

:::warning Experimental
This feature is experimental and may change in future versions. Use with caution in production environments.
:::

Hysteria ORM integrates with [AdminJS](https://adminjs.co/) to generate an admin panel from your models without writing additional CRUD code. Enable it through the `adminJs` option on `SqlDataSource`; see [SQL ORM Introduction](/databases/sql/introduction) for the connection options.

## Installation

AdminJS and its dependencies are optional peer dependencies. Install the core package, and the Express packages if you mount the panel in an Express app:

```bash
npm install adminjs
npm install adminjs @adminjs/express express express-formidable
```

## Basic setup

Set `adminJs.enabled` to `true` when creating the data source. By default every registered model is exposed.

```typescript
import { SqlDataSource, defineModel, col } from "hysteria-orm";

const User = defineModel("users", {
  columns: {
    id: col.bigIncrement(),
    name: col.varchar(100),
    email: col.varchar(255),
    isActive: col.boolean(),
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

## Express integration

`initializeAdminJsExpress()` builds the AdminJS instance and its Express router together.

```typescript
import express from "express";

const app = express();

const { router, admin } = await sql.initializeAdminJsExpress();
app.use(admin.options.rootPath, router as express.Router);

app.listen(3000);
```

## API reference

### `initializeAdminJs()`

Builds the AdminJS instance from the configured options and returns it.

```typescript
const admin = await sql.initializeAdminJs();
```

### `initializeAdminJsExpress()`

Builds the AdminJS instance and an Express router, returning `{ admin, router }`.

```typescript
const { admin, router } = await sql.initializeAdminJsExpress();
```

### `getAdminJs()`

Returns the cached instance once initialized, or `undefined`.

```typescript
const adminInstance = sql.getAdminJs();
```

### `getAdminJsOptions()`

Returns the `AdminJsOptions` the data source was configured with, or `undefined`.

```typescript
const options = sql.getAdminJsOptions();
```

### `isAdminJsEnabled()`

Returns whether `adminJs.enabled` is set.

```typescript
if (sql.isAdminJsEnabled()) {
  // AdminJS is configured
}
```

## Options

| Option            | Type                                     | Default    | Description                                                    |
| ----------------- | ---------------------------------------- | ---------- | -------------------------------------------------------------- |
| `enabled`         | `boolean`                                | `false`    | Enable AdminJS integration.                                    |
| `rootPath`        | `string`                                 | `"/admin"` | Root URL path for the admin panel.                             |
| `branding`        | `AdminJsBranding`                        | -          | Custom branding options.                                       |
| `resources`       | `Model[]`                                | -          | Specific models to expose (defaults to all registered models). |
| `resourceOptions` | `Record<string, AdminJsResourceOptions>` | -          | Per-model configuration.                                       |
| `locale`          | `AdminJsLocale`                          | -          | Localization settings.                                         |
| `assets`          | `AdminJsAssets`                          | -          | Custom CSS/JS assets.                                          |
| `settings`        | `AdminJsSettings`                        | -          | General settings.                                              |
| `pages`           | `Record<string, AdminJsPage>`            | -          | Custom pages.                                                  |

### Branding

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

### Resource options

Configure how each model appears in the panel:

```typescript
adminJs: {
  enabled: true,
  resourceOptions: {
    users: {
      navigation: { name: "User Management", icon: "User" },
      name: "Users",
      listProperties: ["id", "name", "email", "isActive"],
      showProperties: ["id", "name", "email", "isActive"],
      editProperties: ["name", "email", "isActive"],
      filterProperties: ["name", "email", "isActive"],
      sort: { sortBy: "createdAt", direction: "desc" },
      properties: {
        email: { isRequired: true, description: "User's email address" },
        age: {
          type: "number",
          isVisible: { list: false, edit: true, filter: false, show: true },
        },
      },
    },
  },
}
```

## Supported features

The integration provides list browsing with pagination and sorting, create, edit, delete, filtering, and search across text fields.

## Limitations

:::caution

- Authentication is not built-in; implement your own auth middleware.
- File uploads require additional configuration.
- Complex relationships may need custom handling.
- Some AdminJS features require direct AdminJS configuration.
  :::

## See also

- [AdminJS documentation](https://docs.adminjs.co/)
- [Models](/databases/sql/models/define-model)
- [Caching](/databases/sql/advanced/caching)
