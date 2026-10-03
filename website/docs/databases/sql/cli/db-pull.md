---
title: db:pull
description: Generate TypeScript model files from an existing database schema with the db:pull introspection command.
keywords: [hysteria-orm, db:pull, introspection, schema, models, CLI]
---

# db:pull

:::warning Experimental
This feature is under active development. The API, output format, and behavior may change in future releases. Review generated code before using it in production.
:::

The `db:pull` command introspects an existing database schema and generates TypeScript model files. Use it to bootstrap ORM models from a database you already have.

## Prerequisites

- A running database with existing tables.
- A datasource file that default-exports a `SqlDataSource`. See [SQL ORM Introduction](/databases/sql/introduction).

## Usage

```bash
hysteria-orm db:pull -d <datasource> [options]
```

| Flag                      | Description                                                       | Default             |
| ------------------------- | ----------------------------------------------------------------- | ------------------- |
| `-d, --datasource <path>` | Datasource file that default-exports a `SqlDataSource`. Required. | —                   |
| `-o, --out <path>`        | Output directory for generated model files.                       | `./database/models` |
| `--naming <convention>`   | Model name convention: `camel`, `snake`, or `pascal`.             | `camel`             |
| `--dry`                   | Preview generated code without writing files.                     | `false`             |
| `-c, --tsconfig <path>`   | Path to `tsconfig.json` used to load TypeScript files.            | `./tsconfig.json`   |

## Naming conventions

The `--naming` flag controls how table names become model names:

- `camel` (default): `user_profiles` becomes `userProfiles`.
- `snake`: `user_profiles` stays `user_profiles`.
- `pascal`: `user_profiles` becomes `UserProfiles`.

## What gets generated

For each table, `db:pull` writes a model file containing:

- **Columns**: names mapped to sanitized TypeScript properties and to the appropriate `col.*` methods, with nullability, defaults, and length constraints preserved.
- **Indexes**: non-unique indexes as `{ columns: ["col1", "col2"], name: "idx_name" }`, or a simple array when no index name is available.
- **Unique constraints**: uniques as `{ columns: ["email"], name: "uniq_constraint_name" }`, or a simple array when no constraint name is available.
- **Foreign key annotations**: JSDoc comments such as `/** @fk references table(column) — onDelete: ACTION — onUpdate: ACTION */` to guide manual relation setup.

## What is not generated

- **Relations**: `db:pull` does not generate `defineRelations` calls. Define relations manually after generation.
- **Schema registration**: generated models are not registered automatically. Import and register them in your schema configuration.

## Example output

Given this table:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

the generated model looks like:

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
  indexes: [{ columns: ["email"], name: "idx_users_email" }],
  uniques: [{ columns: ["email"], name: "users_email_unique" }],
});

export type usersType = InstanceType<typeof users>;
```

For a table with foreign keys:

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
  indexes: [{ columns: ["user_id"], name: "idx_posts_user_id" }],
  uniques: [{ columns: ["id"], name: "posts_pkey" }],
});

export type postsType = InstanceType<typeof posts>;
```

## Examples

```bash
# Basic usage
hysteria-orm db:pull -d ./src/datasource.ts

# Preview without writing files
hysteria-orm db:pull -d ./src/datasource.ts --dry

# Custom output directory
hysteria-orm db:pull -d ./src/datasource.ts -o ./src/models

# PascalCase model names
hysteria-orm db:pull -d ./src/datasource.ts --naming pascal

# Custom tsconfig path
hysteria-orm db:pull -d ./src/datasource.ts -c ./tsconfig.build.json
```

## Limitations

- **Primary keys**: auto-increment detection is not implemented, so primary key columns carry a `TODO` comment for manual verification.
- **Relations**: foreign keys are documented in comments, but relation definitions are manual.
- **Complex types**: some database-specific types map to generic types. Review generated column definitions.
- **Naming sanitization**: column names are sanitized to valid TypeScript identifiers, while original names stay as `columns` object keys.

For runtime schema inspection instead of code generation, see [Schema Introspection](/databases/sql/advanced/introspection).

## After generation

1. Review the generated models for accuracy.
2. Add `defineRelations` calls to connect the models.
3. Register the models in your schema configuration.
4. Run tests to verify model behavior.

## Troubleshooting

**`SqlDataSource file path is required`**

Provide `-d` or `--datasource` pointing to a valid datasource file.

**`Invalid naming convention`**

Use only `camel`, `snake`, or `pascal` for `--naming`.

**Empty output directory**

Verify the database connection works, the database contains tables, and the datasource configuration is correct.

## See also

- [CLI Reference](/databases/sql/cli/overview)
- [Schema Introspection](/databases/sql/advanced/introspection)
- [SQL ORM Introduction](/databases/sql/introduction)
