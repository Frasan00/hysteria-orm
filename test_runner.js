// This file is used to enforce the order of test files to be run in a specific order.

const { execSync } = require('child_process');

const testFiles = [
    // mongo
    // './test/mongo/trx_mongo.test.ts',
    './test/mongo/crud_mongo.test.ts',
    
    // relations
    './test/sql/sqlite/relations_sqlite.test.ts',
    './test/sql/mysql/relations_mysql.test.ts',
    './test/sql/mariadb/relations_mariadb.test.ts',
    './test/sql/pg/relations_pg.test.ts',
    
    // trx
    './test/sql/sqlite/trx_sqlite.test.ts',
    './test/sql/pg/trx_pg.test.ts',
    './test/sql/mysql/trx_mysql.test.ts',
    './test/sql/mariadb/trx_mariadb.test.ts',
    
    // pg
    './test/sql/pg/crud_pg.test.ts',

    // sqlite
    './test/sql/sqlite/crud_sqlite.test.ts',
    
    // maria
    './test/sql/mariadb/crud_mariadb.test.ts',

    // mysql
    './test/sql/mysql/crud_mysql.test.ts',

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