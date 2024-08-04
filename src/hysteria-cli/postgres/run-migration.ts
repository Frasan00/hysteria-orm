#!/usr/bin/env node

import path from "path";
import dotenv from "dotenv";
import { Pool } from "pg";
import PostgresCliUtils from "./PostgresCliUtils";
import { MigrationTableType } from "../resources/MigrationTableType";
import { log } from "console";
import { Migration } from "../../Sql/Migrations/Migration";
import { MigrationController } from "../../Sql/Migrations/MigrationController";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../../Sql/Resources/Query/TRANSACTION";

dotenv.config();

export async function runMigrationsPg(): Promise<void> {
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
    log(BEGIN_TRANSACTION, true);
    await client.query(BEGIN_TRANSACTION);

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
