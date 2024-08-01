#!/usr/bin/env node

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import MigrationTemplates from "../Templates/MigrationTemplates";
import PostgresCliUtils from "./PostgresCliUtils";

dotenv.config();

export function createMigrationPg(name: string): void {
  const migrationFolderPath = PostgresCliUtils.getMigrationPath();

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
