import dotenv from "dotenv";
import logger from "../utils/logger";
import { SqlDataSource } from "../sql/sql_data_source";
import { MigrationTableType } from "./resources/migration_table_type";
import {
  BEGIN_TRANSACTION,
  COMMIT_TRANSACTION,
  ROLLBACK_TRANSACTION,
} from "../sql/resources/query/TRANSACTION";
import { Migration } from "../sql/migrations/migration";
import { getMigrations, getMigrationTable } from "./migration_utils";
import { MigrationController } from "../sql/migrations/migration_controller";

dotenv.config();

export default async function rollbackMigrationConnector(
  rollBackUntil?: string,
  tsconfigPath?: string,
  shouldExit: boolean = true,
) {
  logger.info(
    "Rolling back migrations for database type: " + process.env.DB_TYPE,
  );

  await SqlDataSource.connect();
  await SqlDataSource.rawQuery(BEGIN_TRANSACTION);
  try {
    const migrationTable: MigrationTableType[] = await getMigrationTable(
      SqlDataSource.getInstance().getCurrentDriverConnection(),
    );
    const migrations: Migration[] = await getMigrations(tsconfigPath);
    const tableMigrations = migrationTable.map((migration) => migration.name);
    const pendingMigrations = migrations.filter((migration) =>
      tableMigrations.includes(migration.migrationName),
    );

    if (pendingMigrations.length === 0) {
      logger.info("No pending migrations.");
      await SqlDataSource.closeConnection();
      shouldExit && process.exit(0);
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
      const migrationController: MigrationController = new MigrationController(
        SqlDataSource.getInstance(),
      );

      await migrationController.downMigrations(filteredMigrations);
      await SqlDataSource.rawQuery(COMMIT_TRANSACTION);
      logger.info("Migrations rolled back successfully");
      shouldExit && process.exit(0);
      return;
    }

    const migrationController: MigrationController = new MigrationController(
      SqlDataSource.getInstance(),
    );

    await migrationController.downMigrations(pendingMigrations);

    await SqlDataSource.rawQuery(COMMIT_TRANSACTION);
  } catch (error: any) {
    await SqlDataSource.rawQuery(ROLLBACK_TRANSACTION);
    logger.error(error);
    process.exit(1);
  } finally {
    await SqlDataSource.closeConnection();
  }

  logger.info("Migrations rolled back successfully");
  shouldExit && process.exit(0);
}
