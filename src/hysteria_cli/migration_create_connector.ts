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

export default function migrationCreateConnector(
  name: string,
  js: boolean = false,
) {
  const migrationFolderPath = getOrCreateMigrationPath();
  const timestamp = new Date().getTime();
  const migrationFileName = !js
    ? `${timestamp}_${name}.ts`
    : `${timestamp}_${name}.js`;
  const migrationFilePath = path.join(migrationFolderPath, migrationFileName);

  const migrationTemplate = MigrationTemplates.basicMigrationTemplate(js);
  fs.writeFileSync(migrationFilePath, migrationTemplate);
  logger.info(`Migration created successfully at '${migrationFilePath}'.`);
}
