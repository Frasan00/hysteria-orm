import dotenv from "dotenv";
import { runMigrationsPg } from "./postgres/run-migration";
import { runMigrationsSql } from "./mysql/run-migration";

dotenv.config();

export async function dispatch() {
  const databaseType = process.env.DATABASE_TYPE;

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
}

dispatch()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
