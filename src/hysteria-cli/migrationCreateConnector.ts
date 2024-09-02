#!/usr/bin/env ts-node

import dotenv from "dotenv";
import path from "path";
import MigrationTemplates from "./resources/MigrationTemplates";
import fs from "fs";

dotenv.config();

function getMigrationPath(): string {
  let migrationPath = process.env.MIGRATION_PATH || "database/migrations";
  let currentPath = path.resolve(process.cwd(), migrationPath);
  let tries = 0;

  while (true) {
    if (tries++ > 5) {
      break;
    }

    if (fs.existsSync(currentPath)) {
      return currentPath;
    }

    const parentPath = path.resolve(currentPath, "..");
    if (parentPath === currentPath) {
      break;
    }

    tries++;
    currentPath = path.resolve(parentPath, migrationPath);
  }

  throw new Error("No migration folder found");
}

export default function migrationCreateConnector(name: string) {
  const migrationFolderPath = getMigrationPath();

  const timestamp = new Date().getTime();
  const migrationFileName = `${timestamp}_${name}.ts`;
  const migrationFilePath = path.join(migrationFolderPath, migrationFileName);

  const migrationTemplate = MigrationTemplates.basicMigrationTemplate();
  fs.writeFileSync(migrationFilePath, migrationTemplate);

  console.log(`Migration created successfully at '${migrationFilePath}'.`);
}

const arg = process.argv[2];
if (!arg) {
  throw new Error("Please provide a name for the migration");
}

migrationCreateConnector(arg);
