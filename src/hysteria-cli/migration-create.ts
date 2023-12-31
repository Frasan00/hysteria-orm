#!/usr/bin/env node
import fs from "fs";
import path from "path";
import MigrationTemplates from "./Templates/MigrationTemplates";
import dotenv from "dotenv";
import commander from "commander";

dotenv.config();

export function createMigration(name: string): void {
  const migrationFolderPath = getMigrationPath();

  // Generate database filename
  const timestamp = new Date().getTime();
  const migrationFileName = `${timestamp}_${name}.ts`;
  const migrationFilePath = path.join(migrationFolderPath, migrationFileName);

  const migrationTemplate = MigrationTemplates.basicMigrationTemplate();
  fs.writeFileSync(migrationFilePath, migrationTemplate);

  console.log(`Migration created successfully at '${migrationFilePath}'.`);
}

if (!process.argv[2]) {
  console.error("Error: Please provide a name for the database.");
  process.exit(1);
}

function getMigrationPath(): string {
  let migrationPath = process.env.MIGRATION_PATH || "database/migrations";

  let i = 0;
  while (i < 10) {
    console.log(migrationPath);
    if (fs.existsSync(migrationPath)) {
      return migrationPath;
    }

    migrationPath = "../" + migrationPath;
    i++;
  }

  throw new Error("No database folder found");
}

commander.program.parse(process.argv);
commander.program
  .command("hysteria migration:create")
  .description(
    "Creates a new migration file in the migrations folder (default: database/migrations).",
  )
  .action(() => {
    const migrationName = process.argv[2];
    createMigration(migrationName);
  });
