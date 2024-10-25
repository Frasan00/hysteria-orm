#!/usr/bin/env ts-node

import dotenv from "dotenv";
import { migrationRollBackSql } from "./mysql/rollback_migration";
import { migrationRollBackPg } from "./postgres/rollback_migration";
import logger from "../utils/logger";
import { migrationRollBackSqlite } from "./sqlite/rollback_migration";

dotenv.config();

export default async function rollbackMigrationConnector(
  rollBackUntil?: string,
) {
  const databaseType = process.env.DB_TYPE;
  logger.info("Rolling back migrations for database type: " + databaseType);

  switch (databaseType) {
    case "mariadb":
    case "mysql":
      await migrationRollBackSql(rollBackUntil);
      break;
    case "postgres":
      await migrationRollBackPg(rollBackUntil);
      break;
    case "sqlite":
      await migrationRollBackSqlite(rollBackUntil);
      break;
    default:
      throw new Error(
        "Invalid database type, must be mysql or mysql, postgres, mariadb, sqlite, got: " +
          databaseType,
      );
  }
}

let arg: string | undefined = process.argv[2];
if (arg === "undefined") {
  arg = undefined;
}
if (arg && !arg.endsWith(".ts")) {
  arg += ".ts";
}

rollbackMigrationConnector(arg)
  .then(() => {
    logger.info("migrations rolled back successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  });
