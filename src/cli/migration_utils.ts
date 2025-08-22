import fs from "node:fs";
import path, { join } from "node:path";
import { pathToFileURL } from "url";
import { env } from "../env/env";
import { HysteriaError } from "../errors/hysteria_error";
import { Migration } from "../sql/migrations/migration";
import type {
  MysqlConnectionInstance,
  PgPoolClientInstance,
  SqlConnectionType,
  SqlDataSourceType,
  SqliteConnectionInstance,
} from "../sql/sql_data_source_types";
import { MigrationTableType } from "./resources/migration_table_type";
import MigrationTemplates from "./resources/migration_templates";
import { createRequire } from "node:module";
import { importTsUniversal } from "../utils/importer";

const importMigrationFile = async (filePath: string, tsconfigPath?: string) => {
  const isTs = filePath.endsWith(".ts");
  if (isTs) {
    await import("typescript").catch(() => {
      throw new HysteriaError(
        "MigrationUtils::importMigrationFile In order to use TypeScript migrations, you must have `typeScript` installed in your project. Please install it with `npm install typescript --save-dev`, if you're in a production environment, it's recommended to transpile your migrations to JavaScript before running the application.",
        "MIGRATION_MODULE_NOT_FOUND",
      );
    });

    await import("esbuild").catch(() => {
      throw new HysteriaError(
        "MigrationUtils::importMigrationFile In order to use TypeScript migrations, you must have `esbuild` installed in your project. Please install it with `npm install esbuild --save-dev`, if you're in a production environment, it's recommended to transpile your migrations to JavaScript before running the application.",
        "MIGRATION_MODULE_NOT_FOUND",
      );
    });

    await import("bundle-require").catch(() => {
      throw new HysteriaError(
        "MigrationUtils::importMigrationFile In order to use TypeScript migrations, you must have `bundle-require` installed in your project. Please install it with `npm install bundle-require --save-dev`, if you're in a production environment, it's recommended to transpile your migrations to JavaScript before running the application.",
        "MIGRATION_MODULE_NOT_FOUND",
      );
    });

    return importTsUniversal(filePath, tsconfigPath);
  }

  try {
    const fileUrl = pathToFileURL(filePath).href;
    return import(fileUrl);
  } catch (error) {
    const require = createRequire(import.meta.url);
    try {
      const module = require(filePath);
      return {
        default: module.default || module,
        ...module,
      };
    } catch (requireError) {
      throw new HysteriaError(
        `MigrationUtils::importMigrationFile Failed to import migration file: ${filePath}. Both ESM and CommonJS imports failed.`,
        "MIGRATION_MODULE_NOT_FOUND",
      );
    }
  }
};

export async function getMigrationTable(
  dbType: SqlDataSourceType,
  sqlConnection: SqlConnectionType,
): Promise<MigrationTableType[]> {
  switch (dbType) {
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
  dbType: SqlDataSourceType,
  migrationPath?: string,
  tsconfigPath?: string,
): Promise<Migration[]> {
  const migrationNames = findMigrationNames(migrationPath);
  const migrations: Migration[] = [];

  for (const migrationName of migrationNames) {
    const migrationModule = await findMigrationModule(
      migrationName,
      migrationPath,
      tsconfigPath,
    );

    const migration: Migration = new migrationModule(dbType || env.DB_TYPE);
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
  tsconfigPath?: string,
): Promise<new (dbType: SqlDataSourceType) => Migration> {
  const migrationModule = await importMigrationFile(pathToFile, tsconfigPath);
  if (!migrationModule.default) {
    throw new HysteriaError(
      "MigrationUtils::loadMigrationModule Migration module does not have a default export",
      "MIGRATION_MODULE_NOT_FOUND",
    );
  }

  return migrationModule.default;
}

async function findMigrationModule(
  migrationName: string,
  migrationModulePath: string = env.MIGRATION_PATH || "database/migrations",
  tsconfigPath?: string,
): Promise<new (dbType: SqlDataSourceType) => Migration> {
  migrationModulePath = join(migrationModulePath, migrationName);
  const migrationPath = path.resolve(process.cwd(), migrationModulePath);
  const migrationModule = await loadMigrationModule(
    migrationPath,
    tsconfigPath,
  );

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
    inputMigrationPath || env.MIGRATION_PATH || "database/migrations",
  );

  const fullPathToMigrationPath = path.resolve(
    currentUserDirectory,
    migrationPath,
  );

  try {
    const migrationFiles = fs
      .readdirSync(fullPathToMigrationPath)
      .filter((file) => {
        const ext = path.extname(file);
        const fullFilePath = path.join(fullPathToMigrationPath, file);
        const isFile = fs.statSync(fullFilePath).isFile();
        return isFile && (ext === ".ts" || ext === ".js");
      });

    if (migrationFiles.length) {
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
