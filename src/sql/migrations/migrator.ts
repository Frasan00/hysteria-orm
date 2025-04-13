import { env } from "../../env/env";
import rollbackMigrationsConnector from "../../hysteria_cli/migration_rollback_connector";
import runMigrationsConnector from "../../hysteria_cli/migration_run_connector";
import logger from "../../utils/logger";
import { SqlDataSource } from "../sql_data_source";
import { Migration } from "./migration";

/**
 * @description Used internally from the CLI
 */
export class Migrator {
  async upMigrations(migrations: Migration[]): Promise<void> {
    for (const migration of migrations) {
      logger.info(`Running migration ${migration.migrationName}`);
      await migration.up();
      const statements = migration.schema.queryStatements;
      for (const statement of statements) {
        if (!statement) {
          continue;
        }

        await SqlDataSource.rawQuery(statement);
      }

      await this.addMigrationToMigrationTable(migration);
      if (migration.afterMigration) {
        await migration.afterMigration(SqlDataSource.getInstance());
      }
    }
  }

  async downMigrations(migrations: Migration[]): Promise<void> {
    migrations = migrations.reverse();
    for (const migration of migrations) {
      logger.info(`Rolling back migration ${migration.migrationName}`);
      await migration.down();
      const statements = migration.schema.queryStatements;
      for (const statement of statements) {
        if (!statement) {
          continue;
        }

        await SqlDataSource.rawQuery(statement);
      }

      await this.deleteMigrationFromMigrationTable(migration);
      if (migration.afterMigration) {
        await migration.afterMigration(SqlDataSource.getInstance());
      }
    }
  }

  private async addMigrationToMigrationTable(migration: Migration) {
    const completeUtcTimestamp = new Date();
    const timestamp = completeUtcTimestamp
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "");

    const insertMigrationSql = `INSERT INTO migrations (name, timestamp) VALUES ('${migration.migrationName}', '${timestamp}')`;
    await SqlDataSource.rawQuery(insertMigrationSql);
  }

  private async deleteMigrationFromMigrationTable(migration: Migration) {
    const deleteMigrationSql = `DELETE FROM migrations WHERE name = '${migration.migrationName}'`;
    await SqlDataSource.rawQuery(deleteMigrationSql);
  }
}

/**
 * @description Can be used to run migrations programmatically
 */
export class ClientMigrator {
  protected migrationPath: string;
  protected verbose: boolean;

  constructor(migrationPath: string, verbose: boolean = false) {
    this.migrationPath = migrationPath;
    this.verbose = verbose;
  }

  async migrate(direction: "up" | "down"): Promise<void> {
    env.MIGRATION_PATH = this.migrationPath;
    if (direction === "up") {
      return runMigrationsConnector(undefined, this.verbose, true);
    }

    return rollbackMigrationsConnector(undefined, this.verbose, true);
  }
}

/**
 * @description Defines a programmatic migrator, can be used to run migrations programmatically
 */
export const defineMigrator = (
  migrationPath: string,
  verbose: boolean = false,
): ClientMigrator => {
  return new ClientMigrator(migrationPath, verbose);
};
