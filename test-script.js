const {runMigrations} = require("./src/Mysql/hysteria-cli-mysql/migration-run");
runMigrations()
    .then((_data) => {
        console.log("Migrations completed successfully.");
        process.exit(0);
    })
    .catch(error => {
        console.error("Error: An error occurred while running migrations: " + error.message);
        process.exit(1);
    });
