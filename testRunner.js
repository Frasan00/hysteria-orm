// This file is used to enforce the order of test files to be run in a specific order.

const { execSync } = require('child_process');

const testFiles = [
    './test/sql/mysql/relations.mysql.test.ts',
    './test/sql/mysql/crud.mysql.test.ts',
    './test/sql/pg/relations.pg.test.ts',
    './test/sql/pg/crud.pg.test.ts',
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
