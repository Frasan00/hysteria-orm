---
title: db:pull
description: "Generate TypeScript model files from database schema introspection with the db:pull CLI command."
keywords: [hysteria-orm, CLI, db:pull, introspection, schema, models]
sidebar_position: 2
---

# db:pull

:::warning
This feature is **experimental**. The API, output format, and behavior may change in future releases. Use with caution in production environments.
:::

The `db:pull` command introspects an existing database schema and generates TypeScript model files. This is useful when working with an existing database or when you want to bootstrap your ORM models from a database structure.

## Prerequisites

Before running `db:pull`, ensure you have:

- A running database with existing tables
- A datasource file that exports a default `SqlDataSource` instance

## Usage

```bash
npx hysteria-orm db:pull -d <datasource> [options]
```

## Options

| Option | Shorthand | Description | Default |
|--------|-----------|-------------|---------|
| `--datasource` | `-d` | **Required.** Path to the datasource file that exports a default `SqlDataSource` instance | — |
| `--out` | `-o` | Output directory for generated model files | `./database/models` |
| `--naming` | — | Naming convention for model names. Options: `camel`, `snake`, `pascal` | `camel` |
| `--dry` | — | Preview generated code without writing files to disk | `false` |
| `--tsconfig` | `-c` | Path to `tsconfig.json` for TypeScript compilation | `./tsconfig.json` |

## Naming Conventions

The `--naming` option controls how table names are transformed into model names:

- **`camel`** (default): `user_profiles` → `userProfiles`
- **`snake`**: `user_profiles` → `user_profiles`
- **`pascal`**: `user_profiles` → `UserProfiles`

## What Gets Generated

For each table in your database, `db:pull` creates a model file containing:

### Columns
- Column names mapped to sanitized TypeScript property names
- Column types mapped to appropriate `col.*` methods
- Nullable, default values, and length constraints preserved

### Indexes
- Named array of non-unique indexes with their column combinations and database index names
- Format: `{ columns: ["col1", "col2"], name: "idx_name" }`
- Falls back to simple array format if index name is not available

### Unique Constraints
- Named array of unique constraints with their column combinations and constraint names
- Format: `{ columns: ["email"], name: "uniq_constraint_name" }`
- Falls back to simple array format if constraint name is not available

### Foreign Key Annotations
- JSDoc comments indicating foreign key relationships
- Format: `/** @fk references table(column) — onDelete: ACTION — onUpdate: ACTION */`
- Provides reference information for manual relation setup

## What Does NOT Get Generated

- **Relations**: `db:pull` does not generate `defineRelations` calls. You must define relations manually after generation.
- **createSchema wiring**: Generated models are not automatically registered. You must import and register them in your schema configuration.

## Example Output

Given a `users` table with the following structure:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

The generated model would look like:

```typescript
import { col, defineModel } from "hysteria-orm";

export const users = defineModel("users", {
  columns: {
    // Primary key column
    // TODO: may be auto-increment, verify manually
    id: col.integer({ nullable: false }),
    email: col.string({ length: 255, nullable: false }),
    full_name: col.string({ length: 255, nullable: true }),
    created_at: col.timestamp({ nullable: true, defaultValue: "NOW()" }),
  },
  indexes: [
    { columns: ["email"], name: "idx_users_email" },
  ],
  uniques: [
    { columns: ["email"], name: "users_email_unique" },
  ],
});

export type usersType = InstanceType<typeof users>;
```

### Example with Foreign Keys

For a table with foreign key relationships:

```typescript
import { col, defineModel } from "hysteria-orm";

export const posts = defineModel("posts", {
  columns: {
    // Primary key column
    // TODO: may be auto-increment, verify manually
    id: col.integer({ nullable: false }),
    title: col.string({ length: 255, nullable: false }),
    /** @fk references users(id) — onDelete: CASCADE — onUpdate: NO ACTION */
    user_id: col.integer({ nullable: false }),
    created_at: col.timestamp(),
  },
  indexes: [
    { columns: ["user_id"], name: "idx_posts_user_id" },
  ],
  uniques: [
    { columns: ["id"], name: "posts_pkey" },
  ],
});

export type postsType = InstanceType<typeof posts>;
```

## Examples

### Basic Usage

```bash
npx hysteria-orm db:pull -d ./src/datasource.ts
```

### Dry Run (Preview Without Writing)

```bash
npx hysteria-orm db:pull -d ./src/datasource.ts --dry
```

### Custom Output Directory

```bash
npx hysteria-orm db:pull -d ./src/datasource.ts -o ./src/models
```

### PascalCase Model Names

```bash
npx hysteria-orm db:pull -d ./src/datasource.ts --naming pascal
```

### Custom tsconfig Path

```bash
npx hysteria-orm db:pull -d ./src/datasource.ts -c ./tsconfig.build.json
```

## Limitations and Notes

:::caution Experimental Feature
The `db:pull` command is under active development. Generated code should be reviewed before use in production.
:::

- **Primary Keys**: Auto-increment detection is not implemented. Primary key columns are marked with a TODO comment for manual verification.
- **Relations**: Foreign keys are documented in comments but relation definitions must be added manually.
- **Complex Types**: Some database-specific types may map to generic types. Review generated column definitions.
- **Naming Sanitization**: Column names are sanitized to valid TypeScript identifiers. Original names are preserved in the `columns` object keys.

## After Generation

1. Review generated models for accuracy
2. Add `defineRelations` calls to establish relationships between models
3. Register models in your `createSchema` configuration
4. Run tests to verify model behavior

## Troubleshooting

**Error: "SqlDataSource file path is required"**
- Ensure you provide the `-d` or `--datasource` option pointing to a valid datasource file

**Error: "Invalid naming convention"**
- Use only `camel`, `snake`, or `pascal` for the `--naming` option

**Empty output directory**
- Verify the database connection is working
- Check that the database contains tables
- Review datasource configuration
