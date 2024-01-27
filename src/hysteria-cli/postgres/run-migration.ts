#!/usr/bin/env node

import path from "path";
import dotenv from "dotenv";
import { Pool } from "pg";
import PostgresCliUtils from "./PostgresCliUtils";
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

export async function runMigrationsPg(): Promise<void> {
  const migrationFolderPath =
    process.env.MIGRATION_PATH || "database/migrations";
  const config = PostgresCliUtils.getPgConfig();
  const postgresPool = new Pool({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
  });

  const client = await postgresPool.connect().catch((error) => {
    console.error(error);
    process.exit(1);
  });

  try {

    const migrationTable: MigrationTableType[] =
        await PostgresCliUtils.getMigrationTable(client);
    const migrations: Migration[] = await PostgresCliUtils.getMigrations();
    const pendingMigrations = PostgresCliUtils.getPendingMigrations(
        migrations,
        migrationTable,
    );

    if (pendingMigrations.length === 0) {
      console.log("No pending migrations.");
      client.release();
      process.exit(0);
    }

    const migrationController = new MigrationController(null, client);

    log(BEGIN_TRANSACTION, true);
    await client.query(BEGIN_TRANSACTION);

    await migrationController.upMigrations(migrations);

    log(COMMIT_TRANSACTION, true);
    await client.query(COMMIT_TRANSACTION);
  } catch (error: any) {
    log(ROLLBACK_TRANSACTION, true);
    await client.query(ROLLBACK_TRANSACTION);

    console.error(error);
    process.exit(1);
  } finally {
    client.release();
  }
}
