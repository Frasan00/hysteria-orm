---
title: Programmatic Migrations
description: "Run migrations programmatically with TypeScript code in Hysteria ORM."
keywords: [hysteria-orm, programmatic migrations, TypeScript migrations]
sidebar_position: 3
---

# Programmatic Migrations

You can run migrations programmatically using the Hysteria ORM API. This is useful for custom workflows, CI/CD, or advanced automation.

## Example Usage

```typescript
import { defineMigrator } from "hysteria-orm";

const migrator = defineMigrator("database/migrations", {
  /** sql options */
});
await migrator.up(); // Run all pending migrations
await migrator.down(); // Rollback all migrations
```

---

Next: [Migration Templates](./templates.md)
