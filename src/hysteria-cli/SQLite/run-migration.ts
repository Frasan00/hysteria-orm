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

dotenv.config();

export async function runMigrationsSQLite(): Promise<void> {
  const config = SQLIteMIgrationUtils.getSQLiteConfig();
  const sqliteConnection = new sqlite3.Database(
    config.database as string,
    (error) => {
      if (error) {
        logger.error(error);
        throw error;
      }
    },
  );

  try {
    log(BEGIN_TRANSACTION, true);
    await SQLIteMIgrationUtils.promisifyQuery(
      BEGIN_TRANSACTION,
      [],
      sqliteConnection,
    );

    const migrationTable: MigrationTableType[] =
      (await SQLIteMIgrationUtils.getMigrationTable(sqliteConnection)) || [];
    console.log(migrationTable);
    const migrations: Migration[] = await SQLIteMIgrationUtils.getMigrations();
    const pendingMigrations = migrations.filter(
      (migration) =>
        !migrationTable
          .map((table) => table.name)
          .includes(migration.migrationName),
    );

    if (pendingMigrations.length === 0) {
      logger.info("No pending migrations.");
      sqliteConnection.close();
      process.exit(0);
    }

    const migrationController = new MigrationController(
      null,
      null,
      sqliteConnection,
    );
    await migrationController.upMigrations(pendingMigrations);

    log(COMMIT_TRANSACTION, true);
    await SQLIteMIgrationUtils.promisifyQuery(
      COMMIT_TRANSACTION,
      [],
      sqliteConnection,
    );
  } catch (error: any) {
    log(ROLLBACK_TRANSACTION, true);
    await SQLIteMIgrationUtils.promisifyQuery(
      ROLLBACK_TRANSACTION,
      [],
      sqliteConnection,
    );

    throw error;
  } finally {
    sqliteConnection.close();
  }
}
