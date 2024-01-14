#!/usr/bin/env node

import path from "path";
import CliUtils from "./CliUtils";
import { MigrationTableType } from "./Templates/MigrationTableType";
import { Migration } from "../Mysql/Migrations/Migration";
import dotenv from "dotenv";
import { MigrationController } from "../Mysql/Migrations/MigrationController";
import { createPool } from "mysql2/promise";
import MigrationTemplates from "./Templates/MigrationTemplates";

dotenv.config();

// Function to rollback migrations
export async function migrationRollBack(): Promise<void> {
  const migrationFolderPath =
    process.env.MIGRATION_PATH || "database/migrations";
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

  const migrationTable: MigrationTableType[] =
    await CliUtils.getMigrationTable(mysql);
  const migrations: Migration[] = await CliUtils.getMigrations();

  // Parses and rolls back the migrations
  const migrationManager: MigrationController = new MigrationController(
    mysqlPool,
  );

  // If there are no pending migrations, print a message and exit
  if (migrations.length === 0) {
    console.log("No migrations to rollback.");
    process.exit(0);
  }

  // Run each pending database
  for (const migration of migrations) {
    const migrationName = migration.migrationName;
    const migrationFilePath = path.join(migrationFolderPath, migrationName);
    try {
      await mysql.beginTransaction();
      console.log(
        `Rolling back migration: ${migrationName} (${migrationFilePath})`,
      );
      await migrationManager.rollbackMigration(migration);

      // Update the migrations table in the database
      await mysql.query(MigrationTemplates.removeMigrationTemplate(), [
        migrationName,
      ]);
      await mysql.commit();
    } catch (error) {
      await mysql.rollback();
      throw error;
    }
  }
}

migrationRollBack()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
