import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "url";
import { env } from "../env/env";
import { HysteriaError } from "../errors/hysteria_error";
import { Migration } from "../sql/migrations/migration";
import { type SqlDataSource } from "../sql/sql_data_source";
import { SqlDataSourceType } from "../sql/sql_data_source_types";
import { importTsUniversal } from "../utils/importer";
import { MigrationTableType } from "./resources/migration_table_type";
import MigrationTemplates from "./resources/migration_templates";

const importMigrationFile = async (filePath: string, tsconfigPath?: string) => {
  const isTs = filePath.endsWith(".ts");
  if (isTs) {
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
  sql: SqlDataSource,
): Promise<MigrationTableType[]> {
  switch (dbType) {
    case "mariadb":
    case "mysql":
      await sql.rawQuery(MigrationTemplates.migrationTableTemplateMysql());
      const mysqlResult = await sql.rawQuery(
        MigrationTemplates.selectAllFromMigrationsTemplate(),
      );
      return (mysqlResult as any[])[0] as MigrationTableType[];

    case "postgres":
    case "cockroachdb":
      await sql.rawQuery(MigrationTemplates.migrationTableTemplatePg());
      const pgResult = await sql.rawQuery(
        MigrationTemplates.selectAllFromMigrationsTemplate(),
      );
      return (pgResult as { rows: MigrationTableType[] }).rows;

    case "sqlite":
      await sql.rawQuery(MigrationTemplates.migrationTableTemplateSQLite());
      return (await sql.rawQuery(
        MigrationTemplates.selectAllFromMigrationsTemplate(),
      )) as MigrationTableType[];

    case "mssql":
      await sql.rawQuery(MigrationTemplates.migrationTableTemplateMssql());
      const mssqlResult = await sql.rawQuery(
        MigrationTemplates.selectAllFromMigrationsTemplate(),
      );
      return (mssqlResult as { recordset: MigrationTableType[] }).recordset;

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
  const migrationFiles = findMigrationFiles(migrationPath);
  const migrations: Migration[] = [];

  for (const { name, fullPath } of migrationFiles) {
    const migrationModule = await loadMigrationModule(fullPath, tsconfigPath);
    const migration: Migration = new migrationModule(dbType || env.DB_TYPE);
    (migration as { migrationName: string }).migrationName = name;
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

function findMigrationFiles(
  inputMigrationPath?: string,
): { name: string; fullPath: string }[] {
  const cwd = process.cwd();
  const migrationPath =
    inputMigrationPath || env.MIGRATION_PATH || "database/migrations";
  const isGlob = /[*?{}\[\]]/.test(migrationPath);

  // For plain directory paths, auto-create if missing and expand to recursive glob
  if (!isGlob) {
    const dirPath = path.isAbsolute(migrationPath)
      ? migrationPath
      : path.resolve(cwd, migrationPath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      return [];
    }
  }

  const pattern = isGlob
    ? migrationPath
    : path.join(migrationPath, "**/*.{ts,js}");
  const fullPattern = path.isAbsolute(pattern)
    ? pattern
    : path.resolve(cwd, pattern);

  try {
    const files = fs.globSync(fullPattern);
    return files
      .filter((f) => fs.statSync(f).isFile())
      .sort()
      .map((f) => ({ name: path.basename(f), fullPath: f }));
  } catch {
    return [];
  }
}
