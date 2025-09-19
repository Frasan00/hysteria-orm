import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../sql/ast/transaction";
import { Migration } from "../sql/migrations/migration";
import { Migrator } from "../sql/migrations/migrator";
import { type SqlDataSource } from "../sql/sql_data_source";
import { SqlDataSourceType } from "../sql/sql_data_source_types";
import logger from "../utils/logger";
import { getMigrations, getMigrationTable } from "./migration_utils";
import { MigrationTableType } from "./resources/migration_table_type";

export default async function runMigrationsConnector(
  sql: SqlDataSource,
  runUntil?: string,
  shouldExit: boolean = true,
  migrationPath?: string,
  tsconfigPath?: string,
  transactional?: boolean,
) {
  const dbType = sql.getDbType();
  logger.info("Running migrations for database type: " + dbType);

  try {
    const migrationTable: MigrationTableType[] = await getMigrationTable(
      dbType as SqlDataSourceType,
      sql.getPool(),
    );
    const migrations: Migration[] = await getMigrations(
      dbType as SqlDataSourceType,
      migrationPath,
      tsconfigPath,
    );

    const pendingMigrations = migrations.filter(
      (migration) =>
        !migrationTable
          .map((table) => table.name)
          .includes(migration.migrationName),
    );

    if (!pendingMigrations.length) {
      logger.info("No pending migrations.");
      await sql.closeConnection();
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
      const migrator = new Migrator(sql);

      if (transactional) {
        await sql.rawQuery(BEGIN_TRANSACTION);
      }

      await migrator.upMigrations(filteredMigrations);

      if (transactional) {
        await sql.rawQuery(COMMIT_TRANSACTION);
      }

      logger.info("Migrations ran successfully");
      shouldExit && process.exit(0);
      return;
    }

    const migrator = new Migrator(sql);
    if (transactional) {
      await sql.rawQuery(BEGIN_TRANSACTION);
    }

    await migrator.upMigrations(pendingMigrations);

    if (transactional) {
      await sql.rawQuery(COMMIT_TRANSACTION);
    }
  } catch (error: any) {
    if (transactional) {
      await sql.rawQuery(ROLLBACK_TRANSACTION);
    }

    logger.error(error);
    process.exit(1);
  } finally {
    if (shouldExit) {
      await sql.closeConnection();
    }
  }

  logger.info("Migrations ran successfully");
  shouldExit && process.exit(0);
}
