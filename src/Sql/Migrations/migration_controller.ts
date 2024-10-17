import { Connection } from "mysql2/promise";
import { Client } from "pg";
import { log } from "../../logger";
import { Migration } from "./migration";
import { Sql_data_source } from "../sql_data_source";
import sqlite3 from "sqlite3";
import { SqlDataSourceType } from "../../datasource";

export class Migration_controller {
  protected sqlDataSource: Sql_data_source;
  protected sqlConnection: Connection | Client | sqlite3.Database;
  private sqlType: SqlDataSourceType;

  constructor(
    sqlDataSource: Sql_data_source,
    sqlConnection: Connection | Client | sqlite3.Database,
    sqlType: SqlDataSourceType,
  ) {
    this.sqlConnection = sqlConnection;
    this.sqlType = sqlType;
    this.sqlDataSource = sqlDataSource;
  }

  public async upMigrations(migrations: Migration[]): Promise<void> {
    try {
      for (const migration of migrations) {
        await migration.up();
        const statements = migration.schema.queryStatements;
        for (const statement of statements) {
          if (
            !statement ||
            statement === "" ||
            statement === ";" ||
            statement === ","
          ) {
            continue;
          }
          await this.localQuery(statement);
        }

        await this.addMigrationToMigrationTable(migration);
        if (migration.afterUp) {
          await migration.afterUp(this.sqlDataSource);
        }
      }
    } catch (error: any) {
      throw error;
    }
  }

  public async downMigrations(migrations: Migration[]): Promise<void> {
    migrations = migrations.reverse();
    try {
      for (const migration of migrations) {
        await migration.down();
        const statements = migration.schema.queryStatements;
        for (const statement of statements) {
          if (
            !statement ||
            statement === "" ||
            statement === ";" ||
            statement === ","
          ) {
            continue;
          }
          await this.localQuery(statement);
        }
        await this.deleteMigrationFromMigrationTable(migration);
        if (migration.afterDown) {
          await migration.afterDown(this.sqlDataSource);
        }
      }
    } catch (error: any) {
      throw new Error(error);
    }
  }

  private async localQuery(text: string, params: any[] = []): Promise<void> {
    if (this.sqlType === "mysql" || this.sqlType === "mariadb") {
      text = text.replace(/PLACEHOLDER/g, "?");
      log(text, true, params);
      await (this.sqlConnection as Connection).query(text, params);
      return;
    } else if (this.sqlType === "postgres") {
      let index = 1;
      text = text.replace(/PLACEHOLDER/g, () => `$${index++}`);
      log(text, true, params);
      await (this.sqlConnection as Client).query(text, params);
      return;
    } else if (this.sqlType === "sqlite") {
      text = text.replace(/PLACEHOLDER/g, "?");
      log(text, true, params);
      await new Promise<void>((resolve, reject) => {
        (this.sqlConnection as sqlite3.Database).run(text, params, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      return;
    }

    throw new Error("No database connection found while running migration");
  }

  public async addMigrationToMigrationTable(migration: Migration) {
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

  public async deleteMigrationFromMigrationTable(migration: Migration) {
    const deleteMigrationSql = `DELETE FROM migrations WHERE name = PLACEHOLDER`;

    await this.localQuery(deleteMigrationSql, [migration.migrationName]);
  }

  public async removeMigrationTable() {
    const dropMigrationTableSql = `
      DROP TABLE IF EXISTS migrations
    `;

    log(dropMigrationTableSql, true);
    await this.localQuery(dropMigrationTableSql);
  }
}
