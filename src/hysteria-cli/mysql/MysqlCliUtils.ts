import { DatasourceInput } from "../../Datasource";
import { PoolConnection } from "mysql2/promise";
import { MigrationTableType } from "../Templates/MigrationTableType";
import { Migration } from "../../Sql/Migrations/Migration";
import fs from "fs";
import MigrationTemplates from "../Templates/MigrationTemplates";

class MysqlCliUtils {
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
    await mysql.query(MigrationTemplates.migrationTableTemplate());
    // Get the list of migrations from the table in the database
    const [migrations] = await mysql.query(
      MigrationTemplates.selectAllFromMigrationsTemplate(),
    );

    return migrations as MigrationTableType[];
  }

  public async getMigrations(): Promise<Migration[]> {
    const migrationNames = this.findMigrationNames();

    const migrations: Migration[] = [];

    for (const migrationName of migrationNames) {
      const migrationModule = (await this.findMigrationModule(migrationName))
        .default;
      const migration: Migration = new migrationModule();
      migration.migrationName = migrationName;
      migrations.push(migration);
    }

    return migrations;
  }

  private findMigrationNames(): string[] {
    let migrationPath = process.env.MIGRATION_PATH || "database/migrations";

    let i = 0;
    while (i < 10) {
      if (
        fs.existsSync(migrationPath) &&
        fs.readdirSync(migrationPath).length > 0
      ) {
        return fs.readdirSync(migrationPath);
      }

      migrationPath = "../" + migrationPath;
      i++;
    }

    throw new Error("No database files found");
  }

  private async findMigrationModule(migrationName: string) {
    let migrationModulePath =
      process.env.MIGRATION_PATH + "/" + migrationName ||
      "database/migrations/" + migrationName;

    let i = 0;
    while (i < 8) {
      try {
        const migrationModule = await import(migrationModulePath.slice(0, -3));
        if (migrationModule) {
          return migrationModule;
        }
      } catch (_error) {}

      migrationModulePath = "../" + migrationModulePath;
      i++;
    }
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

export default new MysqlCliUtils();
