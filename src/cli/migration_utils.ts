import fs from "node:fs";
import path, { join } from "node:path";
import ts from "typescript";
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

const importMigrationFile = async (
  filePath: string,
  transpiledMigrationFolder: string,
) => {
  const isTs = filePath.endsWith(".ts");
  if (isTs) {
    // If ts file, transpile to js and write to tmp transpiled folder
    const transpiled = ts.transpileModule(fs.readFileSync(filePath, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        noEmitOnError: true,
        noEmit: true,
        strict: true,
        skipLibCheck: true,
      },
    });

    if (!fs.existsSync(transpiledMigrationFolder)) {
      fs.mkdirSync(transpiledMigrationFolder, { recursive: true });
    }

    const transpiledFilePath = path.resolve(
      transpiledMigrationFolder,
      path.basename(filePath),
    );

    const jsFilePath = transpiledFilePath.replace(".ts", ".js");
    fs.writeFileSync(jsFilePath, transpiled.outputText);
    filePath = jsFilePath;
  }

  const fileUrl = pathToFileURL(filePath).href;
  return import(fileUrl);
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
): Promise<Migration[]> {
  const migrationNames = findMigrationNames(migrationPath);
  const migrations: Migration[] = [];

  for (const migrationName of migrationNames) {
    const migrationModule = await findMigrationModule(
      migrationName,
      migrationPath,
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
): Promise<new (dbType: SqlDataSourceType) => Migration> {
  const transpiledMigrationFolder = path.resolve(
    path.dirname(pathToFile),
    "transpiled",
  );

  try {
    const migrationModule = await importMigrationFile(
      pathToFile,
      transpiledMigrationFolder,
    );

    // Cleanup
    if (fs.existsSync(transpiledMigrationFolder)) {
      fs.rmSync(transpiledMigrationFolder, { recursive: true });
    }

    if (!migrationModule.default) {
      throw new HysteriaError(
        "MigrationUtils::loadMigrationModule Migration module does not have a default export",
        "MIGRATION_MODULE_NOT_FOUND",
      );
    }

    return migrationModule.default;
  } catch (error) {
    // Cleanup
    if (fs.existsSync(transpiledMigrationFolder)) {
      fs.rmSync(transpiledMigrationFolder, { recursive: true });
    }

    throw error;
  }
}

async function findMigrationModule(
  migrationName: string,
  migrationModulePath: string = env.MIGRATION_PATH || "migrations",
): Promise<new (dbType: SqlDataSourceType) => Migration> {
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
