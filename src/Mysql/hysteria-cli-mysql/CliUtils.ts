import { DatasourceInput } from "../../Datasource";
import { Pool } from "mysql2/promise";
import { MigrationTableType } from "./Templates/MigrationTableType";
import { createMigrationTableTemplate } from "./Templates/CreateMigrationTable";
import { Migration } from "../Migrations/Migration";
import fs from "fs";
import path from "path";

class CliUtils {
  public getMysqlConfig(): DatasourceInput {
    if (!process.env.MYSQL_PORT) throw new Error("MYSQL_PORT is not defined");
    return {
      type: "mysql",
      host: process.env.MYSQL_HOST || "localhost",
      port: +process.env.MYSQL_PORT,
      username: process.env.MYSQL_USERNAME || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "",
    };
  }

  public async getMigrationTable(mysql: Pool): Promise<MigrationTableType[]> {
    // Create the migrations table if it doesn't exist
    await mysql.query(createMigrationTableTemplate);
    // Get the list of migrations from the table in the database
    const [migrations] = await mysql.query("SELECT * FROM migrations");
    return migrations as MigrationTableType[];
  }

    public async getMigrations(): Promise<Migration[]> {
        const migrationPath = this.findMigrationPath();

        if (!migrationPath) {
            return [];
        }

        const migrationFiles = fs.readdirSync(migrationPath);

        const migrations: Migration[] = [];

        for (const file of migrationFiles) {
            const migrationName = path.parse(file).name;
            const migrationModulePath = path.join(migrationPath, file);

            // Use require for dynamic loading of TypeScript files
            const MigrationModule = require(migrationModulePath);

            // Instantiate the migration class
            const migration = new MigrationModule.default();
            migration.migrationName = migrationName;

            migrations.push(migration);
        }

        return migrations;
    }

    private findMigrationPath(): string | null {
        const possiblePaths = [
            path.join(process.cwd(), "/database/migrations"),
            path.join(process.cwd(), "/src/database/migrations"),
        ];

        for (const pathToCheck of possiblePaths) {
            if (fs.existsSync(pathToCheck)) {
                return pathToCheck;
            }
        }

        return null;
    }


  public getPendingMigrations(
    migrations: Migration[],
    migrationTable: MigrationTableType[],
  ): Migration[] {
    return migrations.filter((migration) => {
      const migrationName = migration.migrationName;
      const migrationTimestamp = migrationTable.find(
        (migration) => migration.name === migrationName,
      );
      return !migrationTimestamp;
    });
  }
}

export default new CliUtils();
