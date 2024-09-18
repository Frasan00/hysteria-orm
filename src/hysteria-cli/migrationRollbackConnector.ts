#!/usr/bin/env ts-node

import dotenv from "dotenv";
import { migrationRollBackSql } from "./mysql/rollback-migration";
import { migrationRollBackPg } from "./postgres/rollback-migration";
import logger from "../Logger";

dotenv.config();

export default async function rollbackMigrationConnector() {
  const databaseType = process.env.DB_TYPE;
  logger.info("Rolling back migrations...");

  switch (databaseType) {
    case "mysql":
      await migrationRollBackSql();
      break;
    case "postgres":
      await migrationRollBackPg();
      break;

    default:
      throw new Error("Invalid database type, must be mysql or postgres");
  }
}

rollbackMigrationConnector()
  .then(() => {
    logger.info("Migration rolled back successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  });
