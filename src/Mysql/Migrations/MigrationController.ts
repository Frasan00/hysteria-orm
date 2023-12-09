import { Pool } from "mysql2/promise";
import { Migration } from "./Migration";
import logger from "../../Logger";
import fs from "fs";
import { log } from "../../Logger";
import migrationParser from "./MigrationParser";

interface MigrationControllerInput {
  mysqlConnection: Pool;
  readonly migrationsPath?: string;
  readonly logs: boolean;
}

export class MigrationController {
  protected mysqlConnection: Pool;
  protected migrationsPath?: string;
  protected migrations: Migration[];
  protected logs: boolean;

  constructor(input: MigrationControllerInput) {
    this.mysqlConnection = input.mysqlConnection;
    this.migrationsPath = input.migrationsPath;
    this.migrations = this.getMigrationFiles() || [];
    this.logs = input.logs;
  }

  protected getMigrationFiles(): Migration[] {
    if (!this.migrationsPath) {
      throw new Error("No migrations path provided");
    }

    const migrations: Migration[] = [];
    const normalizedPath = require("path").join(this.migrationsPath || "");

    fs.readdirSync(normalizedPath).forEach((file: string) => {
      const migration = require(normalizedPath + "/" + file).default;
      migrations.push(new migration());
    });

    return migrations;
  }

  public async run(): Promise<void> {
    if (!this.migrations) {
      logger.info("No migrations to run");
      return;
    }

    try {
      for (const migration of this.migrations) {
        await this.upMigration(migration).catch((error) => {
          console.log(error);
        });
      }
    } catch (error) {
      logger.error("Failed to run migrations");
      throw new Error("Failed to run migrations" + error);
    }
  }

  public async runMigration(migration: Migration): Promise<void> {
    try {
      await this.upMigration(migration);
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
        await this.downMigration(migration);
      }
    } catch (error) {
      logger.error("Failed to run migrations");
      throw new Error("Failed to run migrations" + error);
    }
  }

  public async rollbackMigration(migration: Migration): Promise<void> {
    try {
      await this.downMigration(migration);
    } catch (error) {
      logger.error("Failed to run migrations");
      throw new Error("Failed to run migrations" + error);
    }
  }

  public addMigrationsManually(migrations: Migration[]): void {
    this.migrations.push(...migrations);
  }

  private async upMigration(migration: Migration): Promise<void> {
    logger.info("Running migration: " + migration.tableName);
    migration.up();
    const statement = this.parseMigration(migration);
    log(statement, this.logs);
    await this.mysqlConnection.query(statement);
    logger.info("Migration complete: " + migration.tableName);
  }

  private async downMigration(migration: Migration): Promise<void> {
    logger.info("Rolling back migration: " + migration.tableName);
    migration.down();
    const statement = this.parseMigration(migration);
    log(statement, this.logs);
    await this.mysqlConnection.query(statement);
    logger.info("Rollback complete: " + migration.tableName);
  }

  private parseMigration(migration: Migration): string {
    if (migration.migrationType === "create") {
      return migrationParser.parseCreateTableMigration(migration);
    }

    if (migration.migrationType === "alter") {
      return migrationParser.parseAlterTableMigration(migration);
    }

    if (migration.migrationType === "drop") {
      return migrationParser.parseDropColumnMigration(migration);
    }

    if (migration.migrationType === "rawQuery") {
      return migration.rawQuery;
    }

    throw new Error("Migration type not found");
  }
}
