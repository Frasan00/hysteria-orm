// This file is used to enforce the order of test files to be run in a specific order.

import { execSync } from "node:child_process";

const testFiles = [
    // without primary key tests
    './test/sql/cockroachdb/without_pk/user_without_pk_crud.test.ts',
    './test/sql/maria/without_pk/user_without_pk_crud.test.ts',
    './test/sql/mysql/without_pk/user_without_pk_crud.test.ts',
    './test/sql/pg/without_pk/user_without_pk_crud.test.ts',
    './test/sql/sqlite/without_pk/user_without_pk_crud.test.ts',

    // mongo
    './test/mongo/crud_mongo.test.ts',

    // redis
    './test/redis/redis.test.ts',
];

testFiles.forEach((file) => {
    console.log(`Running ${file}`);
    try {
        execSync(`jest --config=jest.config.js --detectOpenHandles ${file}` , { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error running ${file}`);
        process.exit(1);
    }
});

console.log("All tests passed");
process.exit(0);
