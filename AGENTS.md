# Hysteria ORM

Hysteria ORM is a TypeScript ORM library for Node.js applications, providing a unified API across SQL databases plus experimental MongoDB and Redis support. It ships as an npm package and CLI, targets Node.js 22+, and uses driver-specific connections for PostgreSQL, MySQL/MariaDB, SQLite, CockroachDB, MSSQL, Oracle, MongoDB, and Redis.

## Features

### sql-models
Defines typed SQL models, columns, relations, validation, and model-level queries.
Entry points: `src/sql/models/define_model.ts`, `src/sql/models/model.ts`, `src/sql/models/model_manager/model_manager.ts`, `src/sql/models/model_query_builder/model_query_builder.ts`

### sql-data-source
Connects to SQL databases and exposes raw queries, model access, schema inspection, caching, and transaction-aware execution.
Entry points: `src/sql/sql_data_source.ts`, `src/sql/sql_connection_utils.ts`, `src/drivers/drivers_factory.ts`, `src/sql/sql_runner/sql_runner.ts`

### sql-query-builder
Builds dialect-neutral SQL queries and parses them through the AST interpreter.
Entry points: `src/sql/query_builder/query_builder.ts`, `src/sql/query_builder/select_query_builder.ts`, `src/sql/ast/parser.ts`, `src/sql/ast/interpreter_map.ts`

### migrations
Creates, runs, and diffs database schema migrations and seeders.
Entry points: `src/sql/migrations/migrator.ts`, `src/sql/migrations/schema/schema_builder.ts`, `src/sql/migrations/schema_diff/schema_diff.ts`, `src/sql/migrations/schema_diff/migration_code_generator.ts`

### transactions-and-observers
Provides transactional execution and hooks that observe SQL query lifecycle events.
Entry points: `src/sql/transactions/transaction.ts`, `src/sql/transactions/atomic.ts`, `src/sql/observers/observer.ts`, `src/sql/observers/observer_chain.ts`

### nosql-data-sources
Provides MongoDB collections and a lightweight Redis client API, including lazy connections and Mongo sessions.
Entry points: `src/no_sql/mongo/mongo_data_source.ts`, `src/no_sql/mongo/mongo_models/define_collection.ts`, `src/no_sql/mongo/mongo_models/mongo_collection_manager.ts`, `src/no_sql/redis/redis_data_source.ts`

### cache
Lets SQL data sources cache query results through in-memory or Redis adapters.
Entry points: `src/cache/cache_adapter.ts`, `src/cache/cache_types.ts`, `src/cache/adapters/in_memory.ts`, `src/cache/adapters/redis.ts`

### cli
Scaffolds datasource files and runs migrations, seeders, schema pulls, and SQL commands from the terminal.
Entry points: `src/cli.ts`, `src/cli/migration_run_connector.ts`, `src/cli/db_pull_connector.ts`, `src/cli/resources/init_templates.ts`

### integrations
Generates OpenAPI model schemas and integrates SQL data sources with Better Auth and AdminJS.
Entry points: `src/openapi/openapi.ts`, `src/better_auth/better_auth_adapter.ts`, `src/adminjs/adminjs_adapter.ts`, `src/adminjs/adminjs_types.ts`

## Development

Use Yarn 1 (`yarn@1.22.1`). Build with `yarn build`; run the test harness with `yarn test`; format TypeScript with `yarn format`.

For tests requiring database services, always use `docker compose -f docker-compose.worktrees.yml`: it keeps service ports internal to the Compose network, avoiding host-port conflicts between worktrees. When testing is complete, always run `docker compose -f docker-compose.worktrees.yml down -v` to stop containers and remove volumes.

The Husky pre-commit hook follows this workflow automatically and runs the test suite inside the Compose `node` service.
