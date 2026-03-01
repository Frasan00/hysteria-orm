import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "url";
import { env } from "../env/env";
import { HysteriaError } from "../errors/hysteria_error";
import { Migration } from "../sql/migrations/migration";
import type {
  MssqlPoolInstance,
  MysqlConnectionInstance,
  OracleDBPoolInstance,
  PgPoolClientInstance,
  SqlDataSourceType,
  SqliteConnectionInstance,
  SqlPoolType,
} from "../sql/sql_data_source_types";
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
  sqlConnection: SqlPoolType,
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

    case "mssql":
      const mssqlConnection = sqlConnection as MssqlPoolInstance;
      await mssqlConnection
        .request()
        .query(MigrationTemplates.migrationTableTemplateMssql());
      const mssqlResult = await mssqlConnection
        .request()
        .query(MigrationTemplates.selectAllFromMigrationsTemplate());
      return mssqlResult.recordset as MigrationTableType[];

    case "oracledb":
      const oraclePool = sqlConnection as OracleDBPoolInstance;
      const oracleConnection = await oraclePool.getConnection();
      try {
        try {
          await oracleConnection.execute(
            MigrationTemplates.migrationTableTemplateOracle(),
          );
        } catch (err: any) {
          if (err.errorNum !== 955) {
            throw err;
          }
        }
        // Oracle requires quoted identifiers to match case from CREATE TABLE
        const oracleResult = await oracleConnection.execute(
          `SELECT * FROM "migrations"`,
        );
        // Oracle returns rows as arrays: [id, name, timestamp]
        return (oracleResult.rows || []).map((row: any) => ({
          id: row[0],
          name: row[1],
          timestamp: row[2],
        })) as MigrationTableType[];
      } finally {
        await oracleConnection.close();
      }

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
    (migration as any).migrationName = name;
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
