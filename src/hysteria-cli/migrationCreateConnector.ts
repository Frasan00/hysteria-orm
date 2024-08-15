#!/usr/bin/env ts-node

import dotenv from "dotenv";
import { createMigrationSql } from "./mysql/create-migration";
import { createMigrationPg } from "./postgres/create-migration";

dotenv.config();

export default function migrationCreateConnector(name: string) {
  const databaseType = process.env.DB_TYPE;

  switch (databaseType) {
    case "mysql":
      createMigrationSql(name);
      break;
    case "postgres":
      createMigrationPg(name);
      break;

    default:
      throw new Error("Invalid database type, must be mysql or postgres");
  }
}

const arg = process.argv[2];
if (!arg) {
  throw new Error("Please provide a name for the migration");
}

migrationCreateConnector(arg);
