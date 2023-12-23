#!/usr/bin/env node
import path from "path";
import CliUtils from "./CliUtils";
import dotenv from "dotenv";
import { MigrationController } from "../Migrations/MigrationController";
import { createPool } from "mysql2/promise";
dotenv.config();
// Function to run pending migrations
export async function runMigrations() {
    const migrationFolderPath = process.env.MIGRATION_PATH || "database/migrations";
    const config = CliUtils.getMysqlConfig();
    const mysql = createPool({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
        waitForConnections: true,
    });
    const migrationTable = await CliUtils.getMigrationTable(mysql);
    const migrations = CliUtils.getMigrations();
    const pendingMigrations = CliUtils.getPendingMigrations(migrations, migrationTable);
    // Parses and runs the migrations
    const migrationManager = new MigrationController(mysql);
    // If there are no pending migrations, print a message and exit
    if (pendingMigrations.length === 0) {
        console.log("No pending migrations.");
        process.exit(0);
    }
    // Run each pending migration
    for (const migration of pendingMigrations) {
        const migrationName = migration.migrationName;
        const migrationFilePath = path.join(migrationFolderPath, migrationName);
        try {
            await mysql.beginTransaction();
            console.log(`Running migration: ${migrationName} (${migrationFilePath})`);
            await migrationManager.runMigration(migration);
            // Update the migrations table in the database
            await mysql.query(`INSERT INTO migrations (name, timestamp) VALUES (?, ?)`, [migrationName, new Date().getTime()]);
            console.log(`Migration completed: ${migrationName}`);
        }
        catch (error) {
            await mysql.rollback();
            throw new Error(error);
        }
    }
    await mysql.commit();
    await mysql.end();
    console.log("Migrations completed successfully.");
}
runMigrations()
    .then((_data) => {
    console.log("Migrations completed successfully.");
    process.exit(0);
})
    .catch((error) => {
    console.error("Error: An error occurred while running migrations: " + error.message);
    process.exit(1);
});
