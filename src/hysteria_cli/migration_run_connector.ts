#!/usr/bin/env ts-node

import dotenv from "dotenv";
import { runMigrationsPg } from "./postgres/run_migration";
import { runMigrationsSql } from "./mysql/run_migration";
import { runMigrationsSQLite } from "./sqlite/run_migration";
import logger from "../utils/logger";

dotenv.config();

export default async function runMigrationsConnector() {
  const databaseType = process.env.DB_TYPE;
  if (!databaseType) {
    throw new Error("Run migrations error: DB_TYPE env not set");
  }

  logger.info(`Running migrations for ${databaseType}`);
  switch (databaseType) {
    case "mariadb":
    case "mysql":
      await runMigrationsSql();
      break;
    case "postgres":
      await runMigrationsPg();
      break;
    case "sqlite":
      await runMigrationsSQLite();
      break;
    default:
      throw new Error(
        "Invalid database type, must be mysql, postgres or sqlite, got: " +
          databaseType,
      );
  }

  logger.info("Migrations ran successfully");
}

runMigrationsConnector()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  });
