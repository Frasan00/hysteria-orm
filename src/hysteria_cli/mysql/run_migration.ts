#!/usr/bin/env node

import dotenv from "dotenv";
import * as mysql2 from "mysql2/promise";
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

export async function runMigrationsSql(runUntil?: string): Promise<void> {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection() as mysql2.Connection;
  try {
    log(BEGIN_TRANSACTION, true);
    await sqlConnection.beginTransaction();
    const migrationTable: MigrationTableType[] = await getMigrationTable(
      sqlConnection as mysql2.Connection,
    );
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
        sqlConnection as mysql2.Connection,
        "mysql",
      );
      await migrationController.upMigrations(filteredMigrations);
      log(COMMIT_TRANSACTION, true);
      await sqlConnection.commit();
      return;
    }

    const migrationController = new MigrationController(
      sql,
      sqlConnection as mysql2.Connection,
      "mysql",
    );

    await migrationController.upMigrations(pendingMigrations);

    log(COMMIT_TRANSACTION, true);
    await sqlConnection.commit();
  } catch (error: any) {
    log(ROLLBACK_TRANSACTION, true);
    await sqlConnection.rollback();
    throw error;
  } finally {
    await sql.closeConnection();
  }
}
