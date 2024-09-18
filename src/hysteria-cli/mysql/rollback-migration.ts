#!/usr/bin/env node

import dotenv from "dotenv";
import { createPool } from "mysql2/promise";
import CliUtils from "./MysqlCliUtils";
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

  const mysql = await mysqlPool.getConnection().catch((error) => {
    console.error(error);
    process.exit(1);
  });

  try {
    log(BEGIN_TRANSACTION, true);
    await mysql.beginTransaction();
    const migrationTable: MigrationTableType[] =
      await CliUtils.getMigrationTable(mysql);
    const migrations: Migration[] = await CliUtils.getMigrations();
    const tableMigrations = migrationTable.map((migration) => migration.name);
    const pendingMigrations = migrations.filter((migration) =>
      tableMigrations.includes(migration.migrationName),
    );

    if (pendingMigrations.length === 0) {
      logger.info("No pending migrations.");
      mysql.release();
      process.exit(0);
    }

    const migrationController: MigrationController = new MigrationController(
      await mysqlPool.getConnection(),
      null,
    );

    await migrationController.downMigrations(pendingMigrations);

    log(COMMIT_TRANSACTION, true);
    await mysql.commit();
  } catch (error: any) {
    log(ROLLBACK_TRANSACTION, true);
    await mysql.rollback();

    console.error(error);
  } finally {
    mysql.release();
    process.exit(0);
  }
}
