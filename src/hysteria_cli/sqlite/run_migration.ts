#!/usr/bin/env node

import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { Migration_table_type } from "../resources/migration_table_type";
import { log } from "console";
import { Migration } from "../../sql/migrations/migration";
import { Migration_controller } from "../../sql/migrations/migration_controller";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../../sql/resources/query/TRANSACTION";
import logger from "../../logger";
import { Sql_data_source } from "../../sql/sql_data_source";
import { getMigrations, getMigrationTable } from "../migration_utils";

dotenv.config();

export async function runMigrationsSQLite(): Promise<void> {
  const sql = await Sql_data_source.connect();
  const sqlConnection = sql.getCurrentConnection() as sqlite3.Database;

  try {
    log(BEGIN_TRANSACTION, true);
    sqlConnection.exec(BEGIN_TRANSACTION);

    const migrationTable: Migration_table_type[] =
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

    const migrationController = new Migration_controller(
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
