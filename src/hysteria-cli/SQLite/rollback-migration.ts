#!/usr/bin/env node

import dotenv from "dotenv";
import { Pool } from "pg";
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
import SQLIteMIgrationUtils from "./SQLIteMIgrationUtils";
import sqlite3 from "sqlite3";

dotenv.config();

export async function migrationRollBackSqlite(): Promise<void> {
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
    const migrationTable: MigrationTableType[] =
      (await SQLIteMIgrationUtils.getMigrationTable(sqliteConnection)) || [];
    const migrations: Migration[] = await SQLIteMIgrationUtils.getMigrations();

    const tableMigrations = migrationTable.map((migration) => migration.name);
    const pendingMigrations = migrations.filter((migration) =>
      tableMigrations.includes(migration.migrationName),
    );

    if (pendingMigrations.length === 0) {
      logger.info("No pending migrations.");
      sqliteConnection.close();
      process.exit(0);
    }

    const migrationController = new MigrationController(
      sqliteConnection as any,
      "sqlite",
    );

    log(BEGIN_TRANSACTION, true);
    await SQLIteMIgrationUtils.promisifyQuery(
      BEGIN_TRANSACTION,
      [],
      sqliteConnection,
    );
    await migrationController.downMigrations(pendingMigrations);

    log(COMMIT_TRANSACTION, true);
    await SQLIteMIgrationUtils.promisifyQuery(
      COMMIT_TRANSACTION,
      [],
      sqliteConnection,
    );
  } catch (error: any) {
    console.error(error);
    log(ROLLBACK_TRANSACTION, true);
    await SQLIteMIgrationUtils.promisifyQuery(
      ROLLBACK_TRANSACTION,
      [],
      sqliteConnection,
    ).catch();

    throw error;
  } finally {
    sqliteConnection.close();
  }
}
