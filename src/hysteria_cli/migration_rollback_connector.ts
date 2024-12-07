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
