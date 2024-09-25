#!/usr/bin/env node

import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { MigrationTableType } from "../resources/MigrationTableType";
import { log } from "console";
import { Migration } from "../../Sql/Migrations/Migration";
import { MigrationController } from "../../Sql/Migrations/MigrationController";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../../Sql/Resources/Query/TRANSACTION";
import logger from "../../Logger";
import SQLIteMIgrationUtils from "./SQLIteMIgrationUtils";
import { SqlDataSource } from "../../Sql/SqlDatasource";

dotenv.config();

export async function runMigrationsSQLite(): Promise<void> {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection() as sqlite3.Database;

  try {
    log(BEGIN_TRANSACTION, true);
    sqlConnection.exec(BEGIN_TRANSACTION);

    const migrationTable: MigrationTableType[] =
      (await SQLIteMIgrationUtils.getMigrationTable(sqlConnection)) || [];
    const migrations: Migration[] = await SQLIteMIgrationUtils.getMigrations();
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
