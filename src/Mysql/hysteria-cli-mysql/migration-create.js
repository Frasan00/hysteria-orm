#!/usr/bin/env node
import fs from "fs";
import path from "path";
import MigrationTemplates from "./Templates/MigrationTemplates";
import dotenv from "dotenv";
dotenv.config();
export function createMigration(name) {
    const migrationFolderPath = process.env.MIGRATION_PATH || "database/migrations";
    if (!fs.existsSync(migrationFolderPath) ||
        !fs.statSync(migrationFolderPath).isDirectory()) {
        console.error(`Error: The migrations folder does not exist: '${migrationFolderPath}'.`);
        process.exit(1);
    }
    // Generate migration filename
    const timestamp = new Date().getTime();
    const migrationFileName = `${timestamp}_${name}.ts`;
    const migrationFilePath = path.join(migrationFolderPath, migrationFileName);
    const migrationTemplate = MigrationTemplates.basicMigrationTemplate();
    fs.writeFileSync(migrationFilePath, migrationTemplate);
    console.log(`Migration created successfully at '${migrationFilePath}'.`);
}
if (!process.argv[2]) {
    console.error("Error: Please provide a name for the migration.");
    process.exit(1);
}
const migrationName = process.argv[2];
createMigration(migrationName);
