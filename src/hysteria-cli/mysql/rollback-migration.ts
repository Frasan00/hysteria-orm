#!/usr/bin/env node

import dotenv from "dotenv";
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
import { SqlDataSource } from "../../Sql/SqlDatasource";
import * as mysql2 from "mysql2/promise";
import { getMigrations, getMigrationTable } from "../MigrationUtils";

dotenv.config();

export async function migrationRollBackSql(): Promise<void> {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection() as mysql2.Connection;

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

    console.error(error);
    throw error;
  } finally {
    await sql.closeConnection();
  }
}
