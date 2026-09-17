---
title: Seeders
description: "Database seeders for populating initial data and test fixtures in Hysteria ORM."
keywords: [hysteria-orm, seeders, database seeding, initial data, fixtures]
sidebar_position: 1
---

# Seeders

Seeders allow you to populate your database with initial or test data in a structured, repeatable way.

## Overview

Seeders are useful for:

- **Development**: Populate your local database with test data
- **Testing**: Create consistent test fixtures
- **Production**: Insert initial/default data (admin users, configuration, etc.)

## Creating a Seeder

Use the CLI to generate a seeder file:

```bash
hysteria create:seeder user_seeder
```

This creates a timestamped file in your seeders directory:

```
database/seeders/1234567890_user_seeder.ts
```

The generated seeder extends `BaseSeeder`:

```typescript
import { BaseSeeder } from "hysteria-orm";

export default class extends BaseSeeder {
  /**
   * Run the seeder
   */
  async run(): Promise<void> {
    console.log("Seeder completed");
  }
}
```

## Seeder Configuration

Configure seeder behavior in your `SqlDataSource` instance:

```typescript
import { SqlDataSource } from "hysteria-orm";

const sqlDs = new SqlDataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "root",
  password: "root",
  database: "mydb",
  seeders: {
    path: "database/seeders", // Seeder files location
    tsconfig: "./tsconfig.json", // TypeScript config (optional)
  },
});
```

## Writing Seeders

### Using Raw Queries

The simplest approach - execute SQL directly:

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

    console.log("✓ User seeder completed");
  }
}
```

### Using Models

Leverage your ORM models for type safety:

```typescript
import { BaseSeeder } from "hysteria-orm";
import { User } from "../models/user";

export default class extends BaseSeeder {
  async run(): Promise<void> {
    // Insert single record
    await this.sqlDataSource.from(User).insert({
      name: "Admin",
      email: "admin@example.com",
      password: "hashed_password",
      role: "admin",
    });

    // Insert multiple records
    await this.sqlDataSource.from(User).insertMany([
      { name: "User 1", email: "user1@example.com", password: "pass" },
      { name: "User 2", email: "user2@example.com", password: "pass" },
    ]);

    console.log("✓ User seeder completed");
  }
}
```

### Using Factories

Combine seeders with factories for realistic test data:

```typescript
import { BaseSeeder } from "hysteria-orm";
import { defineModelFactory } from "hysteria-orm";
import { User } from "../models/user";
import { faker } from "@faker-js/faker";

export default class extends BaseSeeder {
  async run(): Promise<void> {
    // Create 50 random users
    const factory = defineModelFactory(User, {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      age: faker.number.int({ min: 18, max: 80 }),
    });

    await factory.create(50);

    console.log("✓ Created 50 users");
  }
}
```

### Environment-Aware Seeding

Run different seeders based on environment:

```typescript
import { BaseSeeder } from "hysteria-orm";

export default class extends BaseSeeder {
  async run(): Promise<void> {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      // Only essential data in production
      await this.sqlDataSource.rawQuery(`
        INSERT INTO settings (key, value) VALUES
        ('app_name', 'My App'),
        ('version', '1.0.0')
        ON CONFLICT (key) DO NOTHING
      `);
    } else {
      // Rich test data in development
      await this.sqlDataSource.rawQuery(`
        INSERT INTO users (name, email, role) VALUES
        ('Dev User 1', 'dev1@test.com', 'user'),
        ('Dev User 2', 'dev2@test.com', 'user'),
        ('Admin', 'admin@test.com', 'admin')
      `);
    }

    console.log("✓ Environment-specific seeder completed");
  }
}
```

## Running Seeders

### Run All Seeders

Execute all seeders in your configured directory:

```bash
hysteria seed -d database/index.ts
```

### Run Specific Files

Run one or more specific seeder files:

```bash
# Single file
hysteria seed -s database/seeders/1234_user_seeder.ts -d database/index.ts

# Multiple files (comma-separated)
hysteria seed -s database/seeders/1234_user.ts,database/seeders/5678_post.ts -d database/index.ts
```

### Run All Seeders in a Folder

Specify a folder to run all seeders within it:

```bash
hysteria seed -s database/seeders -d database/index.ts
```

### Mix Folders and Files

You can combine folders and specific files:

```bash
hysteria seed -s database/seeders/core,database/seeders/special/admin.ts -d database/index.ts
```

## CLI Options

### Create Seeder Command

```bash
hysteria create:seeder <name> [options]
```

**Options:**

- `-j, --javascript` - Generate JavaScript file instead of TypeScript
- `-s, --seeder-path <path>` - Custom path for the seeder file

**Examples:**

```bash
# Create TypeScript seeder
hysteria create:seeder user_seeder

# Create JavaScript seeder
hysteria create:seeder user_seeder -j

# Create in custom directory
hysteria create:seeder user_seeder -s custom/seeders
```

### Seed Command

```bash
hysteria seed [options]
```

**Options:**

- `-d, --datasource <path>` - Path to SqlDataSource file (required)
- `-s, --seeder-path <paths>` - Comma-separated paths to folders or files
- `-c, --tsconfig <path>` - Path to tsconfig.json

**Examples:**

```bash
# Run all seeders
hysteria seed -d database/index.ts

# Run specific file
hysteria seed -s database/seeders/1234_users.ts -d database/index.ts

# Run multiple files
hysteria seed -s database/seeders/users.ts,database/seeders/posts.ts -d database/index.ts

# Run all seeders in custom folder
hysteria seed -s custom/seeders -d database/index.ts
```

## Best Practices

### 1. Make Seeders Idempotent

Seeders should be safe to run multiple times:

```typescript
async run(): Promise<void> {
  // Use INSERT ... ON CONFLICT for PostgreSQL
  await this.sqlDataSource.rawQuery(`
    INSERT INTO users (email, name) VALUES ('admin@app.com', 'Admin')
    ON CONFLICT (email) DO NOTHING
  `);

  // Or check before inserting
  const existing = await this.sqlDataSource.rawQuery(
    'SELECT id FROM users WHERE email = ?',
    ['admin@app.com']
  );

  if (!existing.length) {
    await this.sqlDataSource.from(User).insert({ email: 'admin@app.com', name: 'Admin' });
  }
}
```

### 2. Use Transactions for Related Data

When seeding related data, use transactions:

```typescript
async run(): Promise<void> {
  await this.sqlDataSource.transaction(async (trx) => {
    const user = await trx.sql.rawQuery(
      'INSERT INTO users (name) VALUES (?) RETURNING id',
      ['John Doe']
    );

    await trx.sql.rawQuery(
      'INSERT INTO profiles (user_id, bio) VALUES (?, ?)',
      [user[0].id, 'Sample bio']
    );
  });
}
```

### 3. Order Matters

Name seeders with prefixes to control execution order:

```
database/seeders/
  ├── 001_users.ts      # Run first
  ├── 002_posts.ts      # Then posts
  └── 003_comments.ts   # Finally comments
```

Seeders run in alphabetical order based on filename.

### 4. Separate Development and Production Seeders

Use folders to organize seeders by environment:

```
database/seeders/
  ├── production/
  │   └── 001_admin_user.ts
  └── development/
      ├── 001_test_users.ts
      └── 002_test_posts.ts
```

Then run appropriate seeders:

```bash
# Production
hysteria seed -s database/seeders/production -d database/index.ts

# Development
hysteria seed -s database/seeders/development -d database/index.ts
```

### 5. Log Progress

Add helpful logging to track seeder execution:

```typescript
async run(): Promise<void> {
  console.log('Starting user seeder...');

  const users = await this.sqlDataSource.from(User).insertMany(/* ... */);
  console.log(`✓ Created ${users.length} users`);

  const posts = await this.sqlDataSource.from(Post).insertMany(/* ... */);
  console.log(`✓ Created ${posts.length} posts`);

  console.log('✓ User seeder completed successfully');
}
```

## Common Patterns

### Seeding with Foreign Keys

Handle relationships correctly:

```typescript
async run(): Promise<void> {
  // Create users first
  const users = await this.sqlDataSource.from(User).insertMany([
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ]);

  // Then create posts with user IDs
  await this.sqlDataSource.from(Post).insertMany([
    { title: 'Alice Post', user_id: users[0].id },
    { title: 'Bob Post', user_id: users[1].id }
  ]);
}
```

### Conditional Seeding

Skip seeding if data already exists:

```typescript
async run(): Promise<void> {
  const userCount = await this.sqlDataSource.from(User).getCount();

  if (userCount > 0) {
    console.log('Users already exist, skipping seeder');
    return;
  }

  // Seed users...
}
```

### Bulk Insert Performance

For large datasets, use batch inserts:

```typescript
async run(): Promise<void> {
  const batchSize = 1000;
  const totalRecords = 10000;

  for (let i = 0; i < totalRecords; i += batchSize) {
    const batch = Array.from({ length: batchSize }, (_, j) => ({
      name: `User ${i + j}`,
      email: `user${i + j}@example.com`
    }));

    await this.sqlDataSource.from(User).insertMany(batch);
    console.log(`Inserted batch ${i / batchSize + 1}`);
  }
}
```

## Troubleshooting

### Seeder Not Found

If your seeder isn't being recognized:

1. Check the file extension (`.ts` or `.js`)
2. Verify the file is in the configured seeders path
3. Ensure the class extends `BaseSeeder`
4. Confirm it exports a default class

### Connection Already Established

If you see `CONNECTION_ALREADY_ESTABLISHED` error, your datasource file might be connecting automatically. The seeder runner handles connections, so remove any `.connect()` calls from your datasource file when using with CLI.

### Import Errors

If you have import issues with `BaseSeeder`:

```typescript
// ✅ Correct import
import { BaseSeeder } from "hysteria-orm";

// ❌ Wrong - don't import from internal paths
import { BaseSeeder } from "hysteria-orm/dist/sql/seeders/base_seeder";
```

## Next Steps

- Learn about [Seeders CLI Options](#cli-options) for more seeder commands
- Explore [Transactions](/databases/sql/advanced/transactions) for atomic seeding
- See [CLI Overview](/databases/sql/cli/overview) for all available commands
