import { Pool } from "mysql2/promise";
import { Migration } from "./Migration";
import logger from "../../Logger";

interface MigrationControllerInput {
  mysqlConnection: Pool;
  logs: boolean;
}

export class MigrationController {
  protected mysqlConnection: Pool;
  protected migrations!: Migration[];
  protected logs: boolean;

  constructor(input: MigrationControllerInput) {
    this.mysqlConnection = input.mysqlConnection;
    this.logs = input.logs;
  }

  public async run(): Promise<void> {
    if (!this.migrations) {
      logger.info("No migrations to run");
      return;
    }

    try {
      for (const migration of this.migrations) {
        await migration.up();
      }
    } catch (error) {
      logger.error("Failed to run migrations");
      throw new Error("Failed to run migrations" + error);
    }
  }

  public async runMigration(migration: Migration): Promise<void> {
    try {
      await migration.up();
    } catch (error) {
      logger.error("Failed to run migrations");
      throw new Error("Failed to run migrations" + error);
    }
  }

  public async rollbackMigrations(): Promise<void> {
    if (!this.migrations) {
      logger.info("No migrations to rollback");
      return;
    }

    try {
      for (const migration of this.migrations) {
        await migration.down();
      }
    } catch (error) {
      logger.error("Failed to run migrations");
      throw new Error("Failed to run migrations" + error);
    }
  }

  public async rollbackMigration(migration: Migration): Promise<void> {
    try {
      await migration.down();
    } catch (error) {
      logger.error("Failed to run migrations");
      throw new Error("Failed to run migrations" + error);
    }
  }

  public getMigrations(migrations: Migration[]): MigrationController {
    this.migrations = migrations;
    return this;
  }
}
