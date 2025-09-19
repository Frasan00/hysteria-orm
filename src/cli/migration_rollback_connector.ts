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

export default async function rollbackMigrationsConnector(
  sql: SqlDataSource,
  rollBackUntil?: string,
  shouldExit: boolean = true,
  migrationPath?: string,
  tsconfigPath?: string,
  transactional?: boolean,
) {
  const dbType = sql.getDbType();
  logger.info("Rolling back migrations for database type: " + dbType);

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

    const tableMigrations = migrationTable.map((migration) => migration.name);
    const pendingMigrations = migrations.filter((migration) =>
      tableMigrations.includes(migration.migrationName),
    );

    if (pendingMigrations.length === 0) {
      logger.info("No pending migrations.");
      if (shouldExit) {
        await sql.closeConnection();
        process.exit(0);
      }
      return;
    }

    if (rollBackUntil) {
      const rollBackUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === rollBackUntil,
      );

      if (rollBackUntilIndex === -1) {
        logger.error(`Rollback until migration not found: ${rollBackUntil}`);
        process.exit(1);
      }

      const filteredMigrations = pendingMigrations.slice(rollBackUntilIndex);
      const migrator = new Migrator(sql);

      if (transactional) {
        await sql.rawQuery(BEGIN_TRANSACTION);
      }

      await migrator.downMigrations(filteredMigrations);

      if (transactional) {
        await sql.rawQuery(COMMIT_TRANSACTION);
      }

      logger.info("Migrations rolled back successfully");
      shouldExit && process.exit(0);
      return;
    }

    const migrator = new Migrator(sql);
    if (transactional) {
      await sql.rawQuery(BEGIN_TRANSACTION);
    }

    await migrator.downMigrations(pendingMigrations);

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

  logger.info("Migrations rolled back successfully");
  shouldExit && process.exit(0);
}
