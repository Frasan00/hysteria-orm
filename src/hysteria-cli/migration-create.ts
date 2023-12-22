import fs from "fs";
import path from "path";
import MigrationTemplates from "./Templates/MigrationTemplates";

const migrationFolderPath = "database/migrations";

function createMigration(name: string): void {
  if (
    !fs.existsSync(migrationFolderPath) ||
    !fs.statSync(migrationFolderPath).isDirectory()
  ) {
    console.error(
      `Error: The migrations folder does not exist at '${migrationFolderPath}'.`,
    );
    process.exit(1);
  }

  // Generate migration filename
  const timestamp = new Date().getTime();
  const migrationFileName = `${name}_${timestamp}.ts`;
  const migrationFilePath = path.join(migrationFolderPath, migrationFileName);

  const migrationTemplate = MigrationTemplates.basicMigrationTemplate();
  fs.writeFileSync(migrationFilePath, migrationTemplate);

  console.log(`Migration created successfully at '${migrationFilePath}'.`);
}

if (process.argv.length < 3) {
  console.error("Error: Please provide a name for the migration.");
  process.exit(1);
}

const migrationName = process.argv[2];
createMigration(migrationName);
