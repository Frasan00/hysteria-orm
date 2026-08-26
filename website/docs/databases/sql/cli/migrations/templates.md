---
title: Migration Templates
description: "Migration templates and custom migration patterns in Hysteria ORM."
keywords: [hysteria-orm, migration templates, custom migrations, schema]
sidebar_position: 4
---

# Migration Templates

Hysteria ORM provides templates and helpers for common migration patterns.

## Basic Migration Template

```typescript
import { Migration } from "hysteria-orm";

export default class extends Migration {
  async up() {
    // Your migration logic here
  }
  async down() {
    // Your rollback logic here
  }
}
```

## Create Table Template

```typescript
this.schema.createTable("table_name", (table) => {
  table.integer("id").increment().primary();
  table.string("name");
  // ...
});
```

## Alter Table Template

```typescript
this.schema.alterTable("table_name", (table) => {
  table.addColumn("new_column", "string");
  // ...
});
```

See `src/cli/resources/migration_templates.ts` for more examples and advanced usage.

---
