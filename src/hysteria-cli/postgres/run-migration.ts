#!/usr/bin/env node

import path from "path";
import dotenv from "dotenv";
import { Pool } from "pg";
import PostgresCliUtils from "./PostgresCliUtils";
import { MigrationTableType } from "../Templates/MigrationTableType";
import { Migration } from "../../Sql/Migrations/Migration";
import { MigrationController } from "../../Sql/Migrations/MigrationController";
import MigrationTemplates from "../Templates/MigrationTemplates";

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

  const client = await postgresPool.connect();

  const migrationTable: MigrationTableType[] =
    await PostgresCliUtils.getMigrationTable(client);
  const migrations: Migration[] = await PostgresCliUtils.getMigrations();
  const pendingMigrations = PostgresCliUtils.getPendingMigrations(
    migrations,
    migrationTable,
  );

  const migrationManager: MigrationController = new MigrationController(
    null,
    postgresPool,
  );

  if (pendingMigrations.length === 0) {
    console.log("No pending migrations.");
    await client.release();
    process.exit(0);
  }

  for (const migration of pendingMigrations) {
    const migrationName = migration.migrationName;
    const migrationFilePath = path.join(migrationFolderPath, migrationName);
    try {
      await client.query("BEGIN");
      console.log(`Running migration: ${migrationName} (${migrationFilePath})`);
      await migrationManager.runMigration(migration);

      await client.query(MigrationTemplates.addMigrationTemplate(), [
        migrationName,
      ]);
      console.log(`Migration completed: ${migrationName}`);
    } catch (error: any) {
      await client.query("ROLLBACK");
      throw new Error(error);
    }
    await client.query("COMMIT");
  }

  client.release();
  console.log("Migrations completed successfully.");
}
