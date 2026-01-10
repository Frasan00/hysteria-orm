import { Command } from "commander";
import { exec, execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";
import {
  cockroachdbConfig,
  mariadbConfig,
  mssqlConfig,
  mysqlConfig,
  pgConfig,
  sqliteConfig,
} from "./test_environments.js";

const execAsync = promisify(exec);

const ALL_SQL_ENVIRONMENTS = {
  mysql: mysqlConfig,
  sqlite: sqliteConfig,
  mariadb: mariadbConfig,
  postgres: pgConfig,
  cockroachdb: cockroachdbConfig,
  mssql: mssqlConfig,
};

const VALID_DB_TYPES = Object.keys(ALL_SQL_ENVIRONMENTS);

const SQL_TESTS = [
  // connection management
  "./test/sql/connection_management/connection_management.test.ts",

  // schema introspection
  "./test/sql/schema_introspection/schema_introspection.test.ts",

  // error handling
  "./test/sql/error_handling/error_scenarios.test.ts",

  // security
  "./test/sql/security/sql_injection_prevention.test.ts",

  // locking
  "./test/sql/locking/advisory_locks.test.ts",

  // model manager
  "./test/sql/model_manager/model_manager.test.ts",

  // cloning
  "./test/sql/cloning/clone_behavior.test.ts",

  // transaction
  "./test/sql/transaction/transaction.test.ts",

  // instance methods
  "./test/sql/instance_methods/instance_methods.test.ts",

  // having related
  "./test/sql/bigint_pk/having_related.test.ts",
  "./test/sql/uuid_pk/having_related.test.ts",

  // edge cases
  "./test/sql/edge_cases/query_builder_complex_edge_cases.test.ts",
  "./test/sql/edge_cases/model_serialization_edge_cases.test.ts",

  // query builder
  "./test/sql/query_builder/select_tuple.test.ts",
  "./test/sql/query_builder/query_builder.test.ts",
  "./test/sql/query_builder/embedded_models.test.ts",
  "./test/sql/query_builder/json_select.test.ts",
  "./test/sql/query_builder/join_edge_cases.test.ts",

  // without primary key tests
  "./test/sql/without_pk/user_without_pk_json.test.ts",
  "./test/sql/without_pk/user_without_pk_crud.test.ts",

  // bigint join test
  "./test/sql/bigint_pk/relations.test.ts",
  "./test/sql/bigint_pk/crud.test.ts",
  "./test/sql/bigint_pk/join.test.ts",

  // uuid
  "./test/sql/uuid_pk/relations.test.ts",
  "./test/sql/uuid_pk/crud.test.ts",
  "./test/sql/uuid_pk/join.test.ts",

  // schema diff (migration generation)
  "./test/sql/schema_diff/schema_diff.test.ts",
];

const NON_SQL_TESTS = [
  {
    name: "mixins",
    path: "./test/sql/mixins/",
    runInBand: true,
  },
  {
    name: "use_connection",
    path: "./test/sql/use_connection/use_connection.test.ts",
  },
  { name: "mongo", path: "./test/mongo/crud_mongo.test.ts" },
  { name: "redis", path: "./test/redis/redis.test.ts" },
  {
    name: "cache_in_memory",
    path: "./test/cache/in_memory_cache.test.ts",
  },
  {
    name: "cache_redis",
    path: "./test/cache/redis_cache.test.ts",
  },
  {
    name: "cache_sql",
    path: "./test/cache/sql_data_source_cache.test.ts",
  },
  {
    name: "replication",
    path: "./test/replication/slaves.test.ts",
  },
];

const fileContainsTests = (filePath, testNames) => {
  try {
    const content = readFileSync(filePath, "utf-8");
    return testNames.some((testName) => content.includes(testName));
  } catch (error) {
    return false;
  }
};

const runSqlTest = async (file, environment, testNames = [], logs = false) => {
  if (file.includes("bigint_pk") && environment.type === "cockroachdb") {
    console.log(
      `  ⊘ Skipping ${file} on ${environment.type} (bigint pk not supported)`
    );
    return;
  }

  const testNameFlags =
    testNames.length > 0
      ? testNames.map((name) => `-t "${name}"`).join(" ")
      : "";

  console.log(`  → Running on ${environment.type.toUpperCase()}...`);

  const dbLogsValue = logs ? "true" : "false";
  const command =
    `DB_LOGS=${dbLogsValue} MSSQL_TRUST_SERVER_CERTIFICATE=true DB_TYPE=${environment.type} DB_HOST=${environment.host} DB_USER=${environment.user} DB_PASSWORD=${environment.password} DB_DATABASE=${environment.database} npx jest --config=jest.config.js --colors --forceExit ${file} ${testNameFlags}`.trim();

  try {
    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        DB_LOGS: dbLogsValue,
        MSSQL_TRUST_SERVER_CERTIFICATE: "true",
        DB_TYPE: environment.type,
        DB_HOST: environment.host,
        DB_USER: environment.user,
        DB_PASSWORD: environment.password,
        DB_DATABASE: environment.database,
        COLUMNS: '100'
      },
    });

    if (stdout) {
      process.stdout.write(stdout);
    }

    if (stderr) {
      process.stderr.write(stderr);
    }
    console.log(`  ✓ ${environment.type.toUpperCase()} completed`);
  } catch (error) {
    console.log(`  ✗ ${environment.type.toUpperCase()} failed`);
    throw new Error(`[${environment.type}] Failed: ${error.message}`);
  }
};

const runNonSqlTest = (test) => {
  console.log(`Running ${test.name}...`);
  const runInBandFlag = test.runInBand ? "--runInBand" : "";
  execSync(`npx jest --config=jest.config.js --colors --forceExit ${runInBandFlag} ${test.path}`, {
    stdio: "inherit",
  });
};

const runTests = async (options) => {
  const {
    database: databases = [],
    testCase: testCases = [],
    file: files = [],
    logs = false,
  } = options;

  const invalidDbs = databases.filter((db) => !VALID_DB_TYPES.includes(db));
  if (invalidDbs.length > 0) {
    console.error(
      `Invalid database types: ${invalidDbs.join(", ")}. Valid types are: ${VALID_DB_TYPES.join(", ")}`
    );
    process.exit(1);
  }

  const environmentsToRun =
    databases.length > 0
      ? databases.map((db) => ALL_SQL_ENVIRONMENTS[db])
      : Object.values(ALL_SQL_ENVIRONMENTS);

  let sqlTestsToRun = SQL_TESTS;
  let nonSqlTestsToRun = [];

  if (files.length) {
    sqlTestsToRun = SQL_TESTS.filter((test) => {
      const fileName = test.split("/").pop();
      return files.some((file) => test === file || fileName === file);
    });

    nonSqlTestsToRun = NON_SQL_TESTS.filter((test) => {
      const fileName = test.path.split("/").pop();
      return files.some(
        (file) => test.path === file || fileName === file || test.name === file
      );
    });

    if (sqlTestsToRun.length === 0 && nonSqlTestsToRun.length === 0) {
      console.error(`No tests found matching files: ${files.join(", ")}`);
      process.exit(1);
    }
  }

  if (testCases.length && !files.length) {
    console.log(
      `🔍 Scanning test files for matching test cases: ${testCases.join(", ")}...\n`
    );
    sqlTestsToRun = sqlTestsToRun.filter((test) =>
      fileContainsTests(test, testCases)
    );
    if (sqlTestsToRun.length === 0) {
      console.error(
        `No test files found containing test cases: ${testCases.join(", ")}`
      );
      process.exit(1);
    }
    console.log(
      `✓ Found ${sqlTestsToRun.length} test file(s) with matching tests\n`
    );
  }

  if (sqlTestsToRun.length > 0) {
    for (const file of sqlTestsToRun) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`📋 Test File: ${file}`);
      console.log(`${"=".repeat(80)}\n`);

      console.log(
        `🔄 Running sequentially across ${environmentsToRun.length} database(s)...\n`
      );
      for (const environment of environmentsToRun) {
        try {
          await runSqlTest(file, environment, testCases, logs);
        } catch (error) {
          console.error(error.message);
          process.exit(1);
        }
      }
      console.log(`\n✅ All databases completed for ${file}`);
    }
  }

  const shouldRunAllNonSqlTests =
    databases.length === 0 && testCases.length === 0 && files.length === 0;

  const shouldRunFilteredNonSqlTests =
    files.length > 0 && nonSqlTestsToRun.length > 0;

  if (shouldRunAllNonSqlTests) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(
      `📦 Running Non-SQL specific Tests (Mongo, Redis, Cache, Replication)`
    );
    console.log(`${"=".repeat(80)}\n`);

    for (const test of NON_SQL_TESTS) {
      try {
        console.log(`  → Running ${test.name}...`);
        runNonSqlTest(test);
        console.log(`  ✓ ${test.name} completed`);
      } catch (error) {
        console.log(`  ✗ ${test.name} failed`);
        console.error(`Error running ${test.name}`);
        process.exit(1);
      }
    }
  }

  if (shouldRunFilteredNonSqlTests) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`📦 Running Filtered Non-SQL Tests`);
    console.log(`${"=".repeat(80)}\n`);

    for (const test of nonSqlTestsToRun) {
      try {
        console.log(`  → Running ${test.name}...`);
        runNonSqlTest(test);
        console.log(`  ✓ ${test.name} completed`);
      } catch (error) {
        console.log(`  ✗ ${test.name} failed`);
        console.error(`Error running ${test.name}`);
        process.exit(1);
      }
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log(`🎉 ALL TESTS PASSED!`);
  console.log(`${"=".repeat(80)}\n`);
  process.exit(0);
};

const program = new Command();

program
  .name("test-runner")
  .description("Run test suite for Hysteria ORM")
  .option(
    "-d, --database <databases...>",
    `Run tests for specific database(s), valid databases are: ${VALID_DB_TYPES.join(", ")}`,
    []
  )
  .option(
    "-t, --test-case <testCases...>",
    "Run specific test name(s) within files (passed to Jest -t)",
    []
  )
  .option(
    "-f, --file <files...>",
    "Run specific file(s) by filename or full path",
    []
  )
  .option("-l, --logs", "Enable database query logs (DB_LOGS=true)", false)
  .action(async (options) => {
    try {
      await runTests(options);
    } catch (error) {
      console.error("Test execution failed:", error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
