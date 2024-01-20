import { DatasourceInput } from "../../Datasource";
import { Pool, PoolClient } from "pg";
import { MigrationTableType } from "../Templates/MigrationTableType";
import { Migration } from "../../Sql/Migrations/Migration";
import fs from "fs";
import MigrationTemplates from "../Templates/MigrationTemplates";

class PgCliUtils {
  public getPgConfig(): DatasourceInput {
    if (!process.env.PG_PORT) throw new Error("PG_PORT is not defined");
    return {
      type: "postgres",
      host: process.env.PG_HOST || "localhost",
      port: +process.env.PG_PORT,
      username: process.env.PG_USERNAME || "postgres",
      password: process.env.PG_PASSWORD || "",
      database: process.env.PG_DATABASE || "",
    };
  }

  public async getMigrationTable(
    pgPool: PoolClient,
  ): Promise<MigrationTableType[]> {
    await pgPool.query(MigrationTemplates.migrationTableTemplate());
    const result = await pgPool.query(
      MigrationTemplates.selectAllFromMigrationsTemplate(),
    );
    return result.rows as MigrationTableType[];
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

    throw new Error("No database migration files found");
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

    throw new Error("Migration module not found");
  }

  public getPendingMigrations(
    migrations: Migration[],
    migrationTable: MigrationTableType[],
  ): Migration[] {
    return migrations.filter((migration) => {
      const migrationName = migration.migrationName;
      const migrationEntry = migrationTable.find(
        (m) => m.name === migrationName,
      );
      return !migrationEntry;
    });
  }
}

export default new PgCliUtils();
