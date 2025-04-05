import fs from "fs";
import path from "path";
import logger from "../utils/logger";
import MigrationTemplates from "./resources/migration_templates";

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
  mode: "alter" | "create" | "basic" = "basic",
  table: string = "table",
) {
  const migrationFolderPath = getOrCreateMigrationPath();
  const timestamp = new Date().getTime();
  const migrationFileName = !js
    ? `${timestamp}_${name}.ts`
    : `${timestamp}_${name}.js`;
  const migrationFilePath = path.join(migrationFolderPath, migrationFileName);

  let migrationTemplate: string;
  switch (mode) {
    case "alter":
      migrationTemplate = MigrationTemplates.alterMigrationTemplate(js, table);
      break;
    case "create":
      migrationTemplate = MigrationTemplates.createMigrationTemplate(js, table);
      break;
    default:
      migrationTemplate = MigrationTemplates.basicMigrationTemplate(js);
      break;
  }

  fs.writeFileSync(migrationFilePath, migrationTemplate);
  logger.info(`Migration created successfully at '${migrationFilePath}'.`);
  process.exit(0);
}
