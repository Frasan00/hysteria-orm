---
title: "Schema Introspection (Experimental)"
description: "Programmatically inspect database table structures at runtime"
keywords:
  - introspection
  - schema
  - metadata
  - database
  - experimental
---

:::warning
This feature is in early development. The API may change in future releases. Currently only basic schema discovery is supported.
:::

## Overview

Schema introspection allows you to inspect database table structure programmatically at runtime. This is useful for building dynamic tools, migration systems, or adaptive ORM features that respond to the actual database schema.

## `sql.introspectSchema()`

```typescript
async introspectSchema(): Promise<IntrospectedSchema[]>
```

Queries `information_schema.tables` for base tables and returns schema objects with dialect and tables.

**Returns:** `Promise<IntrospectedSchema[]>`

**Example:**

```typescript
const schemas = await sql.introspectSchema();
for (const schema of schemas) {
  console.log(`Dialect: ${schema.dialect}`);
  for (const table of schema.tables) {
    console.log(`  Table: ${table.name}`);
    console.log(`  Columns: ${table.columns.length}`);
  }
}
```

## Introspection Types

### `IntrospectedSchema`

```typescript
interface IntrospectedSchema {
  dialect: string;
  tables: IntrospectedTable[];
}
```

| Property | Type | Description |
|----------|------|-------------|
| `dialect` | `string` | The database dialect (e.g., "postgres", "mysql") |
| `tables` | `IntrospectedTable[]` | Array of tables in the schema |

### `IntrospectedTable`

```typescript
interface IntrospectedTable {
  name: string;
  columns: IntrospectedColumn[];
}
```

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the table |
| `columns` | `IntrospectedColumn[]` | Array of columns in the table |

### `IntrospectedColumn`

```typescript
interface IntrospectedColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string | null;
  length?: number;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: { table: string; column: string };
}
```

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Column name |
| `type` | `string` | Data type |
| `nullable` | `boolean` | Whether the column allows null |
| `default` | `string \| null` | Default value (optional) |
| `length` | `number` | Length/precision (optional) |
| `isPrimaryKey` | `boolean` | Whether this is a primary key (optional) |
| `isForeignKey` | `boolean` | Whether this is a foreign key (optional) |
| `references` | `{ table: string; column: string }` | Foreign key reference (optional) |

## Current Limitations

:::warning
The following limitations apply to the current implementation:

- Only fetches table names, not full column metadata
- `columns` arrays are currently empty
- No support for views, stored procedures, or triggers
- API may change significantly in future versions

For full column metadata, use `sql.getTableSchema(table)` instead.
:::