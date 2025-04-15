// This file is used to enforce the order of test files to be run in a specific order.

import { execSync } from "node:child_process";
import {
  mysqlConfig,
  mariadbConfig,
  pgConfig,
  cockroachdbConfig,
  sqliteConfig,
} from "./test_environments.js";

const sqlEnvironments = [
  cockroachdbConfig,
  pgConfig,
  sqliteConfig,
  mysqlConfig,
  mariadbConfig,
];

const sqlTests = [
  // use connection
  "./test/sql/use_connection/use_connection.test.ts",

  // query builder
  "./test/sql/query_builder/query_builder.test.ts",

  // without primary key tests
  "./test/sql/without_pk/user_without_pk_crud.test.ts",
];

sqlTests.forEach((file) => {
  sqlEnvironments.forEach((environment) => {
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
