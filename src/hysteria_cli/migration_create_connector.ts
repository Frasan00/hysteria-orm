#!/usr/bin/env ts-node

import dotenv from "dotenv";
import path from "path";
import MigrationTemplates from "./resources/migration_templates";
import fs from "fs";
import logger from "../utils/logger";

dotenv.config();

function getOrCreateMigrationPath(): string {
  let migrationPath = process.env.MIGRATION_PATH || "database/migrations";
  let currentPath = path.resolve(process.cwd(), migrationPath);

  if (!fs.existsSync(currentPath)) {
    fs.mkdirSync(currentPath, { recursive: true });
  }

  return currentPath;
}

export default function migration_create_connector(name: string) {
  const migrationFolderPath = getOrCreateMigrationPath();

  const timestamp = new Date().getTime();
  const migrationFileName = `${timestamp}_${name}.ts`;
  const migrationFilePath = path.join(migrationFolderPath, migrationFileName);

  const migrationTemplate = MigrationTemplates.basicMigrationTemplate();
  fs.writeFileSync(migrationFilePath, migrationTemplate);

  logger.info(`Migration created successfully at '${migrationFilePath}'.`);
}

const arg = process.argv[2];
if (!arg) {
  throw new Error("Please provide a name for the migration");
}

migration_create_connector(arg);
