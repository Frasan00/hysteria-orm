# Testing Guide

## Prerequisites

- Docker and Docker Compose installed
- Node.js (nvm) and Yarn package manager

## Database Setup

The test suite requires multiple databases to be running. We provide a Docker Compose configuration to set up all necessary databases see [docker-compose.yaml](docker-compose.yml)

## Setup Instructions

1. Install project dependencies:
   ```bash
   yarn install
   ```

2. Start the required databases using Docker Compose:
   ```bash
   docker compose up -d
   ```

3. Setup nvm with .nvmrc:
   ```bash
   nvm use
   ```

4. Run the test suite:
   ```bash
   yarn test:with:migrations
   ```

## Available Scripts

### Standard Test Commands

- `yarn test:with:migrations` - Run migrations and all tests
- `yarn test` - Run all tests without migrations
- `yarn migrate` - Run migrations only

### Advanced Test Commands

#### Migration Runner

Run database migrations with custom options:

```bash
# Run migrations for all databases (default)
node test/migration_runner.js

# Run migrations for specific database(s)
node test/migration_runner.js -d mysql
node test/migration_runner.js -d mysql postgres sqlite
```

**Migration Runner Options:**
- `-d, --database <databases...>` - Run migrations for specific database(s)
  - Valid databases: `postgres`, `mysql`, `mariadb`, `cockroachdb`, `sqlite`, `mssql`, `oracledb`

#### Test Runner

Run tests with custom options:

```bash
# Run all tests (default)
node test/test_runner.js

# Run tests for specific database(s)
node test/test_runner.js -d mysql
node test/test_runner.js -d postgres sqlite

# Run specific test name(s) - passes to Jest -t
node test/test_runner.js -t "should create user"
node test/test_runner.js -t "should update" "should delete"

# Run specific file(s) by filename or full path
node test/test_runner.js -f crud.test.ts
node test/test_runner.js -f ./test/sql/bigint_pk/crud.test.ts
node test/test_runner.js -f join.test.ts relations.test.ts

# Enable database logs
node test/test_runner.js -l
node test/test_runner.js --logs

# Combine flags
node test/test_runner.js -d mysql -f crud.test.ts -l
node test/test_runner.js -d postgres -f crud.test.ts join.test.ts
node test/test_runner.js -t "should create" -f relations.test.ts --logs
```

**Test Runner Options:**
- `-d, --database <databases...>` - Run tests for specific database(s)
  - Valid databases: `postgres`, `mysql`, `mariadb`, `cockroachdb`, `sqlite`, `mssql`
- `-t, --test-case <testCases...>` - Run specific test name(s) within files (passed to Jest's `-t` flag)
  - Example: `-t "should create user"` will run only tests matching that description
- `-f, --file <files...>` - Run specific file(s) by filename or full path
  - Example: `-f crud.test.ts` will match all files named `crud.test.ts`
  - Example: `-f ./test/sql/bigint_pk/crud.test.ts` will match only that specific path
- `-l, --logs` - Enable database query logs (sets `DB_LOGS=true`)
  - By default, logs are disabled for cleaner output
  - Example: `-l` or `--logs` to see all SQL queries

**Note:** When using `-d`, `-t`, or `-f` flags, non-SQL tests (mongo, redis, cache, replication) are skipped. To run all tests including non-SQL tests, omit these flags.

## Examples

### Quick Development Workflows

```bash
# Test only MySQL (fastest for single DB development)
node test/migration_runner.js -d mysql
node test/test_runner.js -d mysql

# Test specific file across all databases
node test/test_runner.js -f crud.test.ts

# Test specific file on specific database with logs enabled
node test/test_runner.js -d postgres -f crud.test.ts -l

# Run specific test name within all files
node test/test_runner.js -t "should create user with bigint"

# Run specific test within specific file with logs
node test/test_runner.js -f crud.test.ts -t "should update" -l

# Full test run with database logs
node test/migration_runner.js
node test/test_runner.js --logs

# Debug specific database with logs
node test/test_runner.js -d mysql -l
```

## Notes

- All database credentials are set to default values for testing purposes, do not change them
- Ensure all required ports are available before starting the containers
- Multiple values can be provided for `-d`, `-t`, and `-f` flags
- Flags are composable - you can combine them as needed
