import { PoolConnection } from "mysql2/promise";
import { PoolClient } from "pg";
import { log } from "../../Logger";
import { Migration } from "./Migration";

export class MigrationController {
  protected mysqlPool: PoolConnection | null;
  protected pgPool: PoolClient | null;

  constructor(mysqlPool: PoolConnection | null, pgPool: PoolClient | null) {
    this.mysqlPool = mysqlPool;
    this.pgPool = pgPool;
  }

  public async upMigrations(migrations: Migration[]): Promise<void> {
    try {
      for (const migration of migrations) {
        migration.up();
        const statements = migration.schema.queryStatements;
        for (const statement of statements) {
          if (!statement || statement === "" || statement === ";" || statement === ',') {
            continue;
          }

          log(statement, true);
          await this.localQuery(statement);
        }

        await this.addMigrationToMigrationTable(migration);
      }
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async downMigrations(migrations: Migration[]): Promise<void> {
    migrations = migrations.reverse();
    try {
      for (const migration of migrations) {
        migration.down();
        const statements = migration.schema.queryStatements;
        for (const statement of statements) {
          if (!statement || statement === "" || statement === ";" || statement === ',') {
            continue;
          }

          log(statement, true);
          await this.localQuery(statement);
        }

        await this.deleteMigrationFromMigrationTable(migration);
      }
    } catch (error: any) {
      throw new Error(error);
    }
  }

  private async localQuery(text: string, params: any[] = []): Promise<void> {
    if (this.mysqlPool) {
      await this.mysqlPool.query(text, params);
    } else if (this.pgPool) {
      await this.pgPool.query(text, params);
    }
  }

  public async addMigrationToMigrationTable(migration: Migration) {
    const completeUtcTimestamp = new Date();
    const timestamp = completeUtcTimestamp
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "");

    const insertMigrationSql = `
      INSERT INTO migrations (id, name, timestamp) VALUES (DEFAULT, ?, ?)
    `;

    await this.localQuery(insertMigrationSql, [
      migration.migrationName,
      timestamp,
    ]);
  }

  public async deleteMigrationFromMigrationTable(migration: Migration) {
    const deleteMigrationSql = `
      DELETE FROM migrations WHERE name = ?
    `;

    await this.localQuery(deleteMigrationSql, [migration.migrationName]);
  }
}
