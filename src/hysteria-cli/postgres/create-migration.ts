#!/usr/bin/env node

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import MigrationTemplates from "../resources/MigrationTemplates";
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
