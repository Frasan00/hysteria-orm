#!/usr/bin/env node
import fs from "fs";
import path from "path";
import MigrationTemplates from "./Templates/MigrationTemplates";
import dotenv from "dotenv";
import commander from "commander";

dotenv.config();

export function createMigration(name: string): void {
  const migrationFolderPath = "database/migrations";
  if (
    !fs.existsSync(migrationFolderPath) ||
    !fs.statSync(migrationFolderPath).isDirectory()
  ) {
    console.error(
      `Error: The migrations folder does not exist: '${migrationFolderPath}'.`,
    );
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

commander.program.parse(process.argv);
commander.program
  .command("create")
  .description(
    "Creates a new migration file in the migrations folder (database/migrations).",
  )
  .action(() => {
    const migrationName = process.argv[2];
    createMigration(migrationName);
  });
