#!/usr/bin/env node

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import MigrationTemplates from "../Templates/MigrationTemplates";

dotenv.config();

export function createMigrationPg(name: string): void {
  const migrationFolderPath = getMigrationPath();

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

function getMigrationPath(): string {
  let migrationPath = process.env.MIGRATION_PATH || "database/migrations";

  let i = 0;
  while (i < 10) {
    if (fs.existsSync(migrationPath)) {
      return migrationPath;
    }

    migrationPath = "../" + migrationPath;
    i++;
  }

  throw new Error("No database folder found");
}
