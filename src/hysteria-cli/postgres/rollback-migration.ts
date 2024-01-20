#!/usr/bin/env node

import path from "path";
import dotenv from "dotenv";
import { Pool } from "pg";
import CliUtils from "./PostgresCliUtils";
import { MigrationTableType } from "../Templates/MigrationTableType";
import { Migration } from "../../Sql/Migrations/Migration";
import { MigrationController } from "../../Sql/Migrations/MigrationController";
import MigrationTemplates from "../Templates/MigrationTemplates";
import PostgresCliUtils from "./PostgresCliUtils";

dotenv.config();

// Function to rollback migrations
export async function migrationRollBackPg(): Promise<void> {
  const migrationFolderPath =
    process.env.MIGRATION_PATH || "database/migrations";
  const config = PostgresCliUtils.getPgConfig();
  const pgPool = new Pool({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
  });

  const client = await pgPool.connect();

  const migrationTable: MigrationTableType[] =
    await PostgresCliUtils.getMigrationTable(client);
  const migrations: Migration[] = await CliUtils.getMigrations();

  // Parses and rolls back the migrations
  const migrationManager: MigrationController = new MigrationController(
    null,
    pgPool,
  );

  if (migrations.length === 0) {
    console.log("No migrations to rollback.");
    process.exit(0);
  }

  // Run each pending database
  for (const migration of migrations) {
    const migrationName = migration.migrationName;
    const migrationFilePath = path.join(migrationFolderPath, migrationName);
    try {
      await client.query("BEGIN");
      console.log(
        `Rolling back migration: ${migrationName} (${migrationFilePath})`,
      );
      await migrationManager.rollbackMigration(migration);

      await client.query(MigrationTemplates.removeMigrationTemplate(), [
        migrationName,
      ]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  client.release();
}
