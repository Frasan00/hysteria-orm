#!/usr/bin/env node

import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { MigrationTableType } from "../resources/migration_table_type";
import { Migration } from "../../sql/migrations/migration";
import { MigrationController } from "../../sql/migrations/migration_controller";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../../sql/resources/query/TRANSACTION";
import logger, { log } from "../../utils/logger";
import { SqlDataSource } from "../../sql/sql_data_source";
import { getMigrations, getMigrationTable } from "../migration_utils";

dotenv.config();

export async function runMigrationsSQLite(): Promise<void> {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection() as sqlite3.Database;

  try {
    log(BEGIN_TRANSACTION, true);
    sqlConnection.exec(BEGIN_TRANSACTION);

    const migrationTable: MigrationTableType[] =
      (await getMigrationTable(sqlConnection)) || [];
    const migrations: Migration[] = await getMigrations();
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

    const migrationController = new MigrationController(
      sql,
      sqlConnection,
      "sqlite",
    );
    await migrationController.upMigrations(pendingMigrations);

    log(COMMIT_TRANSACTION, true);
    sqlConnection.exec(COMMIT_TRANSACTION);
  } catch (error: any) {
    log(ROLLBACK_TRANSACTION, true);
    sqlConnection.exec(ROLLBACK_TRANSACTION);

    throw error;
  } finally {
    await sql.closeConnection();
  }
}
