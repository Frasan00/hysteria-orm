#!/usr/bin/env node

import dotenv from "dotenv";
import { log } from "console";
import { MigrationTableType } from "../resources/migration_table_type";
import { Migration } from "../../sql/migrations/migration";
import { MigrationController } from "../../sql/migrations/migration_controller";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../../sql/resources/query/TRANSACTION";
import logger from "../../logger";
import sqlite3 from "sqlite3";
import { SqlDataSource } from "../../sql/sql_data_source";
import {
  getMigrations,
  getMigrationTable,
  promisifySqliteQuery,
} from "../migration_utils";

dotenv.config();

export async function migrationRollBackSqlite(): Promise<void> {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection() as sqlite3.Database;

  try {
    const migrationTable: MigrationTableType[] =
      (await getMigrationTable(sqlConnection)) || [];
    const migrations: Migration[] = await getMigrations();

    const tableMigrations = migrationTable.map((migration) => migration.name);
    const pendingMigrations = migrations.filter((migration) =>
      tableMigrations.includes(migration.migrationName),
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

    log(BEGIN_TRANSACTION, true);
    await promisifySqliteQuery(BEGIN_TRANSACTION, [], sqlConnection);
    await migrationController.downMigrations(pendingMigrations);

    log(COMMIT_TRANSACTION, true);
    await promisifySqliteQuery(COMMIT_TRANSACTION, [], sqlConnection);
  } catch (error: any) {
    console.error(error);
    log(ROLLBACK_TRANSACTION, true);
    await promisifySqliteQuery(ROLLBACK_TRANSACTION, [], sqlConnection).catch();

    throw error;
  } finally {
    await sql.closeConnection();
  }
}
