import dotenv from "dotenv";
import { migrationRollBackSql } from "./mysql/rollback-migration";
import { migrationRollBackPg } from "./postgres/rollback-migration";

dotenv.config();

export default async function rollbackMigrationConnector() {
  const databaseType = process.env.DB_TYPE;

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
