#!/usr/bin/env node

import dotenv from "dotenv";
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
import { getMigrationTable, getMigrations } from "../migration_utils";
import { PgClientInstance } from "../../sql/sql_data_source_types";

dotenv.config();

export async function migrationRollBackPg(
  rollBackUntil?: string,
  tsconfigPath?: string,
): Promise<void> {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection() as PgClientInstance;
  try {
    const migrationTable: MigrationTableType[] =
      await getMigrationTable(sqlConnection);
    const migrations: Migration[] = await getMigrations(tsconfigPath);

    const tableMigrations = migrationTable.map((migration) => migration.name);
    const pendingMigrations = migrations.filter((migration) =>
      tableMigrations.includes(migration.migrationName),
    );

    if (pendingMigrations.length === 0) {
      logger.info("No pending migrations.");
      await sql.closeConnection();
      process.exit(0);
    }

    if (rollBackUntil) {
      const rollBackUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === rollBackUntil,
      );

      if (rollBackUntilIndex === -1) {
        throw new Error(`Migration ${rollBackUntil} not found.`);
      }

      const filteredMigrations = pendingMigrations.slice(rollBackUntilIndex);
      const migrationController = new MigrationController(
        sql,
        sqlConnection,
        "postgres",
      );

      log(BEGIN_TRANSACTION, true);
      await sqlConnection.query(BEGIN_TRANSACTION);
      await migrationController.downMigrations(filteredMigrations);
      await sqlConnection.query(COMMIT_TRANSACTION);
      return;
    }

    const migrationController = new MigrationController(
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
    throw error;
  } finally {
    await sql.closeConnection();
  }
}
