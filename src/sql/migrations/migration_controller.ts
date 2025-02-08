import { SqlDataSource } from "../sql_data_source";
import { Migration } from "./migration";
import { log } from "../../utils/logger";
import { format } from "sql-formatter";
import {
  MysqlConnectionInstance,
  PgClientInstance,
  SqlConnectionType,
  SqlDataSourceType,
  SqliteConnectionInstance,
} from "../sql_data_source_types";
import { getSqlDialect } from "../..//sql/sql_runner/sql_runner";
import { logger } from "../..";

export class MigrationController {
  protected sqlDataSource: SqlDataSource;
  protected sqlConnection: SqlConnectionType;
  private sqlType: SqlDataSourceType;

  constructor(
    sqlDataSource: SqlDataSource,
    sqlConnection: SqlConnectionType,
    sqlType: SqlDataSourceType,
  ) {
    this.sqlConnection = sqlConnection;
    this.sqlType = sqlType;
    this.sqlDataSource = sqlDataSource;
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

        await this.localQuery(statement);
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

        await this.localQuery(statement);
      }

      await this.deleteMigrationFromMigrationTable(migration);
      if (migration.afterDown) {
        await migration.afterDown(this.sqlDataSource);
      }
    }
  }

  private async localQuery(text: string, params: any[] = []): Promise<void> {
    text = format(text, {
      language: getSqlDialect(this.sqlType),
    });

    if (this.sqlType === "mysql" || this.sqlType === "mariadb") {
      text = text.replace(/PLACEHOLDER/g, "?");
      log(text, true, params);
      await (this.sqlConnection as MysqlConnectionInstance).query(text, params);
      return;
    } else if (this.sqlType === "postgres") {
      let index = 1;
      text = text.replace(/PLACEHOLDER/g, () => `$${index++}`);
      log(text, true, params);
      await (this.sqlConnection as PgClientInstance).query(text, params);
      return;
    } else if (this.sqlType === "sqlite") {
      text = text.replace(/PLACEHOLDER/g, "?");
      log(text, true, params);
      await new Promise<void>((resolve, reject) => {
        (this.sqlConnection as SqliteConnectionInstance).run(
          text,
          params,
          (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          },
        );
      });
      return;
    }

    throw new Error("No database connection found while running migration");
  }

  async addMigrationToMigrationTable(migration: Migration) {
    const completeUtcTimestamp = new Date();
    const timestamp = completeUtcTimestamp
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "");

    const insertMigrationSql = `INSERT INTO migrations (name, timestamp) VALUES (PLACEHOLDER, PLACEHOLDER)`;

    await this.localQuery(insertMigrationSql, [
      migration.migrationName,
      timestamp,
    ]);
  }

  async deleteMigrationFromMigrationTable(migration: Migration) {
    const deleteMigrationSql = `DELETE FROM migrations WHERE name = PLACEHOLDER`;

    await this.localQuery(deleteMigrationSql, [migration.migrationName]);
  }

  async removeMigrationTable() {
    const dropMigrationTableSql = `
      DROP TABLE IF EXISTS migrations
    `;

    log(dropMigrationTableSql, true);
    await this.localQuery(dropMigrationTableSql);
  }
}
