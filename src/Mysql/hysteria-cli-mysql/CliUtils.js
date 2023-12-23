import { createMigrationTableTemplate } from "./Templates/CreateMigrationTable";
import fs from "fs";
import path from "path";
class CliUtils {
    getMysqlConfig() {
        if (!process.env.MYSQL_PORT)
            throw new Error("MYSQL_PORT is not defined");
        return {
            type: "mysql",
            host: process.env.MYSQL_HOST || "localhost",
            port: +process.env.MYSQL_PORT,
            username: process.env.MYSQL_USERNAME || "root",
            password: process.env.MYSQL_PASSWORD || "",
            database: process.env.MYSQL_DATABASE || "",
        };
    }
    async getMigrationTable(mysql) {
        // Create the migrations table if it doesn't exist
        await mysql.query(createMigrationTableTemplate);
        // Get the list of migrations from the table in the database
        const [migrations] = await mysql.query("SELECT * FROM migrations");
        return migrations;
    }
    getMigrations() {
        const migrationPath = this.findMigrationPath();
        if (!migrationPath) {
            return [];
        }
        const migrationFiles = fs.readdirSync(migrationPath);
        const migrations = [];
        for (const file of migrationFiles) {
            const migrationName = path.parse(file).name;
            const migrationModulePath = path.join(migrationPath, file);
            const migrationModule = require(migrationModulePath);
            const migration = new migrationModule.default();
            migration.migrationName = migrationName;
            migrations.push(migration);
        }
        return migrations;
    }
    findMigrationPath() {
        const possiblePaths = [
            path.join(process.cwd(), "/database/migrations"),
            path.join(process.cwd(), "/src/database/migrations"),
        ];
        for (const pathToCheck of possiblePaths) {
            if (fs.existsSync(pathToCheck)) {
                return pathToCheck;
            }
        }
        return null;
    }
    getPendingMigrations(migrations, migrationTable) {
        return migrations.filter((migration) => {
            const migrationName = migration.migrationName;
            const migrationTimestamp = migrationTable.find((migration) => migration.name === migrationName);
            return !migrationTimestamp;
        });
    }
}
export default new CliUtils();
