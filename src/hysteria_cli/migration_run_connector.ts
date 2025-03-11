import dotenv from "dotenv";
import logger from "../utils/logger";
import { SqlDataSource } from "../sql/sql_data_source";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../sql/resources/query/TRANSACTION";
import { MigrationTableType } from "./resources/migration_table_type";
import { Migration } from "../sql/migrations/migration";
import { getMigrations, getMigrationTable } from "./migration_utils";
import { MigrationController } from "../sql/migrations/migration_controller";

dotenv.config();

export default async function runMigrationsConnector(
  runUntil?: string,
  tsconfigPath?: string,
  shouldExit: boolean = true,
) {
  logger.info("Running migrations for database type: " + process.env.DB_TYPE);

  await SqlDataSource.connect();
  try {
    await SqlDataSource.rawQuery(BEGIN_TRANSACTION);
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
        throw new Error(`Migration ${runUntil} not found.`);
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
