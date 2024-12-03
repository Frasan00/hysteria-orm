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
import { getMigrations, getMigrationTable } from "../migration_utils";
import { MysqlConnectionInstance } from "../../sql/sql_data_source_types";

dotenv.config();

export async function migrationRollBackSql(
  rollBackUntil?: string,
): Promise<void> {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection() as MysqlConnectionInstance;

  try {
    log(BEGIN_TRANSACTION, true);
    await sqlConnection.beginTransaction();
    const migrationTable: MigrationTableType[] =
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

    if (rollBackUntil) {
      const rollBackUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === rollBackUntil,
      );

      if (rollBackUntilIndex === -1) {
        throw new Error(`Migration ${rollBackUntil} not found.`);
      }

      const filteredMigrations = pendingMigrations.slice(rollBackUntilIndex);
      const migrationController: MigrationController = new MigrationController(
        sql,
        sqlConnection,
        "mysql",
      );

      await migrationController.downMigrations(filteredMigrations);
      log(COMMIT_TRANSACTION, true);
      await sqlConnection.commit();
      return;
    }

    const migrationController: MigrationController = new MigrationController(
      sql,
      sqlConnection,
      "mysql",
    );

    await migrationController.downMigrations(pendingMigrations);

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
