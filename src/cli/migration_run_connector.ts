import { env } from "../env/env";
import { Migration } from "../sql/migrations/migration";
import { Migrator } from "../sql/migrations/migrator";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../sql/ast/transaction";
import { SqlDataSource } from "../sql/sql_data_source";
import {
  SqlDataSourceInput,
  SqlDataSourceType,
} from "../sql/sql_data_source_types";
import logger from "../utils/logger";
import { getMigrations, getMigrationTable } from "./migration_utils";
import { MigrationTableType } from "./resources/migration_table_type";

export default async function runMigrationsConnector(
  runUntil?: string,
  sqlDataSourceInput?: Partial<SqlDataSourceInput>,
  shouldExit: boolean = true,
  migrationPath?: string,
) {
  const dbType = sqlDataSourceInput?.type || env.DB_TYPE;
  if (!dbType) {
    logger.error("DB_TYPE is not set could not run migrations");
    process.exit(1);
  }

  logger.info("Running migrations for database type: " + dbType);

  await SqlDataSource.connect({
    type: dbType as SqlDataSourceType,
    ...sqlDataSourceInput,
  } as SqlDataSourceInput);
  await SqlDataSource.rawQuery(BEGIN_TRANSACTION);
  try {
    const migrationTable: MigrationTableType[] = await getMigrationTable(
      dbType as SqlDataSourceType,
      SqlDataSource.getInstance().getCurrentDriverConnection(),
    );
    const migrations: Migration[] = await getMigrations(
      dbType as SqlDataSourceType,
      migrationPath,
    );
    const pendingMigrations = migrations.filter(
      (migration) =>
        !migrationTable
          .map((table) => table.name)
          .includes(migration.migrationName),
    );

    if (pendingMigrations.length === 0) {
      logger.info("No pending migrations.");
      await SqlDataSource.closeConnection();
      shouldExit && process.exit(0);
      return;
    }

    if (runUntil) {
      const runUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === runUntil,
      );

      if (runUntilIndex === -1) {
        console.error(`Migration ${runUntil} not found.`);
        process.exit(1);
      }

      const filteredMigrations = pendingMigrations.slice(0, runUntilIndex + 1);
      const migrator = new Migrator();
      await migrator.upMigrations(filteredMigrations);
      await SqlDataSource.rawQuery(COMMIT_TRANSACTION);
      logger.info("Migrations ran successfully");
      shouldExit && process.exit(0);
      return;
    }

    const migrator = new Migrator();
    await migrator.upMigrations(pendingMigrations);

    await SqlDataSource.rawQuery(COMMIT_TRANSACTION);
  } catch (error: any) {
    await SqlDataSource.rawQuery(ROLLBACK_TRANSACTION);
    logger.error(error);
    process.exit(1);
  } finally {
    await SqlDataSource.closeConnection();
  }

  logger.info("Migrations ran successfully");
  shouldExit && process.exit(0);
}
