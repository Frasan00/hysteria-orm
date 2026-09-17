---
title: Run SQL Command
description: "Execute raw SQL queries and files using Hysteria ORM CLI."
keywords: [hysteria-orm, run SQL, raw queries, CLI]
sidebar_position: 3
---

# Run SQL Command

The `sql` command allows you to execute raw SQL queries or files directly from the command line.

## Usage

```bash
npx hysteria sql -d ./database/index.ts "SELECT * FROM users;"
npx hysteria sql -d ./database/index.ts --file ./scripts/my-query.sql
yarn hysteria sql -d ./database/index.ts "SELECT * FROM users;"
yarn hysteria sql -d ./database/index.ts --file ./scripts/my-query.sql
```

## Options

- `-f, --file [path]`: Path to the SQL file to execute.
- `-d, --datasource [path]`: Path to your sql file (default export).
- `-o, --out [path]`: Path to the file to save the query result.
- `-t, --tsconfig [path]`: Path to the tsconfig.json file, defaults to ./tsconfig.json.

## Example

```bash
npx hysteria sql -d ./database/index.ts -f ./scripts/init.sql
npx hysteria sql -d ./database/index.ts -f ./scripts/init.sql -o ./results/init.json
yarn hysteria sql -d ./database/index.ts -f ./scripts/init.sql
yarn hysteria sql -d ./database/index.ts -f ./scripts/init.sql -o ./results/init.json
yarn hysteria sql -d ./database/index.ts -f ./scripts/init.sql
```

```bash
npx hysteria sql -d ./database/index.ts "SELECT 1"
```

---

Back to: [CLI Overview](./overview.md)
