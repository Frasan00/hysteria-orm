import logger from "../../Logger";
import { log } from "../../Logger";
import migrationParser from "./MigrationParser";
export class MigrationController {
    constructor(mysqlConnection) {
        Object.defineProperty(this, "mysqlConnection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "logs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.mysqlConnection = mysqlConnection;
        this.logs = true;
    }
    async runMigration(migration) {
        try {
            await this.upMigration(migration);
        }
        catch (error) {
            logger.error("Failed to run migrations");
            throw new Error("Failed to run migrations" + error);
        }
    }
    async rollbackMigration(migration) {
        try {
            await this.downMigration(migration);
        }
        catch (error) {
            logger.error("Failed to run migrations");
            throw new Error("Failed to run migrations" + error);
        }
    }
    async upMigration(migration) {
        logger.info("Running migration: " + migration.tableName);
        migration.up();
        const statement = this.parseMigration(migration);
        log(statement, this.logs);
        await this.mysqlConnection.query(statement);
        logger.info("Migration complete: " + migration.tableName);
    }
    async downMigration(migration) {
        logger.info("Rolling back migration: " + migration.tableName);
        migration.down();
        const statement = this.parseMigration(migration);
        log(statement, this.logs);
        await this.mysqlConnection.query(statement);
        logger.info("Rollback complete: " + migration.tableName);
    }
    parseMigration(migration) {
        if (migration.migrationType === "create") {
            return migrationParser.parseCreateTableMigration(migration);
        }
        if (migration.migrationType === "alter") {
            return migrationParser.parseAlterTableMigration(migration);
        }
        if (migration.migrationType === "drop") {
            return migrationParser.parseDropColumnMigration(migration);
        }
        if (migration.migrationType === "rawQuery") {
            return migration.rawQuery;
        }
        throw new Error("Migration type not found");
    }
}
