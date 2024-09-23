#!/usr/bin/env ts-node

import dotenv from "dotenv";
import { migrationRollBackSql } from "./mysql/rollback-migration";
import { migrationRollBackPg } from "./postgres/rollback-migration";
import logger from "../Logger";
import { migrationRollBackSqlite } from "./SQLite/rollback-migration";

dotenv.config();

export default async function rollbackMigrationConnector() {
  const databaseType = process.env.DB_TYPE;
  logger.info("Rolling back migrations...");

  switch (databaseType) {
    case "mariadb":
    case "mysql":
      await migrationRollBackSql();
      break;
    case "postgres":
      await migrationRollBackPg();
      break;
    case "sqlite":
      await migrationRollBackSqlite();
      break;
    default:
      throw new Error(
        "Invalid database type, must be mysql or mysql, postgres, mariadb, sqlite, got: " +
          databaseType,
      );
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
