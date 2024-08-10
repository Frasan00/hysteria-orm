import { PoolConnection } from "mysql2/promise";
import { PoolClient } from "pg";
import { log } from "../../Logger";
import { Migration } from "./Migration";
import { SqlDataSource } from "../SqlDatasource";

export class MigrationController {
  protected mysqlPool: PoolConnection | null;
  protected pgPool: PoolClient | null;

  constructor(mysqlPool: PoolConnection | null, pgPool: PoolClient | null) {
    this.mysqlPool = mysqlPool;
    this.pgPool = pgPool;
  }

  public async upMigrations(migrations: Migration[]): Promise<void> {
    try {
      const migrationPromises = migrations.map(async (migration) => {
        await migration.up();
        const statements = migration.schema.queryStatements;
        const statementPromises = statements.map(async (statement) => {
          if (
            !statement ||
            statement === "" ||
            statement === ";" ||
            statement === ","
          ) {
            return;
          }

          await this.localQuery(statement);
        });

        await Promise.all(statementPromises);
        await this.addMigrationToMigrationTable(migration);

        if (migration.afterUp) {
          const sql = await SqlDataSource.connect();
          await migration.afterUp();
          await sql.closeConnection();
        }
      });

      await Promise.all(migrationPromises);
    } catch (error: any) {
      throw new Error(error);
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
          const sql = await SqlDataSource.connect();
          await migration.afterDown();
          await sql.closeConnection();
        }
      }
    } catch (error: any) {
      throw new Error(error);
    }
  }

  private async localQuery(text: string, params: any[] = []): Promise<void> {
    if (this.mysqlPool) {
      text = text.replace(/PLACEHOLDER/g, "?");
      log(text, true, params);
      await this.mysqlPool.query(text, params);
      return;
    } else if (this.pgPool) {
      let index = 1;
      text = text.replace(/PLACEHOLDER/g, () => `$${index++}`);
      log(text, true, params);
      await this.pgPool.query(text, params);
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

    const insertMigrationSql = `INSERT INTO migrations (id, name, timestamp) VALUES (DEFAULT, PLACEHOLDER, PLACEHOLDER)`;

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
