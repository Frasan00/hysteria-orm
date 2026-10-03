---
title: Schema Introspection
description: Inspect tables, columns, indexes, keys, and constraints programmatically at runtime in Hysteria ORM.
keywords: [hysteria-orm, introspection, schema, metadata, syncSchema]
---

# Schema introspection

:::warning Experimental

Schema introspection is in early development. The API may change in future releases.

:::

Introspection lets you inspect the live database schema at runtime: table names, columns, indexes, foreign keys, primary keys, and check constraints. This is useful for dynamic tooling, migration helpers, and adaptive features that respond to the actual database schema.

## Reading schema metadata

### `introspectSchema()`

```typescript
async introspectSchema(): Promise<IntrospectedSchema[]>
```

Lists base tables for the current dialect. The returned schema contains the dialect and one entry per table. For per-table column, index, key, and constraint details, use [`getTableSchema()`](#gettableschema).

```typescript
const schemas = await sql.introspectSchema();
for (const schema of schemas) {
  console.log(schema.dialect);
  for (const table of schema.tables) {
    console.log(table.name);
  }
}
```

### `getTableSchema()`

```typescript
async getTableSchema(table: string): Promise<TableSchemaInfo>
```

Returns the full metadata for a table by combining the column, index, foreign-key, primary-key, and check-constraint lookups in parallel.

```typescript
const schema = await sql.getTableSchema("users");
console.log(schema.columns.map((c) => c.name));
console.log(schema.indexes);
console.log(schema.primaryKey);
```

`TableSchemaInfo` has this shape:

| Property           | Type                               | Description           |
| ------------------ | ---------------------------------- | --------------------- |
| `columns`          | `TableColumnInfo[]`                | Column metadata.      |
| `indexes`          | `TableIndexInfo[]`                 | Index metadata.       |
| `foreignKeys`      | `TableForeignKeyInfo[]`            | Foreign-key metadata. |
| `primaryKey`       | `TablePrimaryKeyInfo \| undefined` | Primary key, if any.  |
| `checkConstraints` | `TableCheckConstraintInfo[]`       | Check constraints.    |

### `getTableInfo()`

```typescript
async getTableInfo(table: string): Promise<TableColumnInfo[]>
```

Column metadata, including type normalization, nullability, defaults, length/precision/scale, timezone, enum values, unsigned/zerofill, and the `stringMode` storage flag.

```typescript
const columns = await sql.getTableInfo("users");
```

`TableColumnInfo` fields: `name`, `dataType`, `isNullable`, `defaultValue`, and the optional `length`, `precision`, `scale`, `withTimezone`, `enumValues`, `unsigned`, `zerofill`, `stringMode`.

### `getIndexInfo()`

```typescript
async getIndexInfo(table: string): Promise<TableIndexInfo[]>
```

Returns `{ name, columns, isUnique }` per index, including composite indexes. SQLite resolves the column list through `PRAGMA index_info`.

### `getForeignKeyInfo()`

```typescript
async getForeignKeyInfo(table: string): Promise<TableForeignKeyInfo[]>
```

Returns `{ name?, columns, referencedTable, referencedColumns, onDelete?, onUpdate? }`. Composite foreign keys are grouped into a single entry.

### `getPrimaryKeyInfo()`

```typescript
async getPrimaryKeyInfo(table: string): Promise<TablePrimaryKeyInfo | undefined>
```

Returns `{ name?, columns }`, or `undefined` when the table has no primary key.

### `getCheckConstraintInfo()`

```typescript
async getCheckConstraintInfo(table: string): Promise<TableCheckConstraintInfo[]>
```

Returns `{ name, expression }` per check constraint. MariaDB's implicit `json_valid()` checks are filtered out.

### `getTables()`

```typescript
async getTables(): Promise<string[]>
```

Returns all table names. Returns an empty array if the lookup fails.

### `getColumnListing()`

```typescript
async getColumnListing(table: string): Promise<string[]>
```

Returns column names for a table. Returns an empty array if the lookup fails.

## Predicates

The predicate family checks whether an object exists without loading full metadata. Each returns `false` when the lookup errors or the object is missing.

| Method                                  | Description                                     |
| --------------------------------------- | ----------------------------------------------- |
| `hasTable(table)`                       | Whether the table exists.                       |
| `hasColumn(table, column)`              | Whether the column exists.                      |
| `hasColumns(table, ...columns)`         | Whether all given columns exist.                |
| `hasIndex(table, index)`                | Whether the named index exists.                 |
| `hasPrimaryKey(table)`                  | Whether the table has a primary key.            |
| `hasUnique(table, columns)`             | Whether a unique constraint covers the columns. |
| `hasForeignKey(table, columns)`         | Whether a foreign key covers the columns.       |
| `hasCheckConstraint(table, constraint)` | Whether the named check constraint exists.      |

```typescript
await sql.hasTable("users"); // true
await sql.hasColumn("users", "email"); // true
await sql.hasColumns("users", "id", "email", "name"); // true
await sql.hasIndex("users", "users_email_unique"); // true
await sql.hasPrimaryKey("users"); // true
await sql.hasUnique("users", ["email"]); // true
await sql.hasForeignKey("posts", ["user_id"]); // true
await sql.hasCheckConstraint("users", "users_age_check"); // true
```

## Programmatic schema sync

### `syncSchema()`

```typescript
async syncSchema(options?: { transactional: boolean }): Promise<void>
```

Compares the models metadata against the live database with `SchemaDiff` and applies the generated SQL. Pass `{ transactional: true }` to run the statements inside a transaction. When the schemas already match, no statements run.

```typescript
await sql.syncSchema({ transactional: true });
```

:::warning
`syncSchema()` drops and recreates indexes and constraints. Review the generated statements before running it against a production database. SQLite is not supported; the call logs a warning and returns without changes.
:::

## Types

```typescript
interface IntrospectedSchema {
  dialect: string;
  tables: IntrospectedTable[];
}

interface IntrospectedTable {
  name: string;
  columns: IntrospectedColumn[];
  primaryKeys?: string[];
  foreignKeys?: IntrospectedForeignKey[];
  indices?: { name: string; columns: string[]; unique?: boolean }[];
}

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

interface IntrospectedForeignKey {
  column: string;
  references: { table: string; column: string };
  onDelete?: string;
  onUpdate?: string;
}
```

`introspectSchema()` populates `dialect` and the table names. Use `getTableSchema()` for the full, per-dialect metadata described above.

## See also

- [SQL ORM Introduction](/databases/sql/introduction)
- [Migrations](/databases/sql/cli/migrations/basics)
- [Transactions](/databases/sql/advanced/transactions)
