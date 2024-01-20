import dotenv from "dotenv";
import { createMigrationSql } from "./mysql/create-migration";
import { createMigrationPg } from "./postgres/create-migration";

dotenv.config();

export async function dispatch() {
  const databaseType = process.env.DATABASE_TYPE;

  switch (databaseType) {
    case "mysql":
      createMigrationSql(process.argv[2]);
      break;
    case "postgres":
      createMigrationPg(process.argv[2]);
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
