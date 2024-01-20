#!/usr/bin/env node

import path from "path";
import dotenv from "dotenv";
import { createPool } from "mysql2/promise";
import MysqlCliUtils from "./MysqlCliUtils";
import { MigrationTableType } from "../Templates/MigrationTableType";
import { Migration } from "../../Sql/Migrations/Migration";
import { MigrationController } from "../../Sql/Migrations/MigrationController";
import MigrationTemplates from "../Templates/MigrationTemplates";

dotenv.config();

// Function to run pending migrations
export async function runMigrationsSql(): Promise<void> {
  const migrationFolderPath =
    process.env.MIGRATION_PATH || "database/migrations";
  const config = MysqlCliUtils.getMysqlConfig();
  const mysqlPool = createPool({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    waitForConnections: true,
  });

  const mysql = await mysqlPool.getConnection();

  const migrationTable: MigrationTableType[] =
    await MysqlCliUtils.getMigrationTable(mysql);
  const migrations: Migration[] = await MysqlCliUtils.getMigrations();
  const pendingMigrations = MysqlCliUtils.getPendingMigrations(
    migrations,
    migrationTable,
  );

  // Parses and runs the migrations
  const migrationManager: MigrationController = new MigrationController(
    mysqlPool,
    null,
  );

  // If there are no pending migrations, print a message and exit
  if (pendingMigrations.length === 0) {
    console.log("No pending migrations.");
    process.exit(0);
  }

  // Run each pending database
  for (const migration of pendingMigrations) {
    const migrationName = migration.migrationName;
    const migrationFilePath = path.join(migrationFolderPath, migrationName);
    try {
      await mysql.beginTransaction();
      console.log(`Running migration: ${migrationName} (${migrationFilePath})`);
      await migrationManager.runMigration(migration);

      // Update the migrations table in the database
      await mysql.query(MigrationTemplates.addMigrationTemplate(), [
        migrationName,
      ]);
      console.log(`Migration completed: ${migrationName}`);
    } catch (error: any) {
      await mysql.rollback();
      throw new Error(error);
    }
  }
  await mysql.commit();
  mysql.release();
  console.log("Migrations completed successfully.");
}
