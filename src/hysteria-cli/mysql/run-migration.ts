#!/usr/bin/env node

import dotenv from "dotenv";
import { createPool } from "mysql2/promise";
import MysqlCliUtils from "./MysqlCliUtils";
import { MigrationTableType } from "../Templates/MigrationTableType";
import { Migration } from "../../Sql/Migrations/Migration";
import { MigrationController } from "../../Sql/Migrations/MigrationController";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../../Sql/Templates/Query/TRANSACTION";
import { log } from "../../Logger";

dotenv.config();

export async function runMigrationsSql(): Promise<void> {
  const config = MysqlCliUtils.getMysqlConfig();
  const mysqlPool = createPool({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
  });

  const mysql = await mysqlPool.getConnection();
  try {
    const migrationTable: MigrationTableType[] =
      await MysqlCliUtils.getMigrationTable(mysql);
    const migrations: Migration[] = await MysqlCliUtils.getMigrations();
    const pendingMigrations = MysqlCliUtils.getPendingMigrations(
      migrations,
      migrationTable,
    );

    // If there are no pending migrations, print a message and exit
    if (pendingMigrations.length === 0) {
      console.log("No pending migrations.");
      process.exit(0);
    }

    const migrationController = new MigrationController(mysql, null);

    log(BEGIN_TRANSACTION, true);
    await mysql.beginTransaction();

    await migrationController.upMigrations(migrations);

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
