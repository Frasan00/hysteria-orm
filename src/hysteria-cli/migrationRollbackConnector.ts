import dotenv from "dotenv";
import { migrationRollBackSql } from "./mysql/rollback-migration";
import { migrationRollBackPg } from "./postgres/rollback-migration";

dotenv.config();

export async function dispatch() {
  const databaseType = process.env.DATABASE_TYPE;

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

dispatch()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
