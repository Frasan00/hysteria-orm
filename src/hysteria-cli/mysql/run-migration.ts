#!/usr/bin/env node

import dotenv from "dotenv";
import { createPool } from "mysql2/promise";
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
    log(BEGIN_TRANSACTION, true);
    await mysql.beginTransaction();
    const migrationTable: MigrationTableType[] =
      await MysqlCliUtils.getMigrationTable(mysql);
    const migrations: Migration[] = await MysqlCliUtils.getMigrations();
    const pendingMigrations = migrations.filter(
      (migration) =>
        !migrationTable
          .map((table) => table.name)
          .includes(migration.migrationName),
    );

    if (pendingMigrations.length === 0) {
      logger.info("No pending migrations.");
      mysql.release();
      process.exit(0);
    }

    const migrationController = new MigrationController(mysql, null);
    await migrationController.upMigrations(pendingMigrations);

    log(COMMIT_TRANSACTION, true);
    await mysql.commit();
  } catch (error: any) {
    log(ROLLBACK_TRANSACTION, true);
    await mysql.rollback();

    console.error(error);
    return;
  } finally {
    mysql.release();
  }
}
