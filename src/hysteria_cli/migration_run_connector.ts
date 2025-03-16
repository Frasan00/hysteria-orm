import dotenv from "dotenv";
import { Migration } from "../sql/migrations/migration";
import { MigrationController } from "../sql/migrations/migration_controller";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../sql/resources/query/TRANSACTION";
import { SqlDataSource } from "../sql/sql_data_source";
import { SqlDataSourceType } from "../sql/sql_data_source_types";
import logger from "../utils/logger";
import { getMigrations, getMigrationTable } from "./migration_utils";
import { MigrationTableType } from "./resources/migration_table_type";

dotenv.config();

export default async function runMigrationsConnector(
  runUntil?: string,
  verbose: boolean = false,
  tsconfigPath?: string,
  shouldExit: boolean = true,
) {
  logger.info("Running migrations for database type: " + process.env.DB_TYPE);

  await SqlDataSource.connect({
    type: process.env.DB_TYPE as SqlDataSourceType,
    logs: verbose,
  });
  await SqlDataSource.rawQuery(BEGIN_TRANSACTION);
  try {
    const migrationTable: MigrationTableType[] = await getMigrationTable(
      SqlDataSource.getInstance().getCurrentDriverConnection(),
    );
    const migrations: Migration[] = await getMigrations(tsconfigPath);
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
      const migrationController = new MigrationController(
        SqlDataSource.getInstance(),
      );
      await migrationController.upMigrations(filteredMigrations);
      await SqlDataSource.rawQuery(COMMIT_TRANSACTION);
      logger.info("Migrations ran successfully");
      shouldExit && process.exit(0);
      return;
    }

    const migrationController = new MigrationController(
      SqlDataSource.getInstance(),
    );

    await migrationController.upMigrations(pendingMigrations);

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
