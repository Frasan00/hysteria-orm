---
title: Seeders
description: Create and run Hysteria ORM seeders to populate initial, test, or environment-specific data.
keywords: [hysteria-orm, seeders, seeding, fixtures, initial data, CLI]
---

# Seeders

Seeders populate your database with initial or test data in a structured, repeatable way. They suit development fixtures, consistent test data, and production defaults such as admin users or configuration rows.

## Creating a seeder

```bash
hysteria-orm create:seeder user_seeder
```

The CLI writes a timestamped file to your seeders directory:

```text
database/seeders/1234567890_user_seeder.ts
```

The generated file extends `BaseSeeder` and default-exports the class:

```typescript
import { BaseSeeder } from "hysteria-orm";

export default class extends BaseSeeder {
  async run(): Promise<void> {
    // Seed logic
  }
}
```

## Seeder configuration

Configure seeder locations on your `SqlDataSource`. For connection details, see [SQL ORM Introduction](/databases/sql/introduction).

```typescript
import { SqlDataSource } from "hysteria-orm";

const sqlDs = new SqlDataSource({
  // connection config: see /databases/sql/introduction
  seeders: {
    path: "database/seeders",
    tsconfig: "./tsconfig.json",
  },
});
```

| Option     | Type     | Default              | Description                               |
| ---------- | -------- | -------------------- | ----------------------------------------- |
| `path`     | `string` | `"database/seeders"` | Seeders directory.                        |
| `tsconfig` | `string` | `"./tsconfig.json"`  | TypeScript configuration for `.ts` files. |

## Writing seeders

Inside `run()`, use `this.sqlDataSource` for queries and models.

### Using raw queries

```typescript
import { BaseSeeder } from "hysteria-orm";

export default class extends BaseSeeder {
  async run(): Promise<void> {
    await this.sqlDataSource.rawQuery(`
      INSERT INTO users (name, email, password, role) VALUES
      ('Admin User', 'admin@example.com', 'hashed_password', 'admin'),
      ('Test User', 'test@example.com', 'hashed_password', 'user')
      ON CONFLICT (email) DO NOTHING
    `);
  }
}
```

### Using models

```typescript
import { BaseSeeder } from "hysteria-orm";
import { User } from "../models/user";

export default class extends BaseSeeder {
  async run(): Promise<void> {
    await this.sqlDataSource.from(User).insert({
      name: "Admin",
      email: "admin@example.com",
      password: "hashed_password",
      role: "admin",
    });

    await this.sqlDataSource.from(User).insertMany([
      { name: "User 1", email: "user1@example.com", password: "pass" },
      { name: "User 2", email: "user2@example.com", password: "pass" },
    ]);
  }
}
```

### Using factories

Combine seeders with `defineModelFactory` for realistic test data:

```typescript
import { BaseSeeder, defineModelFactory } from "hysteria-orm";
import { User } from "../models/user";
import { faker } from "@faker-js/faker";

export default class extends BaseSeeder {
  async run(): Promise<void> {
    const factory = defineModelFactory(User, {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      age: faker.number.int({ min: 18, max: 80 }),
    });

    await factory.create(50);
  }
}
```

### Environment-aware seeding

Run different data based on `NODE_ENV`:

```typescript
import { BaseSeeder } from "hysteria-orm";

export default class extends BaseSeeder {
  async run(): Promise<void> {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      await this.sqlDataSource.rawQuery(`
        INSERT INTO settings (key, value) VALUES
        ('app_name', 'My App'),
        ('version', '1.0.0')
        ON CONFLICT (key) DO NOTHING
      `);
    } else {
      await this.sqlDataSource.rawQuery(`
        INSERT INTO users (name, email, role) VALUES
        ('Dev User 1', 'dev1@test.com', 'user'),
        ('Dev User 2', 'dev2@test.com', 'user'),
        ('Admin', 'admin@test.com', 'admin')
      `);
    }
  }
}
```

## Running seeders

Run every seeder in the configured directory:

```bash
hysteria-orm seed -d database/index.ts
```

Run one or more specific files, or a whole folder:

```bash
# Single file
hysteria-orm seed -s database/seeders/1234_user_seeder.ts -d database/index.ts

# Multiple files (comma-separated)
hysteria-orm seed -s database/seeders/1234_user.ts,database/seeders/5678_post.ts -d database/index.ts

# All seeders in a folder
hysteria-orm seed -s database/seeders -d database/index.ts

# Mix folders and files
hysteria-orm seed -s database/seeders/core,database/seeders/special/admin.ts -d database/index.ts
```

## CLI options

### create:seeder

```bash
hysteria-orm create:seeder <name> [options]
```

| Flag                       | Description                                       | Default            |
| -------------------------- | ------------------------------------------------- | ------------------ |
| `-j, --javascript`         | Generate a JavaScript file instead of TypeScript. | `false`            |
| `-s, --seeder-path <path>` | Custom directory for the seeder file.             | `database/seeders` |

```bash
hysteria-orm create:seeder user_seeder
hysteria-orm create:seeder user_seeder -j
hysteria-orm create:seeder user_seeder -s custom/seeders
```

### seed

```bash
hysteria-orm seed [options]
```

| Flag                        | Description                                                       | Default           |
| --------------------------- | ----------------------------------------------------------------- | ----------------- |
| `-d, --datasource <path>`   | Datasource file that default-exports a `SqlDataSource`. Required. | —                 |
| `-s, --seeder-path <paths>` | Folder or file paths, comma-separated or repeated.                | `seeders.path`    |
| `-c, --tsconfig <path>`     | Path to `tsconfig.json` used to load TypeScript files.            | `./tsconfig.json` |

## Best practices

### Make seeders idempotent

Seeders should be safe to run more than once:

```typescript
async run(): Promise<void> {
  // Insert only when absent (PostgreSQL shown)
  await this.sqlDataSource.rawQuery(`
    INSERT INTO users (email, name) VALUES ('admin@app.com', 'Admin')
    ON CONFLICT (email) DO NOTHING
  `);

  // Or check first
  const existing = await this.sqlDataSource.rawQuery(
    "SELECT id FROM users WHERE email = ?",
    ["admin@app.com"],
  );

  if (!existing.length) {
    await this.sqlDataSource.from(User).insert({
      email: "admin@app.com",
      name: "Admin",
    });
  }
}
```

### Use transactions for related data

```typescript
async run(): Promise<void> {
  await this.sqlDataSource.transaction(async (trx) => {
    const user = await trx.sql.rawQuery(
      "INSERT INTO users (name) VALUES (?) RETURNING id",
      ["John Doe"],
    );

    await trx.sql.rawQuery(
      "INSERT INTO profiles (user_id, bio) VALUES (?, ?)",
      [user[0].id, "Sample bio"],
    );
  });
}
```

### Order matters

Seeders run in alphabetical order based on filename, so a numeric prefix controls ordering:

```text
database/seeders/
  001_users.ts      # Run first
  002_posts.ts      # Then posts
  003_comments.ts   # Finally comments
```

### Split development and production seeders

Organize seeders into folders and point `-s` at the right one:

```text
database/seeders/
  production/
    001_admin_user.ts
  development/
    001_test_users.ts
    002_test_posts.ts
```

```bash
hysteria-orm seed -s database/seeders/production -d database/index.ts
hysteria-orm seed -s database/seeders/development -d database/index.ts
```

## Common patterns

### Seeding with foreign keys

Create parents before children:

```typescript
async run(): Promise<void> {
  const users = await this.sqlDataSource.from(User).insertMany([
    { name: "Alice", email: "alice@example.com" },
    { name: "Bob", email: "bob@example.com" },
  ]);

  await this.sqlDataSource.from(Post).insertMany([
    { title: "Alice Post", user_id: users[0].id },
    { title: "Bob Post", user_id: users[1].id },
  ]);
}
```

### Conditional seeding

```typescript
async run(): Promise<void> {
  const userCount = await this.sqlDataSource.from(User).getCount();

  if (userCount > 0) {
    return;
  }

  // Seed users...
}
```

### Bulk insert performance

For large datasets, insert in batches:

```typescript
async run(): Promise<void> {
  const batchSize = 1000;
  const totalRecords = 10000;

  for (let i = 0; i < totalRecords; i += batchSize) {
    const batch = Array.from({ length: batchSize }, (_, j) => ({
      name: `User ${i + j}`,
      email: `user${i + j}@example.com`,
    }));

    await this.sqlDataSource.from(User).insertMany(batch);
  }
}
```

## Troubleshooting

### Seeder not found

- Check the file extension (`.ts` or `.js`).
- Verify the file sits in the configured seeders path.
- Ensure the class extends `BaseSeeder` and default-exports the class.

### Connection already established

If you see `CONNECTION_ALREADY_ESTABLISHED`, your datasource file is connecting automatically. The seeder runner manages the connection, so remove `.connect()` calls from datasource files used with the CLI.

### Import errors

Import `BaseSeeder` from the package root:

```typescript
// Correct
import { BaseSeeder } from "hysteria-orm";

// Incorrect: do not import from internal paths
import { BaseSeeder } from "hysteria-orm/dist/sql/seeders/base_seeder";
```

## See also

- [CLI Reference](/databases/sql/cli/overview)
- [Transactions](/databases/sql/advanced/transactions)
- [SQL ORM Introduction](/databases/sql/introduction)
