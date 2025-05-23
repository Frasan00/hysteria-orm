import fs from "node:fs";
import path, { join } from "node:path";
import { env } from "../env/env";
import { HysteriaError } from "../errors/hysteria_error";
import { Migration } from "../sql/migrations/migration";
import type {
  MysqlConnectionInstance,
  PgPoolClientInstance,
  SqlConnectionType,
  SqliteConnectionInstance,
} from "../sql/sql_data_source_types";
import { MigrationTableType } from "./resources/migration_table_type";
import MigrationTemplates from "./resources/migration_templates";

export async function getMigrationTable(
  sqlConnection: SqlConnectionType,
): Promise<MigrationTableType[]> {
  switch (env.DB_TYPE) {
    case "mariadb":
    case "mysql":
      const mysqlConnection = sqlConnection as MysqlConnectionInstance;
      await mysqlConnection.query(
        MigrationTemplates.migrationTableTemplateMysql(),
      );
      const result = await mysqlConnection.query(
        MigrationTemplates.selectAllFromMigrationsTemplate(),
      );
      return result[0] as MigrationTableType[];

    case "postgres":
    case "cockroachdb":
      const pgConnection = sqlConnection as PgPoolClientInstance;
      await pgConnection.query(MigrationTemplates.migrationTableTemplatePg());
      const pgResult = await pgConnection.query(
        MigrationTemplates.selectAllFromMigrationsTemplate(),
      );
      return pgResult.rows as MigrationTableType[];

    case "sqlite":
      await promisifySqliteQuery(
        MigrationTemplates.migrationTableTemplateSQLite(),
        [],
        sqlConnection as SqliteConnectionInstance,
      );

      return (
        (await promisifySqliteQuery<MigrationTableType>(
          MigrationTemplates.selectAllFromMigrationsTemplate(),
          [],
          sqlConnection as SqliteConnectionInstance,
        )) || []
      );

    default:
      throw new HysteriaError(
        "MigrationUtils::getMigrationTable Unsupported database type",
        "DEVELOPMENT_ERROR",
      );
  }
}

export async function getMigrations(
  migrationPath?: string,
): Promise<Migration[]> {
  const migrationNames = findMigrationNames(migrationPath);
  const migrations: Migration[] = [];

  for (const migrationName of migrationNames) {
    const migrationModule = await findMigrationModule(
      migrationName,
      migrationPath,
    );
    const migration: Migration = new migrationModule();
    migration.migrationName = migrationName;
    migrations.push(migration);
  }

  return migrations;
}

export function getPendingMigrations(
  migrations: Migration[],
  migrationTable: MigrationTableType[],
): Migration[] {
  return migrations.filter((migration) => {
    const migrationName = migration.migrationName;
    const migrationEntry = migrationTable.find(
      (migration) => migration.name === migrationName,
    );

    return !migrationEntry;
  });
}

async function loadMigrationModule(
  pathToFile: string,
): Promise<new () => Migration> {
  try {
    const migrationModule = await import(pathToFile);
    if (!migrationModule.default) {
      throw new HysteriaError(
        "MigrationUtils::loadMigrationModule Migration module does not have a default export",
        "MIGRATION_MODULE_NOT_FOUND",
      );
    }

    return migrationModule.default;
  } catch (error: any) {
    if (
      error &&
      typeof error === "object" &&
      Object.values(error).length &&
      error instanceof TypeError &&
      Object.prototype.hasOwnProperty.call(error, "message") &&
      error.message.includes(`Unknown file extension ".ts"`)
    ) {
      throw new HysteriaError(
        "MigrationUtils::loadMigrationModule\nMust have `ts-node` installed to run typescript migrations\nTypescript Migrations are meant to be used only in development environment that has `ts-node` installed\n It's advised to build typescript migrations into javascript if in production",
        "MIGRATION_MODULE_REQUIRES_TS_NODE",
      );
    }

    throw error;
  }
}

async function findMigrationModule(
  migrationName: string,
  migrationModulePath: string = env.MIGRATION_PATH || "migrations",
): Promise<new () => Migration> {
  migrationModulePath = join(migrationModulePath, migrationName);
  const migrationPath = path.resolve(process.cwd(), migrationModulePath);
  const migrationModule = await loadMigrationModule(migrationPath);

  if (!migrationModule) {
    throw new HysteriaError(
      "MigrationUtils::findMigrationModule migrations module not found for migration: " +
        migrationName,
      "MIGRATION_MODULE_NOT_FOUND",
    );
  }

  return migrationModule;
}

function findMigrationNames(inputMigrationPath?: string): string[] {
  const currentUserDirectory = process.cwd();
  const migrationPath = path.resolve(
    inputMigrationPath || env.MIGRATION_PATH || "migrations",
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

    throw new HysteriaError(
      "MigrationUtils::findMigrationNames No database migration files found on path: " +
        fullPathToMigrationPath,
      "MIGRATION_MODULE_NOT_FOUND",
    );
  } catch (error) {
    throw new HysteriaError(
      "MigrationUtils::findMigrationNames No database migration files found on path: " +
        fullPathToMigrationPath,
      "MIGRATION_MODULE_NOT_FOUND",
    );
  }
}

export async function promisifySqliteQuery<T>(
  query: string,
  params: any,
  sqLiteConnection: SqliteConnectionInstance,
): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    sqLiteConnection.all<T>(query, params, (err, results) => {
      if (err) {
        reject(err);
      }
      resolve(results);
    });
  });
}
