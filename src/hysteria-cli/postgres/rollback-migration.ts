#!/usr/bin/env node

import dotenv from "dotenv";
import { Client } from "pg";
import PostgresCliUtils from "./PostgresCliUtils";
import { log } from "console";
import { MigrationTableType } from "../resources/MigrationTableType";
import { Migration } from "../../Sql/Migrations/Migration";
import { MigrationController } from "../../Sql/Migrations/MigrationController";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../../Sql/Resources/Query/TRANSACTION";
import logger from "../../Logger";
import { SqlDataSource } from "../../Sql/SqlDatasource";

dotenv.config();

export async function migrationRollBackPg(): Promise<void> {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection() as Client;
  try {
    const migrationTable: MigrationTableType[] =
      await PostgresCliUtils.getMigrationTable(sqlConnection);
    const migrations: Migration[] = await PostgresCliUtils.getMigrations();

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
