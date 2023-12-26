import { Pool } from "mysql2/promise";
import { Migration } from "./Migration";
import logger from "../../Logger";
import { log } from "../../Logger";
import migrationParser from "./MigrationParser";

export class MigrationController {
  protected mysqlConnection: Pool;
  protected logs: boolean;

  constructor(mysqlConnection: Pool) {
    this.mysqlConnection = mysqlConnection;
    this.logs = true;
  }

  public async runMigration(migration: Migration): Promise<void> {
    try {
      await this.upMigration(migration);
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

  private async upMigration(migration: Migration): Promise<void> {
    logger.info("Running database: " + migration.tableName);
    migration.up();
    const statement = this.parseMigration(migration);
    if (migration.migrationType === "alter") {
      const statements = statement.split(";");
      for (const statement of statements) {
        log(statement, this.logs);
        await this.mysqlConnection.query(statement);
      }
    }

    log(statement, this.logs);
    await this.mysqlConnection.query(statement);
    logger.info("Migration complete: " + migration.tableName);
  }

  private async downMigration(migration: Migration): Promise<void> {
    logger.info("Rolling back database: " + migration.tableName);
    migration.down();
    const statement = this.parseMigration(migration);
    if (migration.migrationType === "alter") {
      const statements = statement.split(";");
      for (const statement of statements) {
        log(statement, this.logs);
        await this.mysqlConnection.query(statement);
      }
    }

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
