#!/usr/bin/env node

import dotenv from "dotenv";
import * as mysql2 from "mysql2/promise";
import { MigrationTableType } from "../resources/MigrationTableType";
import MysqlCliUtils from "./MysqlCliUtils";
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

dotenv.config();

export async function runMigrationsSql(): Promise<void> {
  const sql = await SqlDataSource.connect();
  const sqlConnection = sql.getCurrentConnection() as mysql2.Connection;
  try {
    log(BEGIN_TRANSACTION, true);
    await sqlConnection.beginTransaction();
    const migrationTable: MigrationTableType[] =
      await MysqlCliUtils.getMigrationTable(sqlConnection as mysql2.Connection);
    const migrations: Migration[] = await MysqlCliUtils.getMigrations();
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
      sqlConnection as mysql2.Connection,
      "mysql",
    );
    await migrationController.upMigrations(pendingMigrations);

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
