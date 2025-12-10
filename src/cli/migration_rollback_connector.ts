import { Migration } from "../sql/migrations/migration";
import { Migrator } from "../sql/migrations/migrator";
import { type SqlDataSource } from "../sql/sql_data_source";
import {
  AugmentedSqlDataSource,
  SqlDataSourceType,
} from "../sql/sql_data_source_types";
import { Transaction } from "../sql/transactions/transaction";
import logger from "../utils/logger";
import { getMigrations, getMigrationTable } from "./migration_utils";
import { MigrationTableType } from "./resources/migration_table_type";

export default async function rollbackMigrationsConnector(
  sql: SqlDataSource | AugmentedSqlDataSource,
  rollBackUntil?: string,
  migrationPath?: string,
  tsconfigPath?: string,
  transactional?: boolean,
) {
  const dbType = sql.getDbType();
  const shouldUseTransaction = transactional && dbType !== "mssql";
  let trx: Transaction | null = null;
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
      return;
    }

    if (rollBackUntil) {
      const rollBackUntilIndex = pendingMigrations.findIndex(
        (migration) => migration.migrationName === rollBackUntil,
      );

      if (rollBackUntilIndex === -1) {
        logger.error(`Rollback until migration not found: ${rollBackUntil}`);
        return;
      }

      const filteredMigrations = pendingMigrations.slice(rollBackUntilIndex);

      if (shouldUseTransaction) {
        trx = await sql.startTransaction();
        sql = trx.sql as SqlDataSource;
      }

      const migrator = new Migrator(sql);
      await migrator.downMigrations(filteredMigrations);

      if (shouldUseTransaction) {
        await trx?.commit();
      }

      logger.info("Migrations rolled back successfully");
      return;
    }

    const migrator = new Migrator(sql);
    if (shouldUseTransaction) {
      trx = await sql.startTransaction();
      sql = trx.sql as SqlDataSource;
    }

    await migrator.downMigrations(pendingMigrations);

    if (shouldUseTransaction) {
      await trx?.commit();
    }
  } catch (error: any) {
    if (shouldUseTransaction) {
      await trx?.rollback();
    }

    throw error;
  }

  logger.info("Migrations rolled back successfully");
}
