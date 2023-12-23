import { DatasourceInput } from "../../Datasource";
import { Pool, PoolConnection } from "mysql2/promise";
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

  public async getMigrationTable(
    mysql: PoolConnection,
  ): Promise<MigrationTableType[]> {
    // Create the migrations table if it doesn't exist
    await mysql.query(createMigrationTableTemplate);
    // Get the list of migrations from the table in the database
    const [migrations] = await mysql.query("SELECT * FROM migrations");
    return migrations as MigrationTableType[];
  }

  public async getMigrations(): Promise<Migration[]> {
    const migrationPath = this.findMigrationPath() || "";
    console.log("migrationPath", migrationPath);

    if (!migrationPath) {
      return [];
    }

    const migrationFiles: string[] = fs
      .readdirSync("../../test/database/migrations/first-migration")
      .filter((file) => {
        return file.indexOf(".js") !== -1;
      });

    const migrations: Migration[] = [];

    for (const file of migrationFiles) {
      const migrationName = path.parse(file).name;
      const migrationModulePath = path
        .join(migrationPath, file)
        .replace(/\\/g, "/")
        .replace(".ts", "");

      try {
        const migrationModule = (await import(migrationModulePath)).default;
        const migration = new migrationModule();
        migration.migrationName = migrationName;
        migrations.push(migration);
      } catch (error) {
        console.error(`Error importing migration ${file}:`, error);
      }
    }

    return migrations;
  }

  private findMigrationPath(): string | null {
    const currDir = __dirname.split("/");

    while (currDir.length > 0) {
      const migrationPath = currDir.join("/") + "/database/migrations";
      if (fs.existsSync(migrationPath)) {
        return migrationPath;
      }
      currDir.pop();
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
