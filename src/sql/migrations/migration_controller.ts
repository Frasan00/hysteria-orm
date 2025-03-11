import logger from "../../utils/logger";
import { SqlDataSource } from "../sql_data_source";
import { SqlConnectionType } from "../sql_data_source_types";
import { Migration } from "./migration";

export class MigrationController {
  protected sqlDataSource: SqlDataSource;
  protected sqlConnection: SqlConnectionType;

  constructor(sqlDataSource: SqlDataSource) {
    this.sqlDataSource = sqlDataSource;
    this.sqlConnection = this.sqlDataSource.getCurrentDriverConnection();
  }

  async upMigrations(migrations: Migration[]): Promise<void> {
    for (const migration of migrations) {
      await migration.up();
      const statements = migration.schema.queryStatements;
      for (const statement of statements) {
        if (!statement) {
          logger.warn(
            `Migration ${migration.migrationName} has an empty query statement`,
          );
          continue;
        }

        await this.sqlDataSource.rawQuery(statement);
      }

      await this.addMigrationToMigrationTable(migration);
      if (migration.afterUp) {
        await migration.afterUp(this.sqlDataSource);
      }
    }
  }

  async downMigrations(migrations: Migration[]): Promise<void> {
    migrations = migrations.reverse();
    for (const migration of migrations) {
      await migration.down();
      const statements = migration.schema.queryStatements;
      for (const statement of statements) {
        if (!statement) {
          logger.warn(
            `Migration ${migration.migrationName} has an empty query statement`,
          );
          continue;
        }

        await this.sqlDataSource.rawQuery(statement);
      }

      await this.deleteMigrationFromMigrationTable(migration);
      if (migration.afterDown) {
        await migration.afterDown(this.sqlDataSource);
      }
    }
  }

  private async addMigrationToMigrationTable(migration: Migration) {
    const completeUtcTimestamp = new Date();
    const timestamp = completeUtcTimestamp
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "");

    let insertMigrationSql = `INSERT INTO migrations (name, timestamp) VALUES ('${migration.migrationName}', '${timestamp}')`;
    await this.sqlDataSource.rawQuery(insertMigrationSql);
  }

  private async deleteMigrationFromMigrationTable(migration: Migration) {
    const deleteMigrationSql = `DELETE FROM migrations WHERE name = '${migration.migrationName}'`;
    await this.sqlDataSource.rawQuery(deleteMigrationSql);
  }
}
