import dotenv from "dotenv";
import { runMigrationsPg } from "./postgres/run-migration";
import { runMigrationsSql } from "./mysql/run-migration";

dotenv.config();

export default async function runMigrationsConnector() {
  const databaseType = process.env.DB_TYPE;

  try {
    switch (databaseType) {
      case "mysql":
        await runMigrationsSql();
        break;
      case "postgres":
        await runMigrationsPg();
        break;

      default:
        throw new Error("Invalid database type, must be mysql or postgres");
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
