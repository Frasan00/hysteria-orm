// This file is used to enforce the order of test files to be run in a specific order.

import { execSync } from "node:child_process";
import {
  cockroachdbConfig,
  mariadbConfig,
  mysqlConfig,
  pgConfig,
  sqliteConfig,
} from "./test_environments.js";

const sqlEnvironments = [
  pgConfig,
  mysqlConfig,
  sqliteConfig,
  mariadbConfig,
  cockroachdbConfig,
];

const sqlTests = [
  // having related
  "./test/sql/bigint_pk/having_related.test.ts",
  "./test/sql/uuid_pk/having_related.test.ts",

  // edge cases
  "./test/sql/edge_cases/query_builder_complex_edge_cases.test.ts",
  "./test/sql/edge_cases/model_serialization_edge_cases.test.ts",

  // transaction
  "./test/sql/transaction/transaction.test.ts",

  // query builder
  "./test/sql/query_builder/query_builder.test.ts",
  "./test/sql/query_builder/embedded_models.test.ts",

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
];

sqlTests.forEach((file) => {
  sqlEnvironments.forEach((environment) => {
    if (file.includes("bigint_pk") && environment.type === "cockroachdb") {
      console.log(
        `Skipping ${file} on ${environment.type} since it's using bigint pk`
      );
      return;
    }

    console.log(`Running ${file} on ${environment.type}`);
    try {
      execSync(
        `DB_LOGS=true DB_TYPE=${environment.type} DB_HOST=${environment.host} DB_USER=${environment.user} DB_PASSWORD=${environment.password} DB_DATABASE=${environment.database} jest --config=jest.config.js --detectOpenHandles ${file}`,
        { stdio: "inherit" }
      );
    } catch (error) {
      console.error(`Error running ${file}`);
      process.exit(1);
    }
  });
});

// use connection
execSync(
  `jest --config=jest.config.js --detectOpenHandles ./test/sql/use_connection/use_connection.test.ts`,
  { stdio: "inherit" }
);

// mongo
execSync(
  `jest --config=jest.config.js --detectOpenHandles ./test/mongo/crud_mongo.test.ts`,
  { stdio: "inherit" }
);

// redis
execSync(
  `jest --config=jest.config.js --detectOpenHandles ./test/redis/redis.test.ts`,
  { stdio: "inherit" }
);

console.log("All tests passed");
process.exit(0);
