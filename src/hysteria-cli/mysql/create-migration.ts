#!/usr/bin/env node

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import MigrationTemplates from "../Templates/MigrationTemplates";
import MysqlCliUtils from "./MysqlCliUtils";

dotenv.config();

export function createMigrationSql(name: string): void {
  const migrationFolderPath = MysqlCliUtils.getMigrationPath();

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
