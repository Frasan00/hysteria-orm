#!/usr/bin/env node

import dotenv from "dotenv";
import { MigrationTableType } from "../resources/migration_table_type";
import { Migration } from "../../sql/migrations/migration";
import { MigrationController } from "../../sql/migrations/migration_controller";
import logger from "../../utils/logger";
import { SqlDataSource } from "../../sql/sql_data_source";
import { getMigrations, getMigrationTable } from "../migration_utils";
import { SqliteConnectionInstance } from "../../sql/sql_data_source_types";

dotenv.config();

export async function runMigrationsSQLite(runUntil?: string, tsconfigPath?: string): Promise<void> {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection() as SqliteConnectionInstance;

  try {
    const migrationTable: MigrationTableType[] =
      (await getMigrationTable(sqlConnection)) || [];
    const migrations: Migration[] = await getMigrations(tsconfigPath);
    const pendingMigrations = migrations.filter(
      (migration) =>
        !migrationTable
          .map((table) => table.name)
          .includes(migration.migrationName),
    );

    if (pendingMigrations.length === 0) {
      logger.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }

    if (runUntil) {
      const runUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === runUntil,
      );

      if (runUntilIndex === -1) {
        throw new Error(`Migration ${runUntil} not found.`);
      }

      const filteredMigrations = pendingMigrations.slice(0, runUntilIndex + 1);
      const migrationController = new MigrationController(
        sql,
        sqlConnection,
        "sqlite",
      );

      await migrationController.upMigrations(filteredMigrations);
    }

    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "sqlite",
    );

    await migrationController.upMigrations(pendingMigrations);
  } finally {
    await sql.closeConnection();
  }
}
