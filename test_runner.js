// This file is used to enforce the order of test files to be run in a specific order.

const { execSync } = require('child_process');

const testFiles = [
    // trx
    './test/sql/mysql/trx.mysql.test.ts',
    './test/sql/pg/trx.pg.test.ts',
    './test/sql/mariadb/trx.mariadb.test.ts',
    './test/sql/sqlite/trx.sqlite.test.ts',
    
    // sqlite
    './test/sql/sqlite/relations.sqlite.test.ts',
    './test/sql/sqlite/crud.sqlite.test.ts',
    
    // pg
    './test/sql/pg/relations.pg.test.ts',
    './test/sql/pg/crud.pg.test.ts',
    
    // maria
    './test/sql/mariadb/relations.mariadb.test.ts',
    './test/sql/mariadb/crud.mariadb.test.ts',


    // mysql
    './test/sql/mysql/relations.mysql.test.ts',
    './test/sql/mysql/crud.mysql.test.ts',

    // redis
    './test/redis/redis.test.ts',
];

testFiles.forEach((file) => {
    console.log(`Running ${file}`);
    try {
        execSync(`jest --detectOpenHandles ${file}` , { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error running ${file}`);
        process.exit(1);
    }
});    
