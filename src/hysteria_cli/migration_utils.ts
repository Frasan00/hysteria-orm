import fs from "node:fs";
import path from "node:path";
import { Migration } from "../sql/migrations/migration";
import dotenv from "dotenv";
import { MigrationTableType } from "./resources/migration_table_type";
import MigrationTemplates from "./resources/migration_templates";
import {
  MysqlConnectionInstance,
  PgClientInstance,
  SqlConnectionType,
  SqliteConnectionInstance,
} from "../sql/sql_data_source_types";
import { register, RegisterOptions } from "ts-node";
import { createRequire } from "module";

dotenv.config();
const customRequire = createRequire(__filename);

export async function getMigrationTable(
  sqlConnection: SqlConnectionType,
): Promise<MigrationTableType[]> {
  switch (process.env.DB_TYPE) {
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
      const pgConnection = sqlConnection as PgClientInstance;
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
      const resultSqlite =
        (await promisifySqliteQuery<MigrationTableType[]>(
          MigrationTemplates.selectAllFromMigrationsTemplate(),
          [],
          sqlConnection as SqliteConnectionInstance,
        )) || [];
      return Array.isArray(resultSqlite) ? resultSqlite : [resultSqlite];

    default:
      throw new Error("Unsupported database type");
  }
}

export async function getMigrations(
  tsconfigPath?: string,
): Promise<Migration[]> {
  const migrationNames = findMigrationNames();
  const migrations: Migration[] = [];

  for (const migrationName of migrationNames) {
    const migrationModule = await findMigrationModule(
      migrationName,
      tsconfigPath,
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
  tsconfigPath?: string,
): Promise<new () => Migration> {
  const isTs = pathToFile.endsWith(".ts");
  const tsNodeConfig: RegisterOptions = tsconfigPath
    ? { project: tsconfigPath }
    : {
        compilerOptions: {
          module: "CommonJS",
          target: "ES2019",
        },
      };

  if (isTs) {
    register({
      transpileOnly: true,
      ...tsNodeConfig,
    });
  }

  try {
    const migrationModule = customRequire(pathToFile);
    return migrationModule.default || migrationModule;
  } catch (error) {
    const migrationModule = await import(pathToFile);
    return migrationModule.default || migrationModule;
  }
}

async function findMigrationModule(
  migrationName: string,
  tsconfigPath?: string,
  migrationModulePath: string = process.env.MIGRATION_PATH
    ? process.env.MIGRATION_PATH + "/" + migrationName
    : "database/migrations/" + migrationName,
): Promise<new () => Migration> {
  const migrationPath = process.cwd() + "/" + migrationModulePath;
  const migrationModule = await loadMigrationModule(
    migrationPath,
    tsconfigPath,
  );

  if (!migrationModule) {
    throw new Error(
      "migrations module not found for migration: " + migrationName,
    );
  }

  return migrationModule;
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
  sqLiteConnection: SqliteConnectionInstance,
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
