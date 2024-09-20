#!/usr/bin/env ts-node

import dotenv from "dotenv";
import { runMigrationsPg } from "./postgres/run-migration";
import { runMigrationsSql } from "./mysql/run-migration";
import logger from "../Logger";

dotenv.config();

export default async function runMigrationsConnector() {
  const databaseType = process.env.DB_TYPE;
  switch (databaseType) {
    case "mariadb":
    case "mysql":
      await runMigrationsSql();
      break;
    case "postgres":
      await runMigrationsPg();
      break;

    default:
      throw new Error("Invalid database type, must be mysql or postgres");
  }
}

runMigrationsConnector()
  .then(() => {
    logger.info("Migrations ran successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  });
