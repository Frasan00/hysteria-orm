import fs from "fs";
import path from "path";
import { Migration } from "../sql/migrations/migration";
import dotenv from "dotenv";
import { MigrationTableType } from "./resources/migration_table_type";
import { SqlConnectionType } from "../sql/sql_data_source";
import mysql from "mysql2/promise";
import pg from "pg";
import sqlite3 from "sqlite3";
import MigrationTemplates from "./resources/migration_templates";
import { log } from "../logger";

dotenv.config();

export async function getMigrationTable(
  sqlConnection: SqlConnectionType,
): Promise<MigrationTableType[] > {
  switch (process.env.DB_TYPE) {
    case "mariadb":
    case "mysql":
      const mysqlConnection = sqlConnection as mysql.Connection;
      log(MigrationTemplates.migrationTableTemplateMysql(), true);
      await mysqlConnection.query(
        MigrationTemplates.migrationTableTemplateMysql(),
      );
      log(MigrationTemplates.selectAllFromMigrationsTemplate(), true);
      const result = await mysqlConnection.query(
        MigrationTemplates.selectAllFromMigrationsTemplate(),
      );
      return result[0] as MigrationTableType[] ;

    case "postgres":
      const pgConnection = sqlConnection as pg.Client;
      log(MigrationTemplates.migrationTableTemplatePg(), true);
      await pgConnection.query(MigrationTemplates.migrationTableTemplatePg());
      log(MigrationTemplates.selectAllFromMigrationsTemplate(), true);
      const pgResult = await pgConnection.query(
        MigrationTemplates.selectAllFromMigrationsTemplate(),
      );
      return pgResult.rows as MigrationTableType[] ;

    case "sqlite":
      log(MigrationTemplates.migrationTableTemplateSQLite(), true);
      await promisifySqliteQuery(
        MigrationTemplates.migrationTableTemplateSQLite(),
        [],
        sqlConnection as sqlite3.Database,
      );
      log(MigrationTemplates.migrationTableTemplateSQLite(), true);
      const resultSqlite =
        (await promisifySqliteQuery<MigrationTableType[] >(
          MigrationTemplates.selectAllFromMigrationsTemplate(),
          [],
          sqlConnection as sqlite3.Database,
        )) || [];
      return Array.isArray(resultSqlite) ? resultSqlite : [resultSqlite];

    default:
      throw new Error("Unsupported database type");
  }
}

export async function getMigrations(): Promise<Migration[]> {
  const migrationNames = findMigrationNames();
  const migrations: Migration[] = [];

  for (const migrationName of migrationNames) {
    const migrationModule = await findMigrationModule(migrationName);
    const migration: Migration = new migrationModule();
    migration.migrationName = migrationName;
    migrations.push(migration);
  }

  return migrations;
}

export function getPendingMigrations(
  migrations: Migration[],
  migrationTable: MigrationTableType[] ,
): Migration[] {
  return migrations.filter((migration) => {
    const migrationName = migration.migrationName;
    const migrationEntry = migrationTable.find(
      (migration) => migration.name === migrationName,
    );
    return !migrationEntry;
  });
}

async function getAbsolutePath(migrationModulePath: string): Promise<string> {
  const userCurrentDirectory = process.cwd();
  return path.resolve(
    userCurrentDirectory,
    migrationModulePath.replace(/\.ts$/, ""),
  );
}

async function loadMigrationModule(
  absolutePath: string,
): Promise<(new () => Migration) | null> {
  try {
    const migrationModule = await import(absolutePath);
    if (migrationModule.default) {
      return migrationModule.default;
    }
  } catch (_error) {}

  return null;
}

async function findMigrationModule(
  migrationName: string,
  migrationModulePath: string = process.env.MIGRATION_PATH
    ? process.env.MIGRATION_PATH + "/" + migrationName
    : "database/migrations/" + migrationName,
): Promise<new () => Migration> {
  const absolutePath = await getAbsolutePath(migrationModulePath);
  const migrationModule = await loadMigrationModule(absolutePath);

  if (migrationModule) {
    return migrationModule;
  }

  const parentPath = path.resolve(path.dirname(absolutePath), "..");
  if (parentPath === path.dirname(absolutePath)) {
    throw new Error(
      "migrations module not found for migration: " + migrationName,
    );
  }

  return findMigrationModule(
    migrationName,
    path.join(parentPath, path.basename(migrationModulePath)),
  );
}

function findMigrationNames(): string[] {
  const currentUserDirectory = process.cwd();
  const migrationPath = path.resolve(
    process.env.MIGRATION_PATH || "database/migrations",
  );

  const fullPathToMigrationPath = path.resolve(
    currentUserDirectory,
    migrationPath,
  );

  try {
    const migrationFiles = fs.readdirSync(fullPathToMigrationPath);
    if (migrationFiles.length > 0) {
      return migrationFiles;
    }

    throw new Error(
      "No database migration files found on path: " + fullPathToMigrationPath,
    );
  } catch (error) {
    throw new Error(
      "No database migration files found on path: " + fullPathToMigrationPath,
    );
  }
}

export async function promisifySqliteQuery<T>(
  query: string,
  params: any,
  sqLiteConnection: sqlite3.Database,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    sqLiteConnection.get<T>(query, params, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
}
