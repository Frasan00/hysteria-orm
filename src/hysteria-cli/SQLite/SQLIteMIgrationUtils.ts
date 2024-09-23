import { PoolClient } from "pg";
import { MigrationTableType } from "../resources/MigrationTableType";
import fs from "fs";
import MigrationTemplates from "../resources/MigrationTemplates";
import dotenv from "dotenv";
import path from "path";
import { DataSourceInput, Migration } from "../..";
import sqlite3 from "sqlite3";

dotenv.config();

class SQLiteMigrationUtils {
  public getSQLiteConfig(): DataSourceInput {
    return {
      type: "sqlite",
      database: process.env.DB_DATABASE || "",
    };
  }

  public async getMigrationTable(
    sqLiteConnection: sqlite3.Database,
  ): Promise<MigrationTableType[]> {
    await this.promisifyQuery(MigrationTemplates.migrationTableTemplatePg(), [], sqLiteConnection);
    const result = await this.promisifyQuery<MigrationTableType[]>(
      MigrationTemplates.selectAllFromMigrationsTemplate(),
      [],
      sqLiteConnection,
    );
    return result as MigrationTableType[];
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
    let migrationPath = path.resolve(
      process.env.MIGRATION_PATH || "database/migrations",
    );

    let tries = 0;
    while (true) {
      if (tries++ > 5) {
        break;
      }

      if (
        fs.existsSync(migrationPath) &&
        fs.readdirSync(migrationPath).length > 0
      ) {
        return fs.readdirSync(migrationPath);
      }

      const parentPath = path.resolve(migrationPath, "..");
      if (parentPath === migrationPath) {
        break;
      }

      tries++;
      migrationPath = parentPath;
    }

    throw new Error("No database migration files found");
  }

  public async findMigrationModule(
    migrationName: string,
    migrationModulePath: string = process.env.MIGRATION_PATH
      ? process.env.MIGRATION_PATH + "/" + migrationName
      : "database/migrations/" + migrationName,
  ): Promise<any> {
    const absolutePath = path.resolve(migrationModulePath.replace(/\.ts$/, ""));

    try {
      const migrationModule = await import(absolutePath);
      if (migrationModule.default) {
        return migrationModule;
      }
    } catch (_error) {}

    const parentPath = path.resolve(path.dirname(absolutePath), "..");
    if (parentPath === path.dirname(absolutePath)) {
      throw new Error(
        "Migration module not found for migration: " + migrationName,
      );
    }

    return this.findMigrationModule(
      migrationName,
      path.join(parentPath, path.basename(migrationModulePath)),
    );
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

  public promisifyQuery<T>(query: string, params: any, sqLiteConnection: sqlite3.Database): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      sqLiteConnection.get<T>(query, params, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  }
}

export default new SQLiteMigrationUtils();
