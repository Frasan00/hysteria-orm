import dotenv from "dotenv";
import { migrationRollBackSql } from "./mysql/rollback-migration";
import { migrationRollBackPg } from "./postgres/rollback-migration";

dotenv.config();

export default async function rollbackMigrationConnector() {
  const databaseType = process.env.DB_TYPE;
  console.log("Rolling back migrations...");

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
    console.log("Migration rolled back successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
