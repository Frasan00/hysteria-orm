import rollbackMigrationsConnector from "../../cli/migration_rollback_connector";
import runMigrationsConnector from "../../cli/migration_run_connector";
import { env } from "../../env/env";
import logger from "../../utils/logger";
import { SqlDataSource } from "../sql_data_source";
import {
  AugmentedSqlDataSource,
  SqlDataSourceInput,
  SqlDataSourceType,
} from "../sql_data_source_types";
import { Migration } from "./migration";

/**
 * @description Used internally from the CLI
 */
export class Migrator {
  private sql: SqlDataSource | AugmentedSqlDataSource;
  private readonly migrationTable = "migrations";

  constructor(sql?: SqlDataSource | AugmentedSqlDataSource) {
    this.sql = sql || SqlDataSource.getInstance();
  }

  async upMigrations(migrations: Migration[]): Promise<void> {
    for (const migration of migrations) {
      logger.info(`Running migration ${migration.migrationName}`);
      await migration.up();
      const statements = migration.schema.queryStatements;
      for (const statement of statements) {
        if (!statement) {
          continue;
        }

        await this.sql.rawQuery(statement);
      }

      await this.addMigrationToMigrationTable(migration);
      if (migration.afterMigration) {
        await migration.afterMigration(this.sql);
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

        await this.sql.rawQuery(statement);
      }

      await this.deleteMigrationFromMigrationTable(migration);
      if (migration.afterMigration) {
        await migration.afterMigration(this.sql);
      }
    }
  }

  private async addMigrationToMigrationTable(migration: Migration) {
    const completeUtcTimestamp = new Date();
    const timestamp = completeUtcTimestamp
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "");

    await this.sql.query(this.migrationTable).insert({
      name: migration.migrationName,
      timestamp,
    });
  }

  private async deleteMigrationFromMigrationTable(migration: Migration) {
    await this.sql
      .query(this.migrationTable)
      .where("name", migration.migrationName)
      .delete();
  }
}

/**
 * @description Can be used to run migrations programmatically
 */
export class ClientMigrator {
  protected migrationPath: string;
  protected sqlDataSourceInput?: SqlDataSource["inputDetails"] | SqlDataSource;

  constructor(
    migrationPath: string = env.MIGRATION_PATH || "database/migrations",
    sqlDataSourceInput?: SqlDataSource["inputDetails"] | SqlDataSource,
  ) {
    this.migrationPath = migrationPath;
    this.sqlDataSourceInput = sqlDataSourceInput;
  }

  /**
   * @description Runs programmatic migrations up
   */
  async up(): Promise<void> {
    return this.migrate("up");
  }

  /**
   * @description Runs programmatic migrations down
   */
  async down(): Promise<void> {
    return this.migrate("down");
  }

  /**
   * @description Runs programmatic migrations up or down
   * @param direction - The direction to migrate, either "up" or "down"
   */
  private async migrate(direction: "up" | "down"): Promise<void> {
    env.MIGRATION_PATH = this.migrationPath;
    const sqlDataSource =
      this.sqlDataSourceInput instanceof SqlDataSource
        ? this.sqlDataSourceInput
        : await SqlDataSource.connect({
            ...(this
              .sqlDataSourceInput as SqlDataSourceInput<SqlDataSourceType>),
          });

    if (direction === "up") {
      return runMigrationsConnector(
        sqlDataSource,
        undefined,
        this.migrationPath,
      );
    }

    return rollbackMigrationsConnector(
      sqlDataSource,
      undefined,
      this.migrationPath,
    );
  }
}

/**
 * @description Defines a programmatic migrator, can be used to run migrations programmatically
 * @param migrationPath - The path to the migrations
 * @param sqlDataSourceInput - The sql data source input, if not provided, env variables will be used
 */
export const defineMigrator = (
  migrationPath: string,
  sqlDataSourceInput?: SqlDataSource["inputDetails"] | SqlDataSource,
): ClientMigrator => {
  return new ClientMigrator(migrationPath, sqlDataSourceInput);
};
