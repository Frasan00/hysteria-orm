#!/usr/bin/env node

import path from "path";
import dotenv from "dotenv";
import { createPool } from "mysql2/promise";
import CliUtils from "./MysqlCliUtils";
import { MigrationTableType } from "../Templates/MigrationTableType";
import { Migration } from "../../Sql/Migrations/Migration";
import { MigrationController } from "../../Sql/Migrations/MigrationController";
import MigrationTemplates from "../Templates/MigrationTemplates";
import { log } from "../../Logger";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../../Sql/Templates/Query/TRANSACTION";

dotenv.config();

export async function migrationRollBackSql(): Promise<void> {
  const config = CliUtils.getMysqlConfig();
  const mysqlPool = createPool({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    waitForConnections: true,
  });

  const mysql = await mysqlPool.getConnection();

  try {
    const migrationTable: MigrationTableType[] =
      await CliUtils.getMigrationTable(mysql);
    const migrations: Migration[] = await CliUtils.getMigrations();

    // If there are no pending migrations, print a message and exit
    if (migrations.length === 0) {
      console.log("No migrations to rollback.");
      process.exit(0);
    }

    // Parses and rolls back the migrations
    const migrationController: MigrationController = new MigrationController(
      await mysqlPool.getConnection(),
      null,
    );

    log(BEGIN_TRANSACTION, true);
    await mysql.beginTransaction();

    await migrationController.downMigrations(migrations);

    log(COMMIT_TRANSACTION, true);
    await mysql.commit();
  } catch (error: any) {
    log(ROLLBACK_TRANSACTION, true);
    await mysql.rollback();

    console.error(error);
    process.exit(1);
  } finally {
    mysql.release();
  }
}
