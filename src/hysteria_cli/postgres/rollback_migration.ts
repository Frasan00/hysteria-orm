#!/usr/bin/env node

import dotenv from "dotenv";
import { Client } from "pg";
import { log } from "console";
import { Migration_table_type } from "../resources/migration_table_type";
import { Migration } from "../../sql/migrations/migration";
import { Migration_controller } from "../../sql/migrations/migration_controller";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../../sql/resources/query/TRANSACTION";
import logger from "../../logger";
import { SqlDataSource } from "../../sql/sql_data_source";
import { getMigrationTable, getMigrations } from "../migration_utils";

dotenv.config();

export async function migrationRollBackPg(): Promise<void> {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection() as Client;
  try {
    const migrationTable: Migration_table_type[] =
      await getMigrationTable(sqlConnection);
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

    const migrationController = new Migration_controller(
      sql,
      sqlConnection,
      "postgres",
    );

    log(BEGIN_TRANSACTION, true);
    await sqlConnection.query(BEGIN_TRANSACTION);
    await migrationController.downMigrations(pendingMigrations);

    log(COMMIT_TRANSACTION, true);
    await sqlConnection.query(COMMIT_TRANSACTION);
  } catch (error: any) {
    log(ROLLBACK_TRANSACTION, true);
    await sqlConnection.query(ROLLBACK_TRANSACTION);

    console.error(error);
    throw error;
  } finally {
    await sql.closeConnection();
  }
}
