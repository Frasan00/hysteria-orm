// This file is used to enforce the order of test files to be run in a specific order.

const { execSync } = require('child_process');

const testFiles = [
    // relations
    // './test/sql/mariadb/relations_mariadb.test.ts', // TODO: working on many to many query
    './test/sql/pg/relations_pg.test.ts',
    './test/sql/mysql/relations_mysql.test.ts',
    './test/sql/sqlite/relations_sqlite.test.ts',

    // trx
    './test/sql/sqlite/trx_sqlite.test.ts',
    './test/sql/pg/trx_pg.test.ts',
    './test/sql/mysql/trx_mysql.test.ts',
    './test/sql/mariadb/trx_mariadb.test.ts',

    // crud
    './test/sql/pg/crud_pg.test.ts',
    './test/sql/sqlite/crud_sqlite.test.ts',
    './test/sql/mariadb/crud_mariadb.test.ts',
    './test/sql/mysql/crud_mysql.test.ts',

    // mongo
    './test/mongo/crud_mongo.test.ts',
    // './test/mongo/trx_mongo.test.ts', // sessions are usable only in replica set

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
