import { Pool as MySqlPool } from "mysql2/promise";
import { Pool as PgPool } from "pg";
import { Migration } from "./Migration";
import logger from "../../Logger";
import migrationParser from "./MigrationParser";

export class MigrationController {
  protected mysqlPool: MySqlPool | null;
  protected pgPool: PgPool | null;

  constructor(mysqlPool: MySqlPool | null, pgPool: PgPool | null) {
    this.mysqlPool = mysqlPool;
    this.pgPool = pgPool;
  }

  private async query(text: string, params: any[] = []): Promise<any> {
    if (this.mysqlPool) {
      return this.mysqlPool.query(text, params);
    } else if (this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        return await client.query(text, params);
      } finally {
        client.release();
      }
    } else {
      throw new Error("No database pool provided.");
    }
  }
  public async createMigrationsTable(): Promise<void> {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await this.query(createTableSql);
  }

  public async applyMigration(
    migrationName: string,
    migrationSql: string,
  ): Promise<void> {
    await this.query("BEGIN");
    try {
      await this.query(migrationSql);
      await this.query("INSERT INTO migrations (name) VALUES (?)", [
        migrationName,
      ]);
      await this.query("COMMIT");
    } catch (error) {
      await this.query("ROLLBACK");
      throw error;
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

  public async runMigration(migration: Migration): Promise<void> {
    try {
      await this.upMigration(migration);
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
      for (const stmt of statements) {
        if (stmt.trim()) {
          await this.query(stmt);
        }
      }
    } else {
      await this.query(statement);
    }
    logger.info("Migration complete: " + migration.tableName);
  }

  private async downMigration(migration: Migration): Promise<void> {
    logger.info("Rolling back database: " + migration.tableName);
    migration.down();
    const parsedStatements = this.parseMigration(migration);
    const statements = parsedStatements.split(
      migration.migrationType === "alter" ? ";" : "\n",
    );
    for (const statement of statements) {
      if (statement.trim()) {
        await this.query(statement);
      }
    }
    logger.info("Rollback complete: " + migration.tableName);
  }

  private parseMigration(migration: Migration): string {
    if (migration.migrationType === "create") {
      return migrationParser.parseCreateTableMigration(migration);
    }

    if (migration.migrationType === "alter") {
      return migrationParser.parseAlterTableMigration(migration);
    }

    if (migration.migrationType === "drop-force") {
      return migrationParser.parseDropColumnMigration(migration);
    }

    if (migration.migrationType === "rawQuery") {
      return migration.rawQuery;
    }

    throw new Error("Migration type not found");
  }
}
